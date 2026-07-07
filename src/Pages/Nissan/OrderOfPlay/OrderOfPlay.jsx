import React, { useEffect, useState, useRef } from "react";

import axios from "axios";
import styles from "./OrderOfPlay.module.css";
import { toast } from "sonner";

import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

/* ================= TIME ================= */

const getTimeLabel = (index) => {
  if (index === 0) return "07:30";

  if (index === 1) return "08:15";

  return "Followed By";
};

/* ================= PLAYERS ================= */

const getPlayers = (m) => {
  return [
    m?.Team1?.partner1?._id,
    m?.Team1?.partner2?._id,
    m?.Team2?.partner1?._id,
    m?.Team2?.partner2?._id,
  ]
    .filter(Boolean)
    .map((id) => id.toString().trim());
};

/* ================= DRAG CARD ================= */

function DraggableMatch({ match, time, allMatchesRef }) {
  const completedMatches = JSON.parse(
    sessionStorage.getItem("completedMatches") || "[]",
  );

  const isCompleted = completedMatches.includes(match._id);

  console.log("Match ID:", match._id);
  console.log("Completed Matches:", completedMatches);
  console.log("Is Completed:", isCompleted);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: match._id,
    disabled: isCompleted,
  });

  const style = {
    ...(transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : {}),
    cursor: isCompleted ? "not-allowed" : "grab",
    opacity: isCompleted ? 0.8 : 1,
  };

  const getTeamName = (team, side) => {
    //console.log("MATCH DATA:", match);
    //console.log("WINNER CHECK:", match.Winner);

    if (team?.partner1?.name) {
      return `${team.partner1?.name || ""}${
        team.partner2 ? " & " + team.partner2?.name : ""
      }`;
    }

    const roundNumber = Number(match.Stage?.replace("Round ", ""));

    if (!roundNumber || roundNumber === 1) {
      return "TBD";
    }

    const prevRound = roundNumber - 1;
    const currentMatchNo = match.matchNo || 1;

    const leftMatch = currentMatchNo * 2 - 1;
    const rightMatch = currentMatchNo * 2;

    const getWinnerName = (m) => {
      if (!m) return null;

      if (m.Winner) {
        return `${m.Winner.partner1?.name || ""}${
          m.Winner.partner2 ? " & " + m.Winner.partner2?.name : ""
        }`;
      }

      const team1Exists = m.Team1?.partner1?.name;
      const team2Exists = m.Team2?.partner1?.name;

      if (team1Exists && !team2Exists) {
        return `${m.Team1.partner1?.name}${
          m.Team1.partner2 ? " & " + m.Team1.partner2?.name : ""
        }`;
      }

      if (!team1Exists && team2Exists) {
        return `${m.Team2.partner1?.name}${
          m.Team2.partner2 ? " & " + m.Team2.partner2?.name : ""
        }`;
      }

      return null;
    };

    const leftPrevMatch = allMatchesRef.current.find(
      (m) =>
        m.Stage === `Round ${prevRound}` &&
        m.matchNo === leftMatch &&
        m.category === match.category,
    );

    const rightPrevMatch = allMatchesRef.current.find(
      (m) =>
        m.Stage === `Round ${prevRound}` &&
        m.matchNo === rightMatch &&
        m.category === match.category,
    );

    if (side === 1) {
      const autoWinner = getWinnerName(leftPrevMatch);
      if (autoWinner) return autoWinner;
      return `R${prevRound} M${leftMatch} Winner`;
    }

    const autoWinner = getWinnerName(rightPrevMatch);
    if (autoWinner) return autoWinner;

    return `R${prevRound} M${rightMatch} Winner`;
  };

  //console.log(  "CARD",match.matchNo,  match.forcedPlacement);
  //console.log("MATCH OBJECT", match);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`${styles.matchCard}
      ${match?.forcedPlacement ? styles.forcedMatch : ""}
      ${isCompleted ? styles.completedMatch : ""}
      `}
    >
      <div className={styles.category}>
        {match.category?.split("(")[0]?.trim()} - Match No: {match?.matchNo}
      </div>

      <div className={styles.time}>{time}</div>

      <div className={styles.round}>{match.Stage}</div>

      <div
        className={`${styles.team} ${
          String(match.Winner?._id || match.Winner) === String(match.Team1?._id)
            ? styles.winnerTeam
            : ""
        }`}
      >
        {getTeamName(match.Team1, 1)}
      </div>

      <div className={styles.vs}>VS</div>

      <div
        className={`${styles.team} ${
          String(match.Winner?._id || match.Winner) === String(match.Team2?._id)
            ? styles.winnerTeam
            : ""
        }`}
      >
        {getTeamName(match.Team2, 2)}
      </div>
    </div>
  );
}

/* ================= DROP SLOT ================= */

function DroppableSlot({ children, id }) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} className={styles.slot}>
      {children}
    </div>
  );
}

/* ================= MAIN ================= */

export default function OrderOfPlay() {
  const allMatchesRef = useRef([]);
  const todayDate = new Date().toISOString().split("T")[0];

  const getRemainingMatchDisplay = (m) => {
    const roundNumber = Number(m.Stage?.replace("Round ", ""));

    if (roundNumber <= 1) {
      return "TBD vs TBD";
    }

    const prevRound = roundNumber - 1;
    const leftMatch = m.matchNo * 2 - 1;
    const rightMatch = m.matchNo * 2;

    return `R${prevRound} M${leftMatch} Winner vs R${prevRound} M${rightMatch} Winner`;
  };

  // 👇 YAHAN ADD KAR
  const getNextDate = (date) => {
    if (!date) return "";

    const d = new Date(date);
    d.setDate(d.getDate() + 1);

    return d.toISOString().split("T")[0];
  };

  const [showRemainingOnly, setShowRemainingOnly] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState([
    "Cat.B(85+ combined)",
  ]);

  const [selectedRounds, setSelectedRounds] = useState(["Round 1", "Round 2"]);

  const [days, setDays] = useState([]);
  useEffect(() => {
    if (days.length > 0) {
      sessionStorage.setItem("orderPlayDays", JSON.stringify(days));
    }
  }, [days]);

  const [newDayDate, setNewDayDate] = useState("");
  const [newCourtCount, setNewCourtCount] = useState(4);
  const [newMatchesPerCourt, setNewMatchesPerCourt] = useState({
    1: 4,
    2: 4,
    3: 4,
    4: 4,
  });
  const [newSelectedCategories, setNewSelectedCategories] = useState([]);
  const [newSelectedRounds, setNewSelectedRounds] = useState([]);
  const [hideGrid, setHideGrid] = useState(false);

  const [grid, setGrid] = useState([]);
  const [events, setEvents] = useState([]);

  const [notPlacedMatches, setNotPlacedMatches] = useState([]);

  const [courtCount, setCourtCount] = useState(4);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [matchesPerCourt, setMatchesPerCourt] = useState({
    1: 4,
    2: 4,
    3: 4,
    4: 4,
  });
  useEffect(() => {
    let updated = {};

    for (let i = 1; i <= courtCount; i++) {
      updated[i] = matchesPerCourt[i] || 4;
    }

    setMatchesPerCourt(updated);
  }, [courtCount]);

  const roundsList = [
    "Round 1",
    "Round 2",
    "Round 3",
    "Round 4",
    "Round 5",
    "Round 6",
  ];

  /* ================= FETCH EVENTS ================= */

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      sessionStorage.setItem("selectedDate", selectedDate);
    }
  }, [selectedDate]);
  /*
  useEffect(() => {
    if (!selectedDate || events.length === 0) return;

    const interval = setInterval(() => {
      console.log("Auto Refresh Order Of Play...");
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedDate, events, selectedCategories, selectedRounds]);

  /*
  useEffect(() => {
    if (events.length > 0 && selectedDate) {
      fetchData();
    }
  }, [events, selectedDate]);
*/

  useEffect(() => {
    if (events.length > 0 && selectedDate && days.length === 0) {
      fetchData();
    }
  }, [events, selectedDate]);

  useEffect(() => {
    const savedDays = sessionStorage.getItem("orderPlayDays");

    if (savedDays) {
      setDays(JSON.parse(savedDays));
      return;
    }

    if (events.length > 0 && selectedDate) {
      fetchData();
    }
  }, [events, selectedDate]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        { withCredentials: true },
      );

      const allEvents = res.data.data;

      setEvents(allEvents);
      const savedDate = localStorage.getItem("selectedDate");

      if (savedDate) {
        setSelectedDate(savedDate);
      } else {
        setSelectedDate(new Date().toISOString().split("T")[0]);
      }
      setSelectedEventId(allEvents[0]?._id);
    } catch (err) {
      console.error(err);
    }
  };

  const getMatches = async (categories, rounds) => {
    const filteredEvents =
      categories.length > 0
        ? events.filter((ev) => categories.includes(ev.name))
        : events;

    const allResponses = await Promise.all(
      filteredEvents.map((ev) =>
        axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
          { withCredentials: true },
        ),
      ),
    );

    let allMatches = [];

    const allowedRounds = rounds.map((r) => r.trim().toLowerCase());

    // 🔥 MATCH BUILD
    allResponses.forEach((res, index) => {
      const ev = filteredEvents[index];
      const matches = res.data.data || [];
      //console.log("ALL MATCHES", matches);

      const filteredMatches = matches.filter((m) => {
        const isAllowedRound = allowedRounds.includes(
          (m.Stage || "").trim().toLowerCase(),
        );
        if (m.Winner) return false;

        return isAllowedRound;
      });
      const roundCounters = {};

      const roundWiseMatches = {};

      filteredMatches.forEach((m) => {
        if (!roundWiseMatches[m.Stage]) {
          roundWiseMatches[m.Stage] = [];
        }

        // Round 1 ke BYE matches skip
        if (!(m.Stage === "Round 1" && (!m.Team1 || !m.Team2))) {
          roundWiseMatches[m.Stage].push(m);
        }
      });

      Object.keys(roundWiseMatches).forEach((stage) => {
        roundWiseMatches[stage].sort((a, b) => a.Match_number - b.Match_number);
      });

      const matchesWithData = filteredMatches.map((m) => {
        //console.log("FULL MATCH OBJECT:", m);
        const stage = (m.Stage || "Round 1").trim();

        if (!roundCounters[stage]) {
          roundCounters[stage] = 1;
        }

        return {
          ...m,
          category: ev.name,
          // matchNo: m.Match_number,
          matchNo:
            m.Stage === "Round 1" && (!m.Team1 || !m.Team2)
              ? "-"
              : roundWiseMatches[m.Stage].findIndex((x) => x._id === m._id) + 1,
        };
      });

      allMatches.push(...matchesWithData);
    });

    //  SORT (important for proper scheduling)
    const roundOrder = {
      "Round 1": 1,
      "Round 2": 2,
      "Round 3": 3,
      "Round 4": 4,
      "Round 5": 5,
      "Round 6": 6,
    };

    allMatches.sort((a, b) => {
      // 🔥 1. forced matches ALWAYS last
      const forceDiff =
        (a.forcedPlacement === true) - (b.forcedPlacement === true);

      if (forceDiff !== 0) return forceDiff;

      // 🔥 2. round order
      const rDiff = (roundOrder[a.Stage] || 99) - (roundOrder[b.Stage] || 99);

      if (rDiff !== 0) return rDiff;

      // 🔥 3. match number
      return (a.matchNo || 0) - (b.matchNo || 0);
    });

    console.table(
      allMatches.map((m) => ({
        Stage: m.Stage,
        Match: m.matchNo,
        Winner: m.Winner
          ? `${m.Winner.partner1?.name}${
              m.Winner.partner2 ? " & " + m.Winner.partner2?.name : ""
            }`
          : "No Winner",
      })),
    );

    console.log("FINAL MATCHES (AFTER SORT):", allMatches);

    console.log("ALL MATCHES BEFORE GRID:", allMatches);
    console.table(
      allMatches
        .filter((m) => m.category.includes("Cat.B"))
        .map((m) => ({
          Stage: m.Stage,
          Match_number: m.Match_number,
          matchNo: m.matchNo,
          category: m.category,
        })),
    );
    return allMatches;
  };

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {
    console.log("fetchData called");
    if (!selectedDate) {
      toast.error("Select date first");
      return;
    }

    try {
      const allMatches = await getMatches(selectedCategories, selectedRounds);
      /* ================= DAY LOGIC ================= */
      const day1 = buildGrid(allMatches, courtCount, matchesPerCourt);

      setDays([
        {
          date: selectedDate,
          courtCount,
          matchesPerCourt,
          grid: day1.grid,
          remaining: day1.remainingMatches,
        },
      ]);

      setGrid(day1.grid);
      setNotPlacedMatches(day1.remainingMatches);
    } catch (err) {
      console.error(err);
      toast.error("Error loading matches");
    }
  };

  /* ================= ADD Next DAY ================= */
  const addNextDay = async () => {
    // Date validation
    if (!newDayDate) {
      toast.error("Select date");
      return;
    }

    try {
      // Day 2 ke liye selected category + rounds ke matches lao
      const allNewMatches = await getMatches(
        newSelectedCategories,
        newSelectedRounds,
      );
      console.log(allNewMatches[0]);
      // Already scheduled matches ki ids
      const scheduledIds = new Set();

      days.forEach((day) => {
        day.grid.forEach((row) => {
          row.forEach((cell) => {
            if (cell?.match?._id) {
              scheduledIds.add(cell.match._id);
            }
          });
        });
      });

      // Sirf unscheduled matches rakho
      const availableMatches = allNewMatches.filter(
        (m) => !scheduledIds.has(m._id),
      );

      // Sirf selected categories ke remaining matches
      const filteredRemaining = notPlacedMatches.filter((m) =>
        newSelectedCategories.includes(m.category),
      );

      const uniqueMap = new Map();

      [...filteredRemaining, ...availableMatches].forEach((m) => {
        uniqueMap.set(m._id, m);
      });

      const newMatches = Array.from(uniqueMap.values());

      // New day ka grid banao
      const newDay = buildGrid(
        newMatches,
        newCourtCount,
        newMatchesPerCourt,
        days,
      );

      const updatedDays = [
        ...days,
        {
          date: newDayDate,
          courtCount: newCourtCount,
          matchesPerCourt: newMatchesPerCourt,
          grid: newDay.grid,
          remaining: newDay.remainingMatches,
        },
      ];

      // Validation
      if (!validateAllDays(updatedDays)) {
        toast.error("❌ Same player same time across days");
        return;
      }

      // Update state
      setDays(updatedDays);
      setNotPlacedMatches(newDay.remainingMatches);
      setNewDayDate("");

      toast.success("Day added successfully ✅");
    } catch (err) {
      console.error(err);
      toast.error("Error adding next day");
    }
  };
  /* ================= REMOVE NEXT DAY ================= */

  const deleteDay = (dayIndex) => {
    if (dayIndex === 0) return;

    const dayToDelete = days[dayIndex];

    // Us day ke saare matches nikaalo
    const deletedMatches = [];

    dayToDelete.grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell?.match) {
          deletedMatches.push({
            ...cell.match,
            forcedPlacement: false,
          });
        }
      });
    });

    const updatedDays = days.filter((_, index) => index !== dayIndex);

    setNotPlacedMatches((prev) => [...deletedMatches, ...prev]);

    setDays(updatedDays);

    toast.success(`Day ${dayIndex + 1} deleted successfully`);
  };
  /* ================= BUILD GRID ================= */

  const buildGrid = (
    matches,
    courtCount,
    matchesPerCourt,
    existingDays = [],
  ) => {
    let temp = [];
    const maxRows = Math.max(...Object.values(matchesPerCourt));

    console.log("TOTAL SLOTS =", courtCount * maxRows);

    console.log("TOTAL MATCHES =", matches.length);

    const timeSlotPlayers = {};
    const playerLastRow = {};
    const playerLastCourt = {};

    let notPlacedMatches = [];
    let forcedMatches = []; // ✅ added

    /* ================= GRID CREATE ================= */

    for (let i = 0; i < maxRows; i++) {
      let row = [];

      for (let j = 0; j < courtCount; j++) {
        row.push({
          match: null,
          time: getTimeLabel(i),
          court: j + 1,
        });
      }

      temp.push(row);
    }

    /* ================= 🔥 LOAD PREVIOUS DAYS ================= */

    existingDays.forEach((day) => {
      day.grid.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (!cell?.match) return;

          const players = getPlayers(cell.match);
          const time = cell.time;

          if (!timeSlotPlayers[time]) {
            timeSlotPlayers[time] = new Set();
          }

          players.forEach((p) => {
            timeSlotPlayers[time].add(p);
            playerLastRow[p] = i;
            playerLastCourt[p] = j;
          });
        });
      });
    });

    /* ================= 🔥 PLACE MATCHES ================= */

    matches.forEach((match) => {
      const players = getPlayers(match);
      let placed = false;
      let hadConflict = false;

      for (let i = 0; i < maxRows; i++) {
        //const time = getTimeLabel(i);
        const time = `${getTimeLabel(i)}-${i}`;

        if (!timeSlotPlayers[time]) {
          timeSlotPlayers[time] = new Set();
        }

        for (let j = 0; j < courtCount; j++) {
          if (i >= (matchesPerCourt[j + 1] || 0)) continue;
          if (temp[i][j].match) continue;

          const slotSet = timeSlotPlayers[time];

          // ❌ SAME TIME CONFLICT
          const sameTimeConflict = players.some((p) => slotSet.has(p));
          if (sameTimeConflict) {
            console.log(
              "CONSECUTIVE CONFLICT =>",
              match.matchNo,
              "ROW =",
              i,
              "COURT =",
              j,
            );
            hadConflict = true;
            continue;
          }

          // ❌ CONSECUTIVE CONFLICT
          let consecutiveConflict = false;

          players.forEach((p) => {
            if (playerLastRow[p] !== undefined) {
              const lastRow = playerLastRow[p];
              const lastCourt = playerLastCourt[p];

              if (Math.abs(lastRow - i) === 1) {
                console.log(
                  "PLAYER=",
                  p,
                  "LASTROW=",
                  lastRow,
                  "CURRENTROW=",
                  i,
                  "DIFF=",
                  Math.abs(lastRow - i),
                  "LASTCOURT=",
                  lastCourt,
                  "CURRENTCOURT=",
                  j,
                  "MATCH=",
                  match.matchNo,
                );
                if (lastCourt !== j) {
                  consecutiveConflict = true;
                }
              }
            }
          });

          if (consecutiveConflict) {
            console.log(
              "CONSECUTIVE CONFLICT =>",
              match.matchNo,
              "ROW =",
              i,
              "COURT =",
              j,
            );
            hadConflict = true;
            continue;
          }

          /* ✅ PLACE NORMAL MATCH */

          console.log(
            "NORMAL PLACED =>",
            "Match:",
            match.matchNo,
            "Row:",
            i,
            "Court:",
            j,
          );

          temp[i][j].match = match;

          players.forEach((p) => {
            slotSet.add(p);
            playerLastRow[p] = i;
            playerLastCourt[p] = j;
          });

          placed = true;
          break;
        }

        if (placed) break;
      }

      console.log(
        "MATCH",
        match.matchNo,
        "PLACED =",
        placed,
        "HAD CONFLICT =",
        hadConflict,
      );
      if (!placed) {
        console.log("NORMAL FAILED =>", match.matchNo);
      }

      /* ================= 🔥 FORCED PLACEMENT ================= */
      /* ================= RELAXED PASS ================= */
      if (!placed) {
        for (let i = maxRows - 1; i >= 0; i--) {
          const time = `${getTimeLabel(i)}-${i}`;
          if (!timeSlotPlayers[time]) {
            timeSlotPlayers[time] = new Set();
          }

          for (let j = 0; j < courtCount; j++) {
            if (i >= (matchesPerCourt[j + 1] || 0)) continue;
            if (temp[i][j].match) continue;

            const slotSet = timeSlotPlayers[time];

            // ❌ only same time conflict check
            const sameTimeConflict = players.some((p) => slotSet.has(p));

            if (sameTimeConflict) continue;

            temp[i][j].match = match;

            players.forEach((p) => {
              slotSet.add(p);
              playerLastRow[p] = i;
              playerLastCourt[p] = j;
            });

            placed = true;

            console.log(
              "RELAXED PLACEMENT =>",
              match.matchNo,
              "ROW =",
              i,
              "COURT =",
              j,
            );

            break;
          }

          if (placed) break;
        }
      }

      /* ================= FORCED PLACEMENT ================= */
      if (!placed) {
        console.log(
          "FORCED MATCH =>",
          match.matchNo,
          match.category,
          match.Stage,
          "HAD CONFLICT =",
          hadConflict,
        );

        for (let r = maxRows - 1; r >= 0; r--) {
          for (let c = 0; c < courtCount; c++) {
            if (r < (matchesPerCourt[c + 1] || 0) && !temp[r][c].match) {
              temp[r][c].match = {
                ...match,
                forcedPlacement: true,
              };

              forcedMatches.push(temp[r][c].match);

              placed = true;
              break;
            }
          }

          if (placed) break;
        }
      }

      /* ================= NOT PLACED ================= */

      if (!placed) {
        notPlacedMatches.push(match);
      }
    });

    temp.forEach((row, idx) => {
      console.log("ROW", idx, "MATCHES =", row.filter((c) => c.match).length);
    });
    return {
      grid: temp,
      remainingMatches: notPlacedMatches,
      forcedMatches, // ✅ useful for later sorting/UI
    };
  };
  /* ================= SAVE DATA ================= */
  const saveOrderOfPlay = async () => {
    alert("SAVE FUNCTION CALLED");
    console.log("SAVE CLICKED");
    console.log("DAYS =", days);
    console.log("DAYS TO SAVE", days);
    try {
      for (const day of days) {
        await axios.post(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/order-of-play`,
          {
            eventId: selectedEventId,
            playDate: day.date,
            grid: day.grid,
          },
          { withCredentials: true },
        );
      }

      toast.success("All days saved successfully ✅");
    } catch (err) {
      console.error(err);
      toast.error("Save Failed");
    }
  };
  /* ================= SETTINGS ================= */

  const handleReset = () => {
    setShowFilters((prev) => !prev);
    setHideGrid(false); // ALWAYS show grid
  };
  //console.log("hideGrid:", hideGrid);
  /* ================= PRINT ================= */

  const handlePrint = () => {
    window.print();
  };

  /* ================= ROUND SELECT ================= */

  const handleRoundSelect = (round) => {
    let updated = [...selectedRounds];

    if (updated.includes(round)) {
      updated = updated.filter((r) => r !== round);
    } else {
      updated.push(round);
    }

    setSelectedRounds(updated);
  };
  const validateLocalMove = (grid, i, j) => {
    const cell = grid[i][j];
    if (!cell?.match || cell.match.forcedPlacement) return true;

    const players = getPlayers(cell.match);

    // ONLY check nearby rows
    const rowsToCheck = [i - 1, i, i + 1].filter(
      (r) => r >= 0 && r < grid.length,
    );

    for (const r of rowsToCheck) {
      for (let c = 0; c < grid[r].length; c++) {
        const other = grid[r][c];
        if (!other?.match || other.match._id === cell.match._id) continue;
        if (other.match.forcedPlacement) continue;

        const otherPlayers = getPlayers(other.match);

        // SAME TIME CHECK
        if (other.time === cell.time) {
          if (players.some((p) => otherPlayers.includes(p))) {
            return "❌ Same player same time";
          }
        }

        // CONSECUTIVE CHECK
        if (Math.abs(r - i) === 1 && c !== j) {
          if (players.some((p) => otherPlayers.includes(p))) {
            return "❌ Consecutive matches on different courts";
          }
        }
      }
    }

    return true;
  };

  const validateAllDays = (daysData) => {
    console.log("VALIDATE ALL DAYS");
    // const timeMap = {};
    //const playerLastMatch = {}; // 🔥 track last match globally

    for (const day of daysData) {
      const timeMap = {};
      const playerLastMatch = {};

      for (let i = 0; i < day.grid.length; i++) {
        for (let j = 0; j < day.grid[i].length; j++) {
          const cell = day.grid[i][j];
          if (!cell?.match) continue;

          const players = getPlayers(cell.match);
          const time = cell.time;

          // 🔥 SAME TIME CHECK (across all days)
          if (!timeMap[time]) {
            timeMap[time] = new Set();
          }

          for (const p of players) {
            if (timeMap[time].has(p)) {
              console.log("CONFLICT PLAYER ID:", p);
              console.log("TIME:", time);
              console.log("MATCH NO:", cell.match.matchNo);
              console.log("MATCH:", cell.match);
              console.log("MATCH KEYS =", Object.keys(cell.match));

              return "❌ Same player same time";
            }
          }

          // 🔥 CONSECUTIVE CHECK (across all days)
          for (const p of players) {
            if (playerLastMatch[p]) {
              const last = playerLastMatch[p];

              const isNextMatch =
                last.dayIndex === daysData.indexOf(day) &&
                Math.abs(last.rowIndex - i) === 1;

              console.log(
                "PLAYER=",
                p,
                "LASTROW=",
                last.rowIndex,
                "CURRENTROW=",
                i,
                "DIFF=",
                Math.abs(last.rowIndex - i),
                "ISNEXT=",
                isNextMatch,
                "LASTCOURT=",
                last.court,
                "CURRENTCOURT=",
                j,
              );

              if (isNextMatch && last.court !== j) {
                console.log("CONSECUTIVE CONFLICT");
                console.log(
                  "PLAYER=",
                  p,
                  "LASTROW=",
                  last.rowIndex,
                  "CURRENTROW=",
                  i,
                  "LASTCOURT=",
                  last.court,
                  "CURRENTCOURT=",
                  j,
                );
                console.log("LAST MATCH ID =", last.matchId);
                console.log("LAST MATCH NO =", last.matchNo);

                console.log("CURRENT MATCH ID =", cell.match._id);
                console.log("CURRENT MATCH NO =", cell.match.matchNo);

                console.log("CURRENT MATCH =", cell.match);

                return "❌ Consecutive matches on different courts";
              }
            }
          }

          // ✅ UPDATE TRACKERS
          players.forEach((p) => timeMap[time].add(p));

          players.forEach((p) => {
            if (
              !playerLastMatch[p] ||
              daysData.indexOf(day) > playerLastMatch[p].dayIndex ||
              (daysData.indexOf(day) === playerLastMatch[p].dayIndex &&
                i > playerLastMatch[p].rowIndex)
            ) {
              playerLastMatch[p] = {
                dayIndex: daysData.indexOf(day),
                rowIndex: i,
                court: j,
                matchId: cell.match._id,
                matchNo: cell.match.matchNo,
              };
            }
          });
        }
      }
    }

    return true;
  };
  /* ================= DRAG END ================= */

  const handleDragEnd = (event) => {
    console.log("DRAG END CALLED");

    const { active, over } = event;
    console.log("ACTIVE =", active?.id);
    console.log("OVER =", over?.id);
    if (!over) return;
    if (active.id === over.id) return;

    const activeId = active.id;
    const overId = over.id;

    let activePos = null;
    let overPos = null;
    let activeDayIndex = null;
    let overDayIndex = null;

    // 🔍 Find positions
    days.forEach((day, dIndex) => {
      day.grid.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell?.match?._id === activeId) {
            activePos = { i, j };
            activeDayIndex = dIndex;
          }

          if (`slot-${dIndex}-${i}-${j}` === overId) {
            overPos = { i, j };
            overDayIndex = dIndex;
          }
        });
      });
    });

    if (!activePos || !overPos) return;
    /*
if (
  sourceDay === targetDay &&
  activePos.i === overPos.i &&
  activePos.j === overPos.j
) {
  return;
}

*/

    // ❌ cross day swap allowed? (YES for you)
    const sourceDay = activeDayIndex;
    const targetDay = overDayIndex;

    const newDays = JSON.parse(JSON.stringify(days));

    const dragged = newDays[sourceDay].grid[activePos.i][activePos.j];
    const completedMatches = JSON.parse(
      sessionStorage.getItem("completedMatches") || "[]",
    );

    if (completedMatches.includes(dragged?.match?._id)) {
      toast.error("Completed matches cannot be moved.");
      return;
    }

    const target = newDays[targetDay].grid[overPos.i][overPos.j];

    const draggedPlayers = getPlayers(dragged.match || {});
    const targetPlayers = getPlayers(target.match || {});

    const affectedPlayers = [...new Set([...draggedPlayers, ...targetPlayers])];
    console.log("DRAGGED MATCH =", dragged?.match?.matchNo);
    console.log("DRAGGED DATA =", dragged?.match);

    console.log("TARGET MATCH =", target?.match?.matchNo);
    console.log("TARGET DATA =", target?.match);

    if (!dragged?.match) return;

    // 👉 if same day → swap
    if (sourceDay === targetDay) {
      if (!target?.match) return;

      console.log("SOURCE CELL =", activePos);
      console.log("TARGET CELL =", overPos);
      console.log("DRAGGED MATCH =", dragged?.match?.matchNo);
      console.log("TARGET MATCH BEFORE SWAP =", target?.match?.matchNo);

      const temp = dragged.match;
      dragged.match = target.match;
      target.match = temp;
      console.log("TARGET MATCH AFTER SWAP =", target?.match?.matchNo);
    } else {
      // 👉 MOVE to next day (shift logic)
      if (target?.match) {
        toast.error("❌ Target slot not empty");
        return;
      }

      target.match = dragged.match;
      dragged.match = null;
    }

    // 🔥 VALIDATION FUNCTION
    const validateDay = (grid) => {
      const timeMap = {}; // 🔥 important

      const playerLastRow = {};

      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          const cell = grid[i][j];
          if (!cell?.match) continue;

          const players = getPlayers(cell.match);
          const time = `${cell.time}-${i}`;

          // 🔥 SAME TIME CHECK (STRICT)
          if (!timeMap[time]) {
            timeMap[time] = new Set();
          }

          for (const p of players) {
            console.log(
              "CONFLICT MATCH NO =",
              cell.match.matchNo,
              "TIME =",
              time,
            );

            if (timeMap[time].has(p)) {
              console.log("CONFLICT PLAYER =", p);
              console.log("TIME =", time);
              console.log("MATCH =", cell.match.matchNo);

              for (let r = 0; r <= i; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                  const oldCell = grid[r][c];

                  if (
                    oldCell?.match &&
                    oldCell.match._id !== cell.match._id &&
                    getPlayers(oldCell.match).includes(p)
                  ) {
                    console.log(
                      "PREVIOUS MATCH NO =",
                      oldCell.match.matchNo,
                      "ROW =",
                      r,
                      "COURT =",
                      c,
                    );
                  }
                }
              }
              return "❌ Same player same time";
            }
          }
          // 🔥 CONSECUTIVE CHECK
          for (const p of players) {
            if (playerLastRow[p] !== undefined) {
              const diff = Math.abs(playerLastRow[p] - i);

              if (diff === 1) {
                const lastCourt = grid[playerLastRow[p]].findIndex(
                  (c) => c.match && getPlayers(c.match).includes(p),
                );
                console.log("PLAYER =", p);
                console.log("LAST ROW =", playerLastRow[p]);
                console.log("CURRENT ROW =", i);
                console.log("LAST COURT =", lastCourt);
                console.log("CURRENT COURT =", j);

                if (lastCourt !== j) {
                  return "❌ Consecutive matches on different courts"; // consecutive matches on different courts
                }
              }
            }
          }

          // ✅ update trackers
          players.forEach((p) => timeMap[time].add(p));
          players.forEach((p) => (playerLastRow[p] = i));
        }
      }

      return true;
    };
    /*

  // ❌ validate both days
 // 👉 source day validation
const sourceError = validateDay(newDays[sourceDay].grid);
//console.log("SOURCE VALIDATION =", sourceError);

if (sourceError !== true) {
  toast.error(sourceError);
  return;
}
  */

    // 👉 target day validation (sirf agar different day ho)
    if (sourceDay !== targetDay) {
      const targetError = validateDay(newDays[targetDay].grid);

      if (targetError !== true) {
        toast.error(targetError);
        return;
      }
    }
    console.log("BEFORE VALIDATE ALL DAYS");
    /*
    const allDaysError = validateAllDays(newDays);
    console.log("VALIDATION RESULT =", allDaysError);

    if (allDaysError !== true) {
      toast.error(allDaysError);
      return;
    }
*/
    // 🔥 Sirf dragged card validate karo
    const dragError = validateLocalMove(
      newDays[sourceDay].grid,
      overPos.i,
      overPos.j,
    );

    if (dragError !== true) {
      toast.error(dragError);
      return;
    }

    // 🔥 Swap hua dusra card bhi validate karo
    if (sourceDay === targetDay) {
      const targetError = validateLocalMove(
        newDays[targetDay].grid,
        activePos.i,
        activePos.j,
      );

      if (targetError !== true) {
        toast.error(targetError);
        return;
      }
    }
    console.log("BEFORE SET DAYS");

    // ✅ APPLY
    setDays(newDays);
    console.log("AFTER SET DAYS");

    toast.success("✅ Match moved successfully");
    // ✅ APPLY
  };
  //console.log("DAYS:", days);
  //console.log("Remaining:", notPlacedMatches);

  /* ================= UI ================= */

  return (
    <div className={styles.container}>
      {/* TOP BAR */}

      <div className={styles.topBar}>
        <h1>ORDER OF PLAY</h1>

        <div className={styles.buttonGroup}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Settings
          </button>

          <button className={styles.generateBtn} onClick={saveOrderOfPlay}>
            Save Order
          </button>

          <button className={styles.printBtn} onClick={handlePrint}>
            Print PDF
          </button>
        </div>
      </div>

      {/* FILTERS */}

      {showFilters && (
        <div className={styles.filterBox}>
          {/* DATE */}

          <div>
            <h3>Select Date</h3>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.courtInput}
            />
          </div>

          {/* CATEGORY */}

          <div>
            <h3>Categories</h3>

            {events.map((ev) => (
              <label key={ev._id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(ev.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, ev.name]);
                    } else {
                      setSelectedCategories(
                        selectedCategories.filter((c) => c !== ev.name),
                      );
                    }
                  }}
                />

                {ev.name}
              </label>
            ))}
          </div>

          {/* ROUNDS */}

          <div className={styles.roundSelector}>
            <h3>Select Rounds</h3>

            <div className={styles.roundButtons}>
              {roundsList.map((round) => (
                <button
                  key={round}
                  onClick={() => handleRoundSelect(round)}
                  className={
                    selectedRounds.includes(round)
                      ? styles.activeRoundBtn
                      : styles.roundBtn
                  }
                >
                  {round}
                </button>
              ))}
            </div>
          </div>

          {/* COURTS */}

          <div className={styles.settingsBox}>
            <h3>Court Settings</h3>

            <div>
              <label>Number Of Courts</label>

              <input
                type="number"
                min="1"
                value={courtCount}
                onChange={(e) => setCourtCount(Number(e.target.value))}
                className={styles.courtInput}
              />
            </div>

            <div
              style={{
                marginTop: "20px",
              }}
            >
              <label>Matches Per Court</label>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  flexWrap: "wrap",
                  marginTop: "10px",
                }}
              >
                {Array.from({
                  length: courtCount,
                }).map((_, index) => (
                  <div key={index}>
                    <p>Court {index + 1}</p>

                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={matchesPerCourt[index + 1] || 4}
                      onChange={(e) => {
                        const value = Math.min(
                          10,
                          Math.max(1, Number(e.target.value)),
                        );

                        setMatchesPerCourt({
                          ...matchesPerCourt,
                          [index + 1]: value,
                        });
                      }}
                      className={styles.courtInput}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              className={styles.generateBtn}
              onClick={fetchData}
              style={{
                marginTop: "25px",
              }}
            >
              Apply Changes
            </button>

            <button
              className={styles.generateBtn}
              onClick={() => setShowRemainingOnly(true)}
              style={{ marginTop: "10px" }}
            >
              Show Remaining Matches ({notPlacedMatches.length})
            </button>
          </div>
        </div>
      )}

      {/* GRID */}

      {!hideGrid && (
        <>
          {days.map((day, dayIndex) => (
            <div key={dayIndex} style={{ marginBottom: "50px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                <h2 style={{ margin: 0 }}>
                  Day {dayIndex + 1} - {dayIndex === 0 ? todayDate : day.date}
                </h2>

                {dayIndex > 0 && (
                  <button
                    onClick={() => deleteDay(dayIndex)}
                    className={styles.deleteDayBtn}
                  >
                    Delete Day
                  </button>
                )}
              </div>

              {/* HEADER */}
              <div
                className={styles.header}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${day.courtCount},1fr)`,
                  gap: "20px",
                }}
              >
                {Array.from({ length: day.courtCount }).map((_, index) => (
                  <div key={index}>COURT {index + 1}</div>
                ))}
              </div>

              {/* GRID */}
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                {day.grid.map((row, i) => (
                  <div
                    key={i}
                    className={styles.row}
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${day.courtCount},1fr)`,
                      gap: "20px",
                    }}
                  >
                    {row.map((cell, j) => (
                      <DroppableSlot key={j} id={`slot-${dayIndex}-${i}-${j}`}>
                        {cell?.match && (
                          <DraggableMatch
                            match={cell.match}
                            time={cell.time}
                            allMatchesRef={allMatchesRef}
                          />
                        )}
                      </DroppableSlot>
                    ))}
                  </div>
                ))}
              </DndContext>
              {/* ADD NEXT DAY */}
              {showFilters && dayIndex === days.length - 1 && (
                <div className={styles.addDayBox}>
                  <h3 className={styles.addDayTitle}>📅 Add Next Day</h3>

                  <div className={styles.filterBox}>
                    {/* DATE */}
                    <div>
                      <h3>Select Date</h3>

                      <input
                        type="date"
                        value={newDayDate}
                        onChange={(e) => setNewDayDate(e.target.value)}
                        className={styles.courtInput}
                      />
                    </div>

                    {/* CATEGORY */}
                    <div>
                      <h3>Categories</h3>

                      {events.map((ev) => (
                        <label key={ev._id} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={newSelectedCategories.includes(ev.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewSelectedCategories([
                                  ...newSelectedCategories,
                                  ev.name,
                                ]);
                              } else {
                                setNewSelectedCategories(
                                  newSelectedCategories.filter(
                                    (c) => c !== ev.name,
                                  ),
                                );
                              }
                            }}
                          />
                          {ev.name}
                        </label>
                      ))}
                    </div>

                    {/* ROUNDS */}
                    <div className={styles.roundSelector}>
                      <h3>Select Rounds</h3>

                      <div className={styles.roundButtons}>
                        {roundsList.map((round) => (
                          <button
                            key={round}
                            type="button"
                            onClick={() => {
                              if (newSelectedRounds.includes(round)) {
                                setNewSelectedRounds(
                                  newSelectedRounds.filter((r) => r !== round),
                                );
                              } else {
                                setNewSelectedRounds([
                                  ...newSelectedRounds,
                                  round,
                                ]);
                              }
                            }}
                            className={
                              newSelectedRounds.includes(round)
                                ? styles.activeRoundBtn
                                : styles.roundBtn
                            }
                          >
                            {round}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* COURT SETTINGS */}
                    <div className={styles.settingsBox}>
                      <h3>Court Settings</h3>

                      <div>
                        <label>Number Of Courts</label>

                        <input
                          type="number"
                          min="1"
                          value={newCourtCount}
                          onChange={(e) =>
                            setNewCourtCount(Number(e.target.value))
                          }
                          className={styles.courtInput}
                        />
                      </div>

                      <div style={{ marginTop: "20px" }}>
                        <label>Matches Per Court</label>

                        <div
                          style={{
                            display: "flex",
                            gap: "20px",
                            flexWrap: "wrap",
                            marginTop: "10px",
                          }}
                        >
                          {Array.from({ length: newCourtCount }).map(
                            (_, index) => (
                              <div key={index}>
                                <p>Court {index + 1}</p>

                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={newMatchesPerCourt[index + 1] || 4}
                                  onChange={(e) =>
                                    setNewMatchesPerCourt({
                                      ...newMatchesPerCourt,
                                      [index + 1]: Number(e.target.value),
                                    })
                                  }
                                  className={styles.courtInput}
                                />
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <button
                        className={styles.generateBtn}
                        onClick={addNextDay}
                        style={{ marginTop: "25px" }}
                      >
                        + Add Day
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {showRemainingOnly && (
            <div className={styles.remainingBox}>
              <h3>Remaining Matches</h3>

              {notPlacedMatches.length === 0 ? (
                <p style={{ color: "green", fontWeight: "bold" }}>
                  🎉 All matches scheduled successfully!
                </p>
              ) : (
                notPlacedMatches.map((m, idx) => (
                  <div key={m._id || idx} className={styles.remainingItem}>
                    <p>
                      <b>Category:</b> {m.category}
                    </p>
                    <p>
                      <b>Round:</b> {m.Stage}
                    </p>
                    <p>
                      <b>Match:</b> {getRemainingMatchDisplay(m)}
                    </p>
                  </div>
                ))
              )}

              <button
                className={styles.printBtn}
                onClick={() => setShowRemainingOnly(false)}
                style={{ marginTop: "10px" }}
              >
                Close
              </button>
            </div>
          )}

          {showFilters && (
            <div style={{ marginTop: "30px" }}>
              <h3>Remaining Matches: {notPlacedMatches.length}</h3>

              {/* ✅ SUCCESS MESSAGE */}
              {notPlacedMatches.length === 0 && (
                <p
                  style={{
                    marginTop: "10px",
                    color: "green",
                    fontWeight: "bold",
                  }}
                >
                  🎉 All matches scheduled successfully!
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
