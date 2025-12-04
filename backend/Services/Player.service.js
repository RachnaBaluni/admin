const Player = require("../models/Player.model.js");
const Team = require("../models/Team.model.js");
const Event = require("../models/Event.model.js");
const Nissan_Draws = require("../models/Nissan_Draws.model.js");

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const FOOD_PREFS = ["Veg", "Non-Veg"];

const RegisterPlayer = async (data) => {
  const requiredFields = [
    "name",
    "whatsappNumber",
    "dob",
    "city",
    "shirtSize",
    "shortSize",
    "foodPref",
    "feePaid",
    "stay",
  ];

  for (const field of requiredFields) {
    if (
      !data.hasOwnProperty(field) ||
      data[field] === undefined ||
      data[field] === null ||
      (typeof data[field] === "string" && data[field].trim() === "")
    ) {
      throw new Error(
        `Please fill all the details. Missing or invalid field: ${field}`
      );
    }
  }

  const playerData = {
    name: data.name,
    whatsappNumber: data.whatsappNumber,
    dob: data.dob,
    city: data.city,
    shirtSize: data.shirtSize,
    shortSize: data.shortSize,
    foodPref: data.foodPref,
    stay: data.stay,
    feePaid: data.feePaid,
    transactionDetails: data.feePaid ? data.transactionDetails : "",
  };

  if (playerData.feePaid && !playerData.transactionDetails.trim()) {
    throw new Error("Transaction details are required if fee is paid.");
  }

  const phoneRegex = new RegExp("^[6-9]\\d{9}$");
  if (!phoneRegex.test(playerData.whatsappNumber.toString())) {
    throw new Error("Phone Number is not correct.");
  }

  if (new Date(playerData.dob) > new Date()) {
    throw new Error("Date Of Birth is not correct (cannot be in the future).");
  }

  if (!SHIRT_SIZES.includes(playerData.shirtSize)) {
    throw new Error("Shirt Size Option is not correct.");
  }

  if (!SHIRT_SIZES.includes(playerData.shortSize)) {
    throw new Error("Short Size Option is not correct.");
  }

  if (!FOOD_PREFS.includes(playerData.foodPref)) {
    throw new Error("Incorrect Food Preference.");
  }

  const duplicatePlayer = await Player.findOne({
    whatsappNumber: playerData.whatsappNumber,
  });
  if (duplicatePlayer) {
    throw new Error("The Whatsapp Number is already Registered.");
  }

  const { event1, event2, partner1, partner2 } = data;

  if (!event1 || typeof event1 !== "string" || !event1.trim()) {
    throw new Error("Event 1 cannot be empty.");
  }

  if (event2 && event2 === event1) {
    throw new Error("Event 1 and Event 2 cannot be the same.");
  }

  const Event1 = await Event.findById(event1);
  if (!Event1) {
    throw new Error("Invalid Id for Event 1.");
  }

  let Event2 = null;
  if (event2) {
    Event2 = await Event.findById(event2);
    if (!Event2) {
      throw new Error("Invalid Id for Event 2.");
    }
  }

  let Partner1Team = null;
  if (partner1) {
    const Partner1 = await Player.findById(partner1);
    if (!Partner1) {
      throw new Error("Partner 1 Id is incorrect.");
    }

    Partner1Team = await Team.findOne({
      eventId: event1,
      partner1: partner1,
      $or: [{ partner2: null }, { partner2: { $exists: false } }],
    });

    if (!Partner1Team) {
      throw new Error(
        `Could not find an open team for Partner 1 (${Partner1.name}) in Event 1.`
      );
    }

    if (Partner1Team.partner2) {
      throw new Error(
        `Partner 1 (${Partner1.name}) already has a partner in Event 1.`
      );
    }
  }

  let Partner2Team = null;
  if (event2 && partner2) {
    const Partner2 = await Player.findById(partner2);
    if (!Partner2) {
      throw new Error("Partner 2 Id is incorrect.");
    }

    Partner2Team = await Team.findOne({
      eventId: event2,
      partner1: partner2,
      $or: [{ partner2: null }, { partner2: { $exists: false } }],
    });

    if (!Partner2Team) {
      throw new Error(
        `Could not find an open team for Partner 2 (${Partner2.name}) in Event 2.`
      );
    }

    if (Partner2Team.partner2) {
      throw new Error(
        `Partner 2 (${Partner2.name}) already has a partner in Event 2.`
      );
    }
  }

  const registerPlayer = await Player.create(playerData);
  if (!registerPlayer) {
    throw new Error("Failed to register player.");
  }

  if (Partner1Team) {
    Partner1Team.partner2 = registerPlayer._id;
    await Partner1Team.save();
  } else {
    const lastRank1 = await Team.findOne({ eventId: event1 })
      .sort({ rank: -1 })
      .exec();
    const newRank1 = lastRank1 ? lastRank1.rank + 1 : 1;

    await Team.create({
      eventId: event1,
      partner1: registerPlayer._id,
      partner2: null,
      rank: newRank1,
    });
  }

  if (event2) {
    if (Partner2Team) {
      Partner2Team.partner2 = registerPlayer._id;
      await Partner2Team.save();
    } else {
      const lastRank2 = await Team.findOne({ eventId: event2 })
        .sort({ rank: -1 })
        .exec();
      const newRank2 = lastRank2 ? lastRank2.rank + 1 : 1;

      await Team.create({
        eventId: event2,
        partner1: registerPlayer._id,
        partner2: null,
        rank: newRank2,
      });
    }
  }
};

const loginPlayer = async (data) => {
  const { whatsappNumber, dob } = data;
  if (!whatsappNumber || !dob)
    throw new Error("Both Whatsapp Number and Date of Birth are Required");

  const player = await Player.findOne({ whatsappNumber });
  if (!player) throw new Error("This Whatsapp Number is not Registered");

  if (
    new Date(dob).toISOString().slice(0, 10) !==
    player.dob.toISOString().slice(0, 10)
  )
    throw new Error("Date of Birth is not Correct");

  return { id: player._id, name: player.name };
};

const updatePlayer = async (id, data) => {
  const player = await Player.findById(id);
  if (!player) throw new Error("Incorrect Player Id Provided");
  // --- Player Data Validation ---
  const requiredFields = [
    "name",
    "whatsappNumber",
    "dob",
    "city",
    "shirtSize",
    "shortSize",
    "foodPref",
    "feePaid",
    "stay",
  ];

  for (const field of requiredFields) {
    if (
      !data.hasOwnProperty(field) ||
      data[field] === undefined ||
      data[field] === null
    ) {
      throw new Error(
        `Please fill all the details. Missing or invalid field: ${field}`
      );
    }
  }

  const playerData = {
    name: data.name,
    whatsappNumber: data.whatsappNumber,
    dob: data.dob,
    city: data.city,
    shirtSize: data.shirtSize,
    shortSize: data.shortSize,
    foodPref: data.foodPref,
    stay: data.stay,
    feePaid: data.feePaid,
    transactionDetails: data.feePaid ? data.transactionDetails : "",
  };

  if (playerData.feePaid && !playerData.transactionDetails) {
    throw new Error("Transaction details are required if fee is paid.");
  }

  const phoneRegex = new RegExp("^[6-9]\\d{9}$");
  if (!phoneRegex.test(playerData.whatsappNumber.toString())) {
    throw new Error("Phone Number is not correct.");
  }

  if (new Date(playerData.dob) > new Date()) {
    throw new Error("Date Of Birth is not correct.");
  }

  if (!SHIRT_SIZES.includes(playerData.shirtSize)) {
    throw new Error("Shirt Size Option is not correct.");
  }

  if (!SHIRT_SIZES.includes(playerData.shortSize)) {
    throw new Error("Short Size Option is not correct.");
  }

  if (!FOOD_PREFS.includes(playerData.foodPref)) {
    throw new Error("Incorrect Food Preference.");
  }

  Object.assign(player, playerData);
  await player.save();
};

// const updateTeams = async (id, data) => {
//   const player = await Player.findById(id);
//   if (!player) throw new Error("Incorrect Player Id Provided.");

//   const { event1, event2, partner1, partner2 } = data;

//   if (!event1 || event1.trim() === "") {
//     // More robust check for empty string
//     throw new Error("Event 1 cannot be empty.");
//   }
//   console.log("CHECKPOINT 1");

