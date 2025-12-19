const mongoose = require("mongoose");
const Nissan_Draws = require("../models/Nissan_Draws.model.js");
const Team = require("../models/Team.model.js");

exports.createDrawforEvent = async (eventId) => {
  try {
    await Nissan_Draws.deleteMany({ Event: eventId });

    const teams = await Team.find({ eventId }).sort({ rank: "asc" });
    const numTeams = teams.length;

    if (numTeams < 2) {
      throw new Error("Not enough teams for a draw.");
    }

    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
    const numRounds = Math.log2(bracketSize);
    const byes = bracketSize - numTeams;

    // --- Build top-to-bottom bracket seed order ---
    function buildBracketSlots(n) {
      if (n === 1) return [1];
      const half = buildBracketSlots(n / 2);
      const mirror = half.map((x) => n + 1 - x);
      const out = [];
      for (let i = 0; i < half.length; i++) {
        out.push(half[i]);
        out.push(mirror[i]);
      }
      return out;
    }
    const slots = buildBracketSlots(bracketSize);

    let matches = [];
    let matchNum = 1;

    // --- Create Round 1 matches in visual bracket order ---
    for (let i = 0; i < slots.length; i += 2) {
      const seedA = slots[i];
      const seedB = slots[i + 1];

      const teamA = seedA <= numTeams ? teams[seedA - 1]._id : null;
      const teamB = seedB <= numTeams ? teams[seedB - 1]._id : null;

      // Skip match if both are empty
      if (teamA === null && teamB === null) continue;

      let winner = null;
      let status = "Upcoming"; // Default status

      if (teamA && teamB === null) { // Team A is playing a BYE
        winner = teamA;
        status = "Completed";
      } else if (teamB && teamA === null) { // Team B is playing a BYE
        winner = teamB;
        status = "Completed";
      }

      matches.push({
        Event: eventId,
        Stage: "Round 1",
        Match_number: matchNum++,
        Team1: teamA,
        Team2: teamB,
        Winner: winner, // Set winner for BYE matches
        Status: status,
      });
      console.log(`[Backend Create] Round 1 Match: ${matches[matches.length - 1].Match_number}`);
    }

    // --- Create subsequent rounds with null teams ---
    let numMatchesInNextRound = bracketSize / 4; // Matches in Round 2
    for (let round = 2; round <= numRounds; round++) {
      let roundMatchNum = 1; // Reset match number for each new round
      for (let i = 0; i < numMatchesInNextRound; i++) {
        matches.push({
          Event: eventId,
          Stage: `Round ${round}`,
          Match_number: roundMatchNum++,
          Team1: null,
          Team2: null,
        });
        console.log(`[Backend Create] Round ${round} Match: ${matches[matches.length - 1].Match_number}`);
      }
      numMatchesInNextRound /= 2;
    }

    const insertedMatches = await Nissan_Draws.insertMany(matches);

    // --- Propagate winners for BYE matches immediately after creation ---
    // Iterate through the insertedMatches to get the _id
    for (const match of insertedMatches) { // Use insertedMatches here
      if (match.Winner && match.Status === "Completed") {
        console.log(`[Backend Create] Propagating BYE winner for match ID: ${match._id}, Winner ID: ${match.Winner}`);
        await exports.updateDraw(match._id, { Winner: match.Winner, Status: "Completed" });
      }
    }

    return { message: "Draws created successfully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getDrawsByEvent = async (eventId) => {
  try {
    const draws = await Nissan_Draws.find({ Event: eventId })
      .populate({
        path: "Team1",
        populate: { path: "partner1 partner2", select: "name" },
      })
      .populate({
        path: "Team2",
        populate: { path: "partner1 partner2", select: "name" },
      })
      .populate("Winner");
    return draws;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateDraw = async (drawId, updateData) => {
  try {
    console.log(`[Backend UpdateDraw] Called for drawId: ${drawId}, updateData:`, updateData);
    const updatedDraw = await Nissan_Draws.findByIdAndUpdate(
      drawId,
      updateData,
      { new: true }
    );
    console.log(`[Backend UpdateDraw] updatedDraw result:`, updatedDraw);

    // --- Winner Propagation Logic ---
    // Check if a winner was set OR UNSET for the current match
    if (updatedDraw) { // Ensure the match was found and updated
      const currentMatch = updatedDraw;
      const currentMatchNumber = currentMatch.Match_number;
      const currentStage = currentMatch.Stage;
      const eventId = currentMatch.Event;

      console.log(`[Backend] Processing match ${currentMatch._id} (Match_number: ${currentMatchNumber}, Stage: ${currentStage})`);
      console.log(`[Backend] Current Winner ID: ${currentMatch.Winner}`);

      // Determine the next stage (e.g., "Round 1" -> "Round 2")
      const currentRoundNumber = parseInt(currentStage.replace("Round ", ""));
      const nextRoundNumber = currentRoundNumber + 1;
      const nextStage = `Round ${nextRoundNumber}`;

      // Calculate the next match number
      const nextMatchNumber = Math.ceil(currentMatchNumber / 2);

      // Determine the winner's slot in the next match
      const slotType = currentMatchNumber % 2 !== 0 ? "Team1" : "Team2"; // Odd -> Team1, Even -> Team2

      console.log(`[Backend] Next Stage: ${nextStage}, Next Match Number: ${nextMatchNumber}, Slot Type: ${slotType}`);

      // Find the next match
      const nextMatch = await Nissan_Draws.findOne({
        Event: eventId,
        Stage: nextStage,
        Match_number: nextMatchNumber,
      });

      if (nextMatch) {
        console.log(`[Backend] Found next match: ${nextMatch._id} (Stage: ${nextMatch.Stage}, Match_number: ${nextMatch.Match_number})`);

        if (currentMatch.Winner) { // Winner was set for currentMatch, propagate it
          const winnerId = currentMatch.Winner;
          const updateNextMatchData = {
            [slotType]: winnerId,
          };
          await Nissan_Draws.findByIdAndUpdate(nextMatch._id, updateNextMatchData);
          console.log(`[Backend] Updated next match ${nextMatch._id} with winner ${winnerId} in slot ${slotType}`);
        } else { // Winner was unset for currentMatch, so clear the next match's slot
          console.log(`[Backend] Winner unset for match ${currentMatch._id}. Clearing slot in next match ${nextMatch._id}.`);
          const clearNextMatchData = {
            [slotType]: null, // Set the slot to null
          };
          await Nissan_Draws.findByIdAndUpdate(nextMatch._id, clearNextMatchData);

          // Recursively clear subsequent matches if they become empty
          // If the nextMatch had a winner, and that winner was the team we just cleared from its slot,
          // then clear the winner of nextMatch. This will trigger a cascade.
          // We need to check if nextMatch.Winner is the ID of the team that was just cleared.
          // The team that was just cleared from the slot is the one that was previously in that slot.
          // This is tricky with findByIdAndUpdate.

          // A simpler recursive clear:
          // If the nextMatch's winner is the team that was just cleared from its slot,
          // then clear the nextMatch's winner and status.
          // This will trigger a recursive call to updateDraw for the next match.
          const clearedTeamId = nextMatch[slotType]; // This is the team that *was* in the slot before we set it to null
          if (clearedTeamId && nextMatch.Winner && nextMatch.Winner.toString() === clearedTeamId.toString()) {
              await exports.updateDraw(nextMatch._id, { Winner: null, Status: "Upcoming" });
          }
        }
      } else {
        console.log(`[Backend] Next match not found for Stage: ${nextStage}, Match_number: ${nextMatchNumber}`);
      }
    }

    return updatedDraw;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.deleteDraw = async (drawId) => {
  try {
    await Nissan_Draws.findByIdAndDelete(drawId);
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateDrawOrder = async (orderedMatches) => {
  try {
    const promises = orderedMatches.map((matchId, index) => {
      return Nissan_Draws.findByIdAndUpdate(matchId, {
        Match_number: index + 1,
      });
    });
    await Promise.all(promises);
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateMatchup = async (matchId, teamField, teamId) => {
  try {
    console.log(matchId + " " + teamField + " " + teamId);
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      throw new Error(`Invalid matchId: ${matchId}`);
    }

    if (teamId && !mongoose.Types.ObjectId.isValid(teamId)) {
      throw new Error(`Invalid teamId: ${teamId}`);
    }

    const updateData = { [teamField]: teamId ? teamId : null };
    await Nissan_Draws.findByIdAndUpdate(matchId, updateData);
  } catch (error) {
    console.error("Error in updateMatchup service:", error);
    throw new Error(error.message);
  }
};

exports.swapMatchup = async (
  sourceMatchId,
  sourceSlotType,
  targetMatchId,
  targetSlotType,
  draggedTeamId,
  originalTargetTeamId
) => {
  try {
    // Update target slot with dragged team
    const updateTargetData = {
      [targetSlotType]: draggedTeamId ? draggedTeamId : null,
    };
    await Nissan_Draws.findByIdAndUpdate(targetMatchId, updateTargetData);

    // Update source slot with original target team
    const updateSourceData = {
      [sourceSlotType]: originalTargetTeamId ? originalTargetTeamId : null,
    };
    await Nissan_Draws.findByIdAndUpdate(sourceMatchId, updateSourceData);
  } catch (error) {
    console.error("Error in swapMatchup service:", error);
    throw new Error(error.message);
  }
};




exports.updateTime = async (matchTime, drawId) => {
  try {
    const updatedDraw = await Nissan_Draws.findByIdAndUpdate(
      drawId,
      { MatchTime: matchTime },
      { new: true, runValidators: true }
    );

    if (!updatedDraw) {
      throw new Error("Draw not found");
    }

    return updatedDraw;
  } catch (error) {
    console.error("Error in Updating Time service:", error);
    throw new Error(error.message);
  }
};

/* =========================
   UPDATE COURT NUMBER
   ========================= */
exports.updateCourt = async (matchCourt, drawId) => {
  try {
    // Optional safety check
    if (![1, 2, 3, 4].includes(matchCourt)) {
      throw new Error("Invalid court number");
    }

    const updatedDraw = await Nissan_Draws.findByIdAndUpdate(
      drawId,
      { CourtNumber: matchCourt },
      { new: true, runValidators: true }
    );

    if (!updatedDraw) {
      throw new Error("Draw not found");
    }

    return updatedDraw;
  } catch (error) {
    console.error("Error in Updating Court service:", error);
    throw new Error(error.message);
  }
};