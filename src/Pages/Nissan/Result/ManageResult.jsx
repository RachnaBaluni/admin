import React, { useState, useEffect, memo, useCallback } from "react";
import api from "../../../api";
import styles from "./ManageResult.module.css"; // Will create this CSS file
import { toast } from "sonner";

const Match = ({
  team,
  isWinnerSlot = false,
  roundIndex,
  matchId,
  slotType, // "Team1" or "Team2"
  opponentTeam,
  onUpdateMatch,
  matchWinnerId,
  onScoreChange, // New prop
  initialScore, // New prop
  onScoreSave, // New prop for saving score to backend
}) => {
  let teamDisplayName;
  if (isWinnerSlot) {
    teamDisplayName = "Winner";
  } else if (!team) {
    teamDisplayName = roundIndex === 0 ? "BYE" : "TBD";
  } else {
    teamDisplayName = `${team.partner1?.name || "Unknown"} ${
      team.partner2 ? `& ${team.partner2?.name || "Unknown"}` : ""
    }`;
  }

  const [displayScore, setDisplayScore] = useState(initialScore || ""); // Initialize with initialScore

  useEffect(() => {
    setDisplayScore(initialScore || ""); // Update if initialScore changes
  }, [initialScore]);

  // Determine if this team is the winner or loser
  const isWinner = team && matchWinnerId && team._id === matchWinnerId;
  const isLoser = team && matchWinnerId && opponentTeam && opponentTeam._id === matchWinnerId;

  const handleMatchSlotClick = async () => {
    if (!team || isWinnerSlot) { // Cannot select BYE/TBD or Winner slot
      return;
    }

    let newWinnerId = null;
    let newStatus = "Upcoming"; // Default status if winner is unselected

    if (matchWinnerId) { // A winner is already set for this match
      if (team._id === matchWinnerId) {
        // Clicking on the current winner: unselect winner
        // BLOCK DESELECTING IF OPPONENT WAS A BYE
        if (opponentTeam === null) { // If opponent was a BYE
          toast.error("Cannot deselect winner for BYE matches.");
          return; // Block the deselection
        }
        newWinnerId = null;
        newStatus = "Upcoming"; // Or "In Progress" depending on desired behavior
      } else {
        // Clicking on the current loser: make it the new winner
        newWinnerId = team._id;
        newStatus = "Completed";
      }
    } else {
      // No winner yet: make the clicked team the winner
      newWinnerId = team._id;
      newStatus = "Completed";
    }

    await onUpdateMatch(matchId, { Winner: newWinnerId, Status: newStatus });
  };

  return (
    <div
      className={`${styles.matchSlot} ${isWinner ? styles.winner : ""} ${
        (isLoser || (!team && teamDisplayName === "BYE")) ? styles.loser : ""
      }`}
      onClick={handleMatchSlotClick}
    >
      <div
        className={styles.teamName} // No onClick here
      >
        {teamDisplayName}
      </div>
      {!isWinnerSlot &&
        team &&
        opponentTeam && (
          <input
            type="text"
            placeholder="0-0"
            value={displayScore}
            onChange={(e) => {
              setDisplayScore(e.target.value);
              onScoreChange(matchId, slotType, e.target.value); // Pass score change up to Round's local state
            }}
            onBlur={() => { // New onBlur handler
              // Allow score changes even if winner is decided
              onScoreSave(matchId, slotType, displayScore); // Trigger save to backend
            }}
            onClick={(e) => e.stopPropagation()} // <--- Add this line
            className={styles.teamScoreInput}
          />
        )}
    </div>
  );
};