//   if (event2 && event2.trim() !== "" && event1 === event2) {
//     throw new Error("Event 1 and Event 2 cannot be the same.");
//   }

//   const Event1Doc = await Event.findById(event1);
//   if (!Event1Doc) {
//     throw new Error("Invalid Id for Event 1.");
//   }

//   let Event2Doc = null;
//   if (event2 && event2.trim() !== "") {
//     Event2Doc = await Event.findById(event2);
//     if (!Event2Doc) {
//       throw new Error("Invalid Id for Event 2.");
//     }
//   }
//   console.log("CHECKPOINT 2");

//   let Partner1TeamForNewEvent1 = null;
//   if (partner1 && partner1.trim() !== "") {
//     const Partner1 = await Player.findById(partner1);
//     if (!Partner1) {
//       throw new Error("Partner 1 Id is incorrect.");
//     }
//     console.log("CHECKPOINT 3");
//     Partner1TeamForNewEvent1 = await Team.findOne({
//       eventId: event1,
//       partner1: partner1,
//       partner2: null, // Looking for an open team for partner1
//     });
//     if (!Partner1TeamForNewEvent1) {
//       throw new Error(
//         `Could not find an open team for Partner 1 (${Partner1.name}) in Event 1.`
//       );
//     }

//     if (
//       Partner1TeamForNewEvent1.partner2 &&
//       Partner1TeamForNewEvent1.partner2.toString() !== ""
//     ) {
//       throw new Error(
//         `Partner 1 (${Partner1.name}) already has a partner in Event 1.`
//       );
//     }
//   }

//   let Partner2TeamForNewEvent2 = null;
//   if (event2 && event2.trim() !== "" && partner2 && partner2.trim() !== "") {
//     const Partner2 = await Player.findById(partner2);
//     if (!Partner2) {
//       throw new Error("Partner 2 Id is incorrect.");
//     }
//     Partner2TeamForNewEvent2 = await Team.findOne({
//       eventId: event2,
//       partner1: partner2,
//       partner2: "", // Looking for an open team for partner2
//     });
//     if (!Partner2TeamForNewEvent2) {
//       throw new Error(
//         `Could not find an open team for Partner 2 (${Partner2.name}) in Event 2.`
//       );
//     }
//     if (
//       Partner2TeamForNewEvent2.partner2 &&
//       Partner2TeamForNewEvent2.partner2.toString() !== ""
//     ) {
//       throw new Error(
//         `Partner 2 (${Partner2.name}) already has a partner in Event 2.`
//       );
//     }
//   }

//   // --- 3. Fetch Player's Current Teams ---
//   const playerCurrentTeams = await Team.find({
//     $or: [{ partner1: id }, { partner2: id }],
//   });

//   // --- 4. Start Transaction for Atomic Operations ---
//   // Requires MongoDB replica set for transactions.
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // --- 5. Process Old Teams (Cleanup or Promote Partners) ---
//     const newEventIds = [event1];
//     if (event2 && event2.trim() !== "") {
//       newEventIds.push(event2);
//     }

//     for (const currentTeam of playerCurrentTeams) {
//       const currentTeamEventId = currentTeam.eventId.toString();

//       // Check if the player is staying in this event
//       if (!newEventIds.includes(currentTeamEventId)) {
//         // Player is leaving this event (not in new event1 or new event2)
//         if (currentTeam.partner1.toString() === id.toString()) {
//           // Player was partner1 in this old team
//           if (currentTeam.partner2 && currentTeam.partner2.toString() !== "") {
//             // Promote partner2 to partner1
//             currentTeam.partner1 = currentTeam.partner2;
//             currentTeam.partner2 = "";
//             await currentTeam.save({ session });
//           } else {
//             // Solo player, delete the team
//             await currentTeam.deleteOne({ session });
//           }
//         } else if (
//           currentTeam.partner2 &&
//           currentTeam.partner2.toString() === id.toString()
//         ) {
//           // Player was partner2 in this old team, make partner1 solo
//           currentTeam.partner2 = "";
//           await currentTeam.save({ session });
//         }
//       } else {
//         // Player is staying in this event.
//         // We will explicitly manage their new role/team for this event in step 6.
//         // For simplicity in update, we'll remove them from their old role here if it's changing.
//         // This avoids complex state comparisons and instead rebuilds the player's role for this event.

//         // Determine if player will be partner1 or partner2 in this new configuration for this event
//         const willBePartner2InEvent1 =
//           currentTeamEventId === event1 && partner1 && partner1.trim() !== "";
//         const willBePartner2InEvent2 =
//           currentTeamEventId === event2 && partner2 && partner2.trim() !== "";
//         const willBePartner2 = willBePartner2InEvent1 || willBePartner2InEvent2;

//         if (currentTeam.partner1.toString() === id.toString()) {
//           // Player was partner1
//           if (willBePartner2) {
//             // Player is now becoming partner2 in this event
//             if (
//               currentTeam.partner2 &&
//               currentTeam.partner2.toString() !== ""
//             ) {
//               // Promote existing partner2 to partner1
//               currentTeam.partner1 = currentTeam.partner2;
//               currentTeam.partner2 = "";
//               await currentTeam.save({ session });
//             } else {
//               // Player was solo partner1, now needs to be removed to join new team
//               await currentTeam.deleteOne({ session });
//             }
//           }
//           // If they were partner1 and remain partner1/solo, no action here, new team will be created if needed in step 6
//         } else if (
//           currentTeam.partner2 &&
//           currentTeam.partner2.toString() === id.toString()
//         ) {
//           // Player was partner2
//           if (!willBePartner2) {
//             // Player is no longer partner2 in this event
//             currentTeam.partner2 = ""; // Make partner1 solo
//             await currentTeam.save({ session });
//           }
//           // If they were partner2 and remain partner2, no action here, new team will be updated in step 6
//         }
//       }
//     }

//     // --- 6. Create/Update Teams for New Event Selections ---

//     // Handle Event 1
//     const playerAlreadyHasTeamInEvent1 = playerCurrentTeams.some(
//       (team) =>
//         team.eventId.toString() === Event1Doc._id.toString() &&
//         (team.partner1.toString() === id.toString() ||
//           (team.partner2 && team.partner2.toString() === id.toString()))
//     );

//     if (Partner1TeamForNewEvent1) {
//       // Player joins an existing team for Event 1 as Partner 2
//       Partner1TeamForNewEvent1.partner2 = id;
//       await Partner1TeamForNewEvent1.save({ session });
//     } else if (
//       !playerAlreadyHasTeamInEvent1 ||
//       (playerCurrentTeams.find(
//         (t) =>
//           t.eventId.toString() === Event1Doc._id.toString() &&
//           t.partner1.toString() === id.toString() &&
//           t.partner2 &&
//           t.partner2.toString() !== ""
//       ) &&
//         partner1 &&
//         partner1.trim() === "")
//     ) {
//       // Player is Partner 1 for Event 1 (new team, or was solo and remains solo, or was partner2 and now solo)
//       // Get the last rank for Event 1 to assign the new rank
//       const lastRank1 = await Team.findOne({ eventId: event1 })
//         .sort({ rank: -1 })
//         .exec();
//       const newRank1 = lastRank1 ? lastRank1.rank + 1 : 1;

//       await Team.create(
//         [
//           {
//             // Use array syntax for create within a session
//             eventId: event1,
//             partner1: id,
//             partner2: "",
//             rank: newRank1,
//           },
//         ],
//         { session }
//       );
//     }

//     // Handle Event 2 (if applicable)
//     if (Event2Doc) {
//       const playerAlreadyHasTeamInEvent2 = playerCurrentTeams.some(
//         (team) =>
//           team.eventId.toString() === Event2Doc._id.toString() &&
//           (team.partner1.toString() === id.toString() ||
//             (team.partner2 && team.partner2.toString() === id.toString()))
//       );

//       if (Partner2TeamForNewEvent2) {
//         // Current player joins existing team for Event 2 as Partner 2
//         Partner2TeamForNewEvent2.partner2 = id;
//         await Partner2TeamForNewEvent2.save({ session });
//       } else if (
//         !playerAlreadyHasTeamInEvent2 ||
//         (playerCurrentTeams.find(
//           (t) =>
//             t.eventId.toString() === Event2Doc._id.toString() &&
//             t.partner1.toString() === id.toString() &&
//             t.partner2 &&
//             t.partner2.toString() !== ""
//         ) &&
//           partner2 &&
//           partner2.trim() === "")
//       ) {
//         // Current player is Partner 1 for Event 2 (new team, or was solo and remains solo, or was partner2 and now solo)
//         // Get the last rank for Event 2 to assign the new rank
//         const lastRank2 = await Team.findOne({ eventId: event2 })
//           .sort({ rank: -1 })
//           .exec();
//         const newRank2 = lastRank2 ? lastRank2.rank + 1 : 1;