const Round = memo(
  ({ title, matches, roundIndex, totalRounds, onUpdateMatch }) => {
    const isLastRound = totalRounds - 1;

    // State to manage scores for each match within this round
    const [matchScores, setMatchScores] = useState(() => {
      const initialScores = {};
      matches.forEach(match => {
        const [score1 = "", score2 = ""] = match.Score ? match.Score.split(" + ") : ["", ""];
        initialScores[match._id] = {
          Team1: score1,
          Team2: score2,
        };
      });
      return initialScores;
    });

    // Handler for score changes from Match components (local state)
    const handleScoreChange = useCallback((matchId, slotType, newScore) => {
      setMatchScores(prevScores => ({
        ...prevScores,
        [matchId]: {
          ...prevScores[matchId],
          [slotType]: newScore,
        },
      }));
    }, []);

    // Handler for saving score to backend (onBlur from Match component)
    const handleScoreSave = useCallback(async (matchId, slotType, newScore) => {
      console.log(`[Frontend Round] handleScoreSave called for matchId: ${matchId}, slotType: ${slotType}, newScore: ${newScore}`);
      // Get the current scores for this match from the state
      const currentScoresForMatch = matchScores[matchId];
      console.log(`[Frontend Round] currentScoresForMatch (before update):`, currentScoresForMatch);

      let team1Score = currentScoresForMatch.Team1;
      let team2Score = currentScoresForMatch.Team2;

      // Update the specific score that just changed
      if (slotType === "Team1") {
        team1Score = newScore;
      } else if (slotType === "Team2") {
        team2Score = newScore;
      }
      console.log(`[Frontend Round] team1Score: ${team1Score}, team2Score: ${team2Score}`);

      // Concatenate the scores
      const concatenatedScore = `${team1Score || ""} + ${team2Score || ""}`;
      console.log(`[Frontend Round] Concatenated Score: "${concatenatedScore}"`);

      // Call parent's onUpdateMatch to save to backend
      await onUpdateMatch(matchId, { Score: concatenatedScore }, false); // Pass false for shouldRefetch

      // Optionally, update local state after successful save if needed,
      // but the main goal here is to send to backend.
      // The next fetch of draws will update the initialScores.
    }, [matchScores, onUpdateMatch]); // matchScores is a dependency here


    // Override onUpdateMatch to include concatenated score (for winner selection)
    const handleUpdateMatchWithScore = useCallback(async (matchId, updateData) => {
      const currentMatchScores = matchScores[matchId];
      const concatenatedScore = `${currentMatchScores.Team1 || ""} + ${currentMatchScores.Team2 || ""}`;
      await onUpdateMatch(matchId, { ...updateData, Score: concatenatedScore }, true); // Explicitly pass true for shouldRefetch
    }, [matchScores, onUpdateMatch]);


    const handleStatusChange = (matchId, newStatus) => {
      // This will now use the new handleUpdateMatchWithScore
      handleUpdateMatchWithScore(matchId, { Status: newStatus });
    };

    return (
      <div className={styles.roundContainer}>
        <h2 className={styles.roundTitle}>{title}</h2>
        <div className={styles.matchesContainer}>
          {matches.map((match, matchIndex) => (
            <React.Fragment
              key={match._id || `match-${roundIndex}-${matchIndex}`}
            >
              <div className={styles.matchPair}>
                <div className={styles.matchNumber}>
                  Match {match.Match_number}
                </div>
                {/* Status Dropdown */}
                <select
                  value={match.Status} // Default to current status
                  onChange={(e) =>
                    handleStatusChange(match._id, e.target.value)
                  }
                  className={styles.matchStatusDropdown} // New CSS class for styling
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                <Match
                  key={`${match._id}-team1`} // Add key
                  team={match.Team1}
                  opponentTeam={match.Team2} // Pass opponent
                  roundIndex={roundIndex}
                  matchId={match._id}
                  slotType="Team1"
                  onUpdateMatch={handleUpdateMatchWithScore} // Use new handler for winner selection
                  matchWinnerId={match.Winner?._id || match.Winner} // Ensure it's always an ID
                  onScoreChange={handleScoreChange} // Pass score change handler (local)
                  onScoreSave={handleScoreSave} // Pass score save handler (backend)
                  initialScore={matchScores[match._id]?.Team1} // Pass initial score
                />
                <div className={styles.vsSeparator}>V/S</div> {/* New V/S separator */}
                <Match
                  key={`${match._id}-team2`} // Add key
                  team={match.Team2}
                  opponentTeam={match.Team1} // Pass opponent
                  roundIndex={roundIndex}
                  matchId={match._id}
                  slotType="Team2"
                  onUpdateMatch={handleUpdateMatchWithScore} // Use new handler for winner selection
                  matchWinnerId={match.Winner?._id || match.Winner} // Ensure it's always an ID
                  onScoreChange={handleScoreChange} // Pass score change handler (local)
                  onScoreSave={handleScoreSave} // Pass score save handler (backend)
                  initialScore={matchScores[match._id]?.Team2} // Pass initial score
                />
              </div>
              {!isLastRound && <div className={styles.connectorLine}></div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
);

const ManageResult = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDraws = useCallback(async () => { // Wrapped in useCallback
    if (selectedEvent) {
      setLoading(true);
      try {
        const drawsRes = await api.get(
          `${
            import.meta.env.VITE_APP_BACKEND_URL
          }/api/nissan-draws/${selectedEvent}`,
          { withCredentials: true }
        );
        setDraws(drawsRes.data.data);
        console.log("[Frontend] Fetched draws data:", drawsRes.data.data); // Add this log
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching data.");
        console.error("Error fetching data:", error);
        setDraws([]);
      }
      setLoading(false);
    }
  }, [selectedEvent]); // Dependency array

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
          {
            withCredentials: true,
          }
        );
        setEvents(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedEvent(res.data.data[0]._id);
        }
      } catch (error) {
        toast.error("Error fetching events.");
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchDraws();
  }, [selectedEvent]);

  const handleUpdateMatch = useCallback(async (matchId, updateData, shouldRefetch = true) => { // Added shouldRefetch
    try {
      const response = await api.put(
        // Capture response to get updated data
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${matchId}`,
        updateData,
        { withCredentials: true }
      );
      toast.success("Match updated successfully!");

      if (shouldRefetch) { // Only refetch if explicitly told to
        await fetchDraws(); // Re-fetch all draws to get propagated winners
      } else {
        // If not refetching, update local state with the response data for the current match
        setDraws((prevDraws) =>
          prevDraws.map((draw) => {
            if (draw._id === matchId) {
              const updatedDrawData = response.data.data;
              let newWinner = updatedDrawData.Winner; // Store the ID directly

              return {
                ...draw, // Keep all existing fields
                Score:
                  updatedDrawData.Score !== undefined
                    ? updatedDrawData.Score
                    : draw.Score,
                Status:
                  updatedDrawData.Status !== undefined
                    ? updatedDrawData.Status
                    : draw.Status,
                Winner: newWinner,
              };
            }
            return draw;
          })
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update match.");
      console.error("Error updating match:", error);
    }
  }, [fetchDraws]); // fetchDraws is in dependency array

  const buildRounds = (draws) => {
    if (!draws || draws.length === 0) return [];

    const roundsData = draws.reduce((acc, draw) => {
      const { Stage } = draw;
      if (!acc[Stage]) {
        acc[Stage] = [];
      }
      acc[Stage].push(draw);
      return acc;
    }, {});

    return Object.entries(roundsData)
      .sort(([stageA], [stageB]) => {
        const numA = parseInt(stageA.split(" ")[1] || 0);
        const numB = parseInt(stageB.split(" ")[1] || 0);
        return numA - numB;
      })
      .map(([stage, matches]) => ({
        title: stage,
        matches: matches.sort((a, b) => a.Match_number - b.Match_number),
      }));
  };

  const rounds = buildRounds(draws);
  const totalRounds = rounds.length;

  return (
    <div className={styles.manageResultContainer}>
      {" "}
      {/* Changed class name */}
      <h1>Manage Results</h1> {/* Changed title */}
      <div className={styles.eventFilterButtons}>
        {events.map((event) => (
          <button
            key={event._id}
            className={`${styles.filterButton} ${
              selectedEvent === event._id ? styles.active : ""
            }`}
            onClick={() => setSelectedEvent(event._id)}
          >
            {event.name}
          </button>
        ))}
      </div>
      <div className={styles.controls}>
        {/* Removed Create/Delete buttons */}
      </div>
      {loading ? (
        <p>Loading results...</p>
      ) : draws.length === 0 ? (
        <p>No results available for this event yet.</p>
      ) : (
        <div className={styles.bracketContainer}>
          {rounds.map((round, roundIndex) => (
            <Round
              key={round.title}
              title={round.title}
              matches={round.matches}
              roundIndex={roundIndex}
              totalRounds={totalRounds}
              onUpdateMatch={handleUpdateMatch} // Pass the function
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageResult;