//         await Team.create(
//           [
//             {
//               // Use array syntax for create within a session
//               eventId: event2,
//               partner1: id,
//               partner2: "",
//               rank: newRank2,
//             },
//           ],
//           { session }
//         );
//       }
//     }

//     await session.commitTransaction();
//     session.endSession();
//     return { success: true, message: "Teams updated successfully." };
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Error updating teams:", error);
//     throw error; // Re-throw the error after rolling back
//   }
// };

const updateTeams = async (id, data) => {
  const player = await Player.findById(id);
  if (!player) throw new Error("Incorrect Player Id Provided.");

  const { event1, event2, partner1, partner2 } = data;

  // 1. Initial Validations
  if (!event1 || event1.trim() === "") {
    throw new Error("Event 1 cannot be empty.");
  }

  if (event2 && event2.trim() !== "" && event1 === event2) {
    throw new Error("Event 1 and Event 2 cannot be the same.");
  }

  const Event1Doc = await Event.findById(event1);
  if (!Event1Doc) {
    throw new Error("Invalid Id for Event 1.");
  }

  let Event2Doc = null;
  if (event2 && event2.trim() !== "") {
    Event2Doc = await Event.findById(event2);
    if (!Event2Doc) {
      throw new Error("Invalid Id for Event 2.");
    }
  }

  let existingPartner1Doc = null;
  let existingPartner2Doc = null;

  // Validate and fetch partner docs if provided
  if (partner1 && partner1.trim() !== "") {
    existingPartner1Doc = await Player.findById(partner1);
    if (!existingPartner1Doc) {
      throw new Error("Partner 1 Id is incorrect.");
    }
    // Make sure partner is not the player themselves
    if (existingPartner1Doc._id.toString() === id.toString()) {
      throw new Error("Partner 1 cannot be the player themselves.");
    }
  }

  if (partner2 && partner2.trim() !== "") {
    existingPartner2Doc = await Player.findById(partner2);
    if (!existingPartner2Doc) {
      throw new Error("Partner 2 Id is incorrect.");
    }
    // Make sure partner is not the player themselves
    if (existingPartner2Doc._id.toString() === id.toString()) {
      throw new Error("Partner 2 cannot be the player themselves.");
    }
  }
  // --- 2. Fetch Player's Current Teams ---
  const playerCurrentTeams = await Team.find({
    $or: [{ partner1: id }, { partner2: id }],
  });

  // --- 3. Start Transaction for Atomic Operations ---
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newEventIds = [];
    if (event1) newEventIds.push(event1);
    if (event2) newEventIds.push(event2);

    // --- 4. Process Old Teams (Cleanup or Promote Partners) ---
    for (const currentTeam of playerCurrentTeams) {
      const currentTeamEventId = currentTeam.eventId.toString();
      const isPlayerPartner1 =
        currentTeam.partner1.toString() === id.toString();
      const isPlayerPartner2 =
        currentTeam.partner2 &&
        currentTeam.partner2.toString() === id.toString();

      // Case 1: Player is leaving this event entirely
      if (!newEventIds.includes(currentTeamEventId)) {
        if (isPlayerPartner1) {
          if (currentTeam.partner2) {
            // Player was partner1, had a partner, promote partner2 to partner1
            currentTeam.partner1 = currentTeam.partner2;
            currentTeam.partner2 = null; // Use null for empty partner2
            await currentTeam.save({ session });
          } else {
            // Player was solo partner1, delete the team
            await currentTeam.deleteOne({ session });
          }
        } else if (isPlayerPartner2) {
          // Player was partner2, make partner1 solo
          currentTeam.partner2 = null; // Use null for empty partner2
          await currentTeam.save({ session });
        }
      }
      // Case 2: Player is staying in this event but their role/partner might change
      // We will handle the *new* state for these events in step 5,
      // so here we just need to "free up" the current player's slot if they are changing roles.
      // This simplifies subsequent logic by treating current teams as mutable or deletable.
      else {
        // Find the target partner for this event in the new data
        let targetPartnerId = null;
        if (currentTeamEventId === event1) {
          targetPartnerId = partner1;
        } else if (currentTeamEventId === event2) {
          targetPartnerId = partner2;
        }

        // Check if the current team structure matches the *desired* structure
        let isCurrentTeamMatch = false;
        if (isPlayerPartner1) {
          const oldPartnerId = currentTeam.partner2
            ? currentTeam.partner2.toString()
            : null;
          if (oldPartnerId === (targetPartnerId || null)) {
            isCurrentTeamMatch = true;
          }
        } else if (isPlayerPartner2) {
          const oldPartnerId = currentTeam.partner1
            ? currentTeam.partner1.toString()
            : null;
          if (oldPartnerId === (targetPartnerId || null)) {
            isCurrentTeamMatch = true;
          }
        }

        if (isCurrentTeamMatch) {
          // If the team structure for this event hasn't fundamentally changed, skip processing it here.
          // We'll rely on the existing team, but ensure it's "marked" so we don't try to create a duplicate.
          continue;
        }

        // If the current team doesn't match the desired state, we need to modify or delete it
        if (isPlayerPartner1) {
          if (currentTeam.partner2) {
            // Player was partner1, had a partner. Promote partner2 to partner1.
            currentTeam.partner1 = currentTeam.partner2;
            currentTeam.partner2 = null;
            await currentTeam.save({ session });
          } else {
            // Player was solo partner1, delete the team to create a new one/join another
            await currentTeam.deleteOne({ session });
          }
        } else if (isPlayerPartner2) {
          // Player was partner2, make partner1 solo
          currentTeam.partner2 = null;
          await currentTeam.save({ session });
        }
      }
    }

    // --- 5. Create/Update Teams for New Event Selections ---

    // Function to handle creating/updating a team for a specific event
    const handleEventTeam = async (eventId, chosenPartnerId, EventDoc) => {
      if (!EventDoc) return; // Skip if event is not chosen

      // Check if the player is already in a team for this event, and its current state matches the desired state
      const existingTeamForEvent = await Team.findOne({
        eventId: eventId,
        $or: [{ partner1: id }, { partner2: id }],
      }).session(session);

      if (chosenPartnerId) {
        // Player wants a partner
        // Try to find an incomplete team where chosenPartnerId is partner1
        let partnerAsP1Team = await Team.findOne({
          eventId: eventId,
          partner1: chosenPartnerId,
          partner2: null,
        }).session(session);

        if (partnerAsP1Team) {
          // Found an open team with the chosen partner as partner1, join it
          if (
            existingTeamForEvent &&
            existingTeamForEvent._id.toString() !==
              partnerAsP1Team._id.toString()
          ) {
            // If player was in a *different* team for this event, clean up the old one
            if (existingTeamForEvent.partner1.toString() === id.toString()) {
              if (existingTeamForEvent.partner2) {
                existingTeamForEvent.partner1 = existingTeamForEvent.partner2;
                existingTeamForEvent.partner2 = null;
                await existingTeamForEvent.save({ session });
              } else {
                await existingTeamForEvent.deleteOne({ session });
              }
            } else if (
              existingTeamForEvent.partner2?.toString() === id.toString()
            ) {
              existingTeamForEvent.partner2 = null;
              await existingTeamForEvent.save({ session });
            }
          }
          partnerAsP1Team.partner2 = id;
          await partnerAsP1Team.save({ session });
        } else {
          // No open team for the chosen partner.
          // Check if player is already partner1 with this specific partner
          const playerAsP1WithPartner = await Team.findOne({
            eventId: eventId,
            partner1: id,
            partner2: chosenPartnerId,
          }).session(session);

          if (playerAsP1WithPartner) {
            // Scenario: Player is already partner1 with the chosen partner. No change needed.
            return;
          }

          // Check if player is already partner2 with this specific partner
          const playerAsP2WithPartner = await Team.findOne({
            eventId: eventId,
            partner1: chosenPartnerId,
            partner2: id,
          }).session(session);

          if (playerAsP2WithPartner) {
            // Scenario: Player is already partner2 with the chosen partner. No change needed.
            return;
          }

          // If we reach here, neither exists, so create a new team with player as partner1
          // (assuming the partner can be partner2 later, or this is a new P1 team for P2 to join)
          const lastRank = await Team.findOne({ eventId: eventId })
            .sort({ rank: -1 })
            .exec();
          const newRank = lastRank ? lastRank.rank + 1 : 1;

          await Team.create(
            [
              {
                eventId: eventId,
                partner1: id, // Player is partner1 by default
                partner2: chosenPartnerId, // The chosen partner
                rank: newRank,
              },
            ],
            { session }
          );
        }
      } else {
        // Player wants to be solo (no partner chosen)
        const playerSoloTeam = await Team.findOne({
          eventId: eventId,
          partner1: id,
          partner2: null, // Check for solo team
        }).session(session);

        if (playerSoloTeam) {
          // Scenario: Player is already solo in this event. No change needed.
          return;
        }

        // If player was partner2 in an existing team, their old partner1 becomes solo
        if (
          existingTeamForEvent &&
          existingTeamForEvent.partner2?.toString() === id.toString()
        ) {
          existingTeamForEvent.partner2 = null;
          await existingTeamForEvent.save({ session });
        }
        // If player was partner1 with someone, that team should have been handled in previous cleanup
        // or will be updated now.
        // Create new solo team for player if they don't have one
        const lastRank = await Team.findOne({ eventId: eventId })
          .sort({ rank: -1 })
          .exec();
        const newRank = lastRank ? lastRank.rank + 1 : 1;

        await Team.create(
          [
            {
              eventId: eventId,
              partner1: id,
              partner2: null, // Explicitly null for solo
              rank: newRank,
            },
          ],
          { session }
        );
      }
    };

    await handleEventTeam(event1, partner1, Event1Doc);
    if (event2 && event2.trim() !== "") {
      await handleEventTeam(event2, partner2, Event2Doc);
    }

    await session.commitTransaction();
    session.endSession();
    return { success: true, message: "Teams updated successfully." };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating teams:", error);
    throw error; // Re-throw the error after rolling back
  }
};

const mongoose = require("mongoose");

const getPlayersWithDetails = async () => {
  const players = await Player.find({}).lean();
  for (const player of players) {
    const teams = await Team.find({
      $or: [{ partner1: player._id }, { partner2: player._id }],
    })
      .populate("eventId", "name")
      .populate("partner1", "name")
      .populate("partner2", "name");

    if (teams.length > 0) {
      const team1 = teams[0];
      player.event1 = team1.eventId.name;
      if (team1.partner1._id.toString() === player._id.toString()) {
        player.event1Partner = team1.partner2 ? team1.partner2.name : "N/A";
      } else {
        player.event1Partner = team1.partner1.name;
      }
    }
    if (teams.length > 1) {
      const team2 = teams[1];
      player.event2 = team2.eventId.name;
      if (team2.partner1._id.toString() === player._id.toString()) {
        player.event2Partner = team2.partner2 ? team2.partner2.name : "N/A";
      } else {
        player.event2Partner = team2.partner1.name;
      }
    }
  }
  return players;
};

const getPlayersWithDetailsFrontend = async () => {
  // 1. Fetch all players
  const players = await Player.find({}).lean();

  // 2. Fetch all teams ONCE (not inside loop)
  const teams = await Team.find({})
    .populate("eventId", "name")
    .populate("partner1", "name")
    .populate("partner2", "name")
    .lean();

  // 3. Build a map: playerId -> list of teams they are part of
  const teamsByPlayer = {};

  for (const team of teams) {
    const partners = [team.partner1?._id, team.partner2?._id];

    for (const pid of partners) {
      if (!pid) continue;

      const key = pid.toString();
      if (!teamsByPlayer[key]) teamsByPlayer[key] = [];
      teamsByPlayer[key].push(team);
    }
  }

  // 4. Build the final players list
  const finalPlayersList = [];

  for (const player of players) {
    const pId = player._id.toString();
    const playerTeams = teamsByPlayer[pId] || [];

    let event1 = null;
    let event1Partner = null;
    let event2 = null;
    let event2Partner = null;

    if (playerTeams[0]) {
      const t = playerTeams[0];
      event1 = t.eventId?.name;

      event1Partner =
        t.partner1?._id?.toString() === pId
          ? t.partner2?.name || "N/A"
          : t.partner1?.name || "N/A";
    }

    if (playerTeams[1]) {
      const t = playerTeams[1];
      event2 = t.eventId?.name;

      event2Partner =
        t.partner1?._id?.toString() === pId
          ? t.partner2?.name || "N/A"
          : t.partner1?.name || "N/A";
    }

    finalPlayersList.push({
      name: player.name,
      event1,
      event1Partner,
      event2,
      event2Partner,
      whatsappNumber: player.whatsappNumber,
      //dob: "This is Working",
      dob: player.dob ? String(new Date(player.dob).getFullYear()) : null, // Only Year
      city: player.city,
    });
  }

  return finalPlayersList;
};

const toggleFeeStatus = async (playerId) => {
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error("Player not found");
  }
  player.feePaidAdmin = !player.feePaidAdmin;
  await player.save();
  return player;
};

const deletePlayerAndHandleTeams = async (playerId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const player = await Player.findById(playerId).session(session);
    if (!player) {
      throw new Error("Player not found");
    }

    const teams = await Team.find({
      $or: [{ partner1: playerId }, { partner2: playerId }],
    }).session(session);

    for (const team of teams) {
      if (team.partner1.toString() === playerId.toString()) {
        if (team.partner2) {
          team.partner1 = team.partner2;
          team.partner2 = null;
          await team.save({ session });
        } else {
          await Team.findByIdAndDelete(team._id).session(session);
        }
      } else {
        team.partner2 = null;
        await team.save({ session });
      }
    }

    await Player.findByIdAndDelete(playerId).session(session);

    await session.commitTransaction();
    session.endSession();
    return { message: "Player deleted successfully" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getPlayerJourney = async (playerId) => {
  try {
    // Step 1️⃣ Ensure playerId is an ObjectId
    const playerObjectId = new mongoose.Types.ObjectId(playerId);

    // Step 2️⃣ Find all teams where the player is partner1 or partner2
    const teams = await Team.find({
      $or: [{ partner1: playerObjectId }, { partner2: playerObjectId }],
    }).select("_id");

    const teamIds = teams.map((t) => t._id);

    // Step 3️⃣ If no teams, return an empty array directly
    if (teamIds.length === 0) {
      throw new Error("No teams found for this player");
    }

    // Step 4️⃣ Fetch only relevant draws
    const draws = await Nissan_Draws.find({
      $or: [{ Team1: { $in: teamIds } }, { Team2: { $in: teamIds } }],
    }).populate([
      {
        path: "Team1",
        select: "partner1 partner2",
        populate: [
          { path: "partner1", select: "name" },
          { path: "partner2", select: "name" },
        ],
      },
      {
        path: "Team2",
        select: "partner1 partner2",
        populate: [
          { path: "partner1", select: "name" },
          { path: "partner2", select: "name" },
        ],
      },
      {
        path: "Winner",
        select: "partner1 partner2",
        populate: [
          { path: "partner1", select: "name" },
          { path: "partner2", select: "name" },
        ],
      },
      { path: "Event", select: "name" },
    ]);

    draws.sort((a, b) => {
      // 1️⃣ Sort by Event name (alphabetically)
      const eventA = a.Event?.name?.toLowerCase() || "";
      const eventB = b.Event?.name?.toLowerCase() || "";
      const eventCompare = eventA.localeCompare(eventB);
      if (eventCompare !== 0) return eventCompare;

      // 2️⃣ Then sort by Stage (e.g. "Quarter Final" before "Semi Final")
      const stageA = a.Stage?.toLowerCase() || "";
      const stageB = b.Stage?.toLowerCase() || "";
      return stageA.localeCompare(stageB);
    });

    return draws;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  RegisterPlayer,
  loginPlayer,
  updatePlayer,
  updateTeams,
  getPlayersWithDetails,
  toggleFeeStatus,
  deletePlayerAndHandleTeams,
  getPlayersWithDetailsFrontend,
  getPlayerJourney,
};
