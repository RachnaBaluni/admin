import React, {
  useEffect,
  useState,
  useRef
} from "react";

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

function DraggableMatch({
  match,
  time,
  allMatchesRef
}) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: match._id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const getTeamName = (
  team,
  side
) => {

  // NORMAL TEAM
  if (team?.partner1?.name) {

    return `${team.partner1?.name || ""}
    ${
      team.partner2
        ? " & " + team.partner2?.name
        : ""
    }`;

  }

  // CURRENT ROUND
  const roundNumber =
    Number(
      match.Stage?.replace(
        "Round ",
        ""
      )
    );

  if (
    !roundNumber ||
    roundNumber === 1
  ) {
    return "TBD";
  }

  const prevRound =
    roundNumber - 1;

  const currentMatchNo =
    match.matchNo || 1;

  const leftMatch =
    (currentMatchNo * 2) - 1;

  const rightMatch =
    currentMatchNo * 2;

  // FIND PREVIOUS ROUND MATCHES
  const leftPrevMatch =
    allMatchesRef.current.find(
      (m) =>
        m.Stage === `Round ${prevRound}` &&
        m.matchNo === leftMatch
    );

  const rightPrevMatch =
    allMatchesRef.current.find(
      (m) =>
        m.Stage === `Round ${prevRound}` &&
        m.matchNo === rightMatch
    );

  // AUTO WINNER LOGIC
  const getAutoWinner = (m) => {

    if (!m) return null;

    const team1Exists =
      m.Team1?.partner1?.name;

    const team2Exists =
      m.Team2?.partner1?.name;

    // Team1 vs TBD
    if (
      team1Exists &&
      !team2Exists
    ) {

      return `${m.Team1.partner1?.name}
      ${
        m.Team1.partner2
          ? " & " + m.Team1.partner2?.name
          : ""
      }`;

    }

    // TBD vs Team2
    if (
      !team1Exists &&
      team2Exists
    ) {

      return `${m.Team2.partner1?.name}
      ${
        m.Team2.partner2
          ? " & " + m.Team2.partner2?.name
          : ""
      }`;

    }

    return null;

  };

  // LEFT SIDE
  if (side === 1) {

    const autoWinner =
      getAutoWinner(leftPrevMatch);

    if (autoWinner) {
      return autoWinner;
    }

    return `R${prevRound} M${leftMatch} Winner`;

  }

  // RIGHT SIDE
  const autoWinner =
    getAutoWinner(rightPrevMatch);

  if (autoWinner) {
    return autoWinner;
  }

  return `R${prevRound} M${rightMatch} Winner`;

};
  return (
  <div
    ref={setNodeRef}
    {...listeners}
    {...attributes}
    style={style}
    className={styles.matchCard}
  >
    {/* TIME */}
    <div className={styles.time}>
      {time}
    </div>

    {/* CATEGORY */}
    <div className={styles.category}>
      {match.category}
    </div>

    {/* ROUND */}
    <div className={styles.round}>
      {match.Stage}
    </div>

    {/* TEAM 1 */}
    <div className={styles.team}>
      {getTeamName(match.Team1, 1)}
    </div>

    <div className={styles.vs}>
      VS
    </div>

    {/* TEAM 2 */}
    <div className={styles.team}>
      {getTeamName(match.Team2, 2)}
    </div>
  </div>
);
}
/* ================= DROP SLOT ================= */

function DroppableSlot({
  children,
  id,
}) {

  const { setNodeRef } =
    useDroppable({
      id,
    });

  return (
    <div
      ref={setNodeRef}
      className={styles.slot}
    >
      {children}
    </div>
  );
}

/* ================= MAIN ================= */

export default function OrderOfPlay() {

  


  const allMatchesRef = useRef([]);

  // 👇 YAHAN ADD KAR
  const getNextDate = (date) => {
    if (!date) return "";

    const d = new Date(date);
    d.setDate(d.getDate() + 1);

    return d.toISOString().split("T")[0];
  };

  
  

const [days, setDays] = useState([]);

const [newDayDate, setNewDayDate] = useState("");
const [newCourtCount, setNewCourtCount] = useState(4);
const [newMatchesPerCourt, setNewMatchesPerCourt] = useState({
  1: 10, 2: 10, 3: 10, 4: 10
});

    const [hideGrid, setHideGrid] = useState(false);


const [grid, setGrid] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);



  const [notPlacedMatches, setNotPlacedMatches] = useState([]);

  const [selectedRounds, setSelectedRounds] = useState(["Round 1"]);
  const [courtCount, setCourtCount] = useState(4);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
const [showFilters, setShowFilters] = useState(false);
  const [matchesPerCourt, setMatchesPerCourt] = useState({
    1: 10, 2: 10, 3: 10, 4: 10
  });
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
    if (events.length > 0) {
      fetchData();
    }
  }, [events]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        { withCredentials: true }
      );

      const allEvents = res.data.data;

      setEvents(allEvents);
      setSelectedCategories(allEvents.map((ev) => ev.name));
setSelectedEventId(allEvents[0]?._id);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= FETCH DATA ================= */

const fetchData = async () => {

   if (!selectedDate) {
    toast.error("Select date first");
    return;
  }

  try {
    const filteredEvents =
      selectedCategories.length > 0
        ? events.filter((ev) =>
            selectedCategories.includes(ev.name)
          )
        : events;

    const allResponses = await Promise.all(
      filteredEvents.map((ev) =>
        axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
          { withCredentials: true }
        )
      )
    );

    let allMatches = [];

    const allowedRounds = selectedRounds.map((r) =>
      r.trim().toLowerCase()
    );

    // 🔥 MATCH BUILD
    allResponses.forEach((res, index) => {
      const ev = filteredEvents[index];
      const matches = res.data.data || [];

      const filteredMatches = matches.filter((m) =>
        allowedRounds.includes(
          (m.Stage || "").trim().toLowerCase()
        )
      );

      const roundCounters = {};

      const matchesWithData = filteredMatches.map((m) => {
        const stage = (m.Stage || "Round 1").trim();

        if (!roundCounters[stage]) {
          roundCounters[stage] = 1;
        }

        return {
          ...m,
          category: ev.name,
          matchNo: roundCounters[stage]++,
        };
      });

      allMatches.push(...matchesWithData);
    });

    // 🔥 SORT (important for proper scheduling)
    const roundOrder = {
      "Round 1": 1,
      "Round 2": 2,
      "Round 3": 3,
      "Round 4": 4,
      "Round 5": 5,
      "Round 6": 6,
    };

    allMatches.sort((a, b) => {
      const rDiff =
        (roundOrder[a.Stage] || 99) -
        (roundOrder[b.Stage] || 99);

      if (rDiff !== 0) return rDiff;

      return (a.matchNo || 0) - (b.matchNo || 0);
    });

    allMatchesRef.current = allMatches;

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

  /* =================new Days================= */


const addNextDay = () => {

  if (!newDayDate) {
    toast.error("Select date");
    return;
  }

  if (notPlacedMatches.length === 0) {
    toast.success("All matches already scheduled ✅");
    return;
  }

  //  Build new day grid using remaining matches
  const newDay = buildGrid(
    notPlacedMatches,
    newCourtCount,
    newMatchesPerCourt
  );

  setDays([
    ...days,
    {
      date: newDayDate,
      courtCount: newCourtCount,
      matchesPerCourt: newMatchesPerCourt,
      grid: newDay.grid,
    },
  ]);

  //  Update remaining matches
  setNotPlacedMatches(newDay.remainingMatches);

  // reset inputs
  setNewDayDate("");
};

  /* ================= BUILD GRID ================= */

  const buildGrid = (matches,courtCount,matchesPerCourt) => {

    let temp = [];
    const maxRows = Math.max(...Object.values(matchesPerCourt));

    const timeSlotPlayers = {};
    const playerLastRow = {};

    let notPlacedMatches = [];

    // GRID CREATE
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

    // PLACE MATCHES
    matches.forEach((match) => {

      const players = getPlayers(match);
      let placed = false;

      for (let i = 0; i < maxRows; i++) {

        const time = getTimeLabel(i);

        if (!timeSlotPlayers[time]) {
          timeSlotPlayers[time] = new Set();
        }

        for (let j = 0; j < courtCount; j++) {

          if (i >= (matchesPerCourt[j + 1] || 0)) continue;
          if (temp[i][j].match) continue;

          const slotSet = timeSlotPlayers[time];

          const sameTimeConflict = players.some((p) =>
            slotSet.has(p)
          );
          if (sameTimeConflict) continue;

          let consecutiveConflict = false;

          players.forEach((p) => {
            if (playerLastRow[p] !== undefined) {

              const lastRow = playerLastRow[p];

              if (Math.abs(lastRow - i) === 1) {

                const lastCourtIndex =
                  temp[lastRow]?.findIndex(
                    (c) =>
                      c.match &&
                      getPlayers(c.match).includes(p)
                  );

                if (lastCourtIndex !== j) {
                  consecutiveConflict = true;
                }
              }
            }
          });

          if (consecutiveConflict) continue;

          // PLACE
          temp[i][j].match = match;

          players.forEach((p) => slotSet.add(p));
          players.forEach((p) => {
            playerLastRow[p] = i;
          });

          placed = true;
          break;
        }

        if (placed) break;
      }

      if (!placed) {
        notPlacedMatches.push(match);
      }

    });

    return {
      grid: temp,
      remainingMatches: notPlacedMatches,
    };
  };
  /* ================= SAVE DATA ================= */
  const saveOrderOfPlay = async () => {
    console.log("SAVE DATE =", selectedDate);
console.log("EVENT =", selectedEventId);
  try {
    
    const res = await axios.post(
      `${import.meta.env.VITE_APP_BACKEND_URL}/api/order-of-play`,
      {
        eventId: selectedEventId,
        playDate: selectedDate,
        grid: grid,
      },
      { withCredentials: true }
    );

    console.log("Saved:", res.data);
    toast.success("Order Of Play Saved");
  } catch (err) {
    console.log("ERROR:", err.response?.data || err);
    toast.error("Save Failed");
  }
};

  /* ================= SETTINGS ================= */

  const handleReset = () => {
  setShowFilters(prev => !prev);
  setHideGrid(false); // ALWAYS show grid
};
console.log("hideGrid:", hideGrid);
  /* ================= PRINT ================= */

  const handlePrint = () => {

    window.print();

  };

  /* ================= ROUND SELECT ================= */

  const handleRoundSelect =
    (round) => {

      let updated =
        [...selectedRounds];

      if (
        updated.includes(round)
      ) {

        updated =
          updated.filter(
            (r) => r !== round
          );

      } else {

        if (
          updated.length >= 2
        ) {

          toast.error(
            "Only 2 rounds allowed"
          );

          return;

        }

        updated.push(round);

      }

      const nums =
        updated
          .map((r) =>
            Number(
              r.replace(
                "Round ",
                ""
              )
            )
          )
          .sort(
            (a, b) =>
              a - b
          );

      if (
        nums.length === 2 &&
        nums[1] - nums[0] !== 1
      ) {

        toast.error(
          "Select consecutive rounds"
        );

        return;

      }

      setSelectedRounds(updated);

    };

  /* ================= DRAG END ================= */

  const handleDragEnd =
    (event) => {

      const {
        active,
        over,
      } = event;

      if (!over) return;

      const activeId =
        active.id;

      const overId =
        over.id;

      if (
        activeId === overId
      ) {
        return;
      }

      let activePos =
        null;

      let overPos =
        null;

      grid.forEach(
        (row, i) => {

          row.forEach(
            (
              cell,
              j
            ) => {

              if (
                cell?.match?._id ===
                activeId
              ) {

                activePos = {
                  i,
                  j,
                };

              }

              if (
                `slot-${i}-${j}` ===
                overId
              ) {

                overPos = {
                  i,
                  j,
                };

              }

            }
          );

        }
      );

      if (
        !activePos ||
        !overPos
      ) {
        return;
      }

      const newGrid =
        JSON.parse(
          JSON.stringify(grid)
        );

      const dragged =
        newGrid[
          activePos.i
        ][activePos.j];

      const target =
        newGrid[
          overPos.i
        ][overPos.j];

      if (
        !dragged?.match ||
        !target?.match
      ) {
        return;
      }

      const tempMatch =
        dragged.match;

      dragged.match =
        target.match;

      target.match =
        tempMatch;

      /* VALIDATION */

      const swappedMatches = [
        {
          match: dragged.match,
          time: dragged.time,
          court: dragged.court,
          rowIndex: activePos.i,
        },
        {
          match: target.match,
          time: target.time,
          court: target.court,
          rowIndex: overPos.i,
        },
      ];

      for (const swapped of swappedMatches) {

        const swappedPlayers =
          getPlayers(swapped.match);

        for (
          let i = 0;
          i < newGrid.length;
          i++
        ) {

          for (
            let j = 0;
            j < newGrid[i].length;
            j++
          ) {

            const cell =
              newGrid[i][j];

            if (!cell?.match) {
              continue;
            }

            const isSameCell =
  i === swapped.rowIndex &&
  j === swapped.court - 1;

if (isSameCell) continue;

            const cellPlayers =
              getPlayers(cell.match);

            const samePlayer =
              swappedPlayers.some((p) =>
                cellPlayers.includes(p)
              );

            if (!samePlayer) {
              continue;
            }

            /* SAME TIME */

            const overlap = swappedPlayers.some((p) =>
  cellPlayers.includes(p)
);

if (
  overlap &&
  swapped.time === cell.time &&
  (i !== swapped.rowIndex || j !== swapped.court - 1)
) {
  toast.error(
    "❌ Same player cannot play on different courts at same time"
  );
  return;
}

            /* CONSECUTIVE */

            const diff =
              Math.abs(
                swapped.rowIndex - i
              );
              const samePlayerConflict =
  swappedPlayers.some((p) =>
    cellPlayers.includes(p)
  );

            if (
              diff === 1 &&
              swapped.court !==
                cell.court
            ) {

              toast.error(
                "❌ Consecutive matches must be on same court"
              );

              return;

            }

          }

        }

      }

      setGrid(newGrid);
      setDays((prevDays) => {
  const updated = [...prevDays];
  updated[0].grid = newGrid; // only Day 1 drag
  return updated;
});

      toast.success(
        "✅ Match swapped"
      );

    };
console.log("DAYS:", days);
console.log("Remaining:", notPlacedMatches);
  /* ================= UI ================= */

  return (
    <div className={styles.container}>

      {/* TOP BAR */}

      <div className={styles.topBar}>

        <h1>
          ORDER OF PLAY
        </h1>

        <div className={styles.buttonGroup}>

          <button
            className={styles.resetBtn}
            onClick={handleReset}
          >
            Settings
          </button>

          <button
            className={styles.generateBtn}
            onClick={fetchData}
          >
            Generate Again
          </button>
          <button
  className={styles.generateBtn}
  onClick={saveOrderOfPlay}
>
  Save Order
</button>

          <button
            className={styles.printBtn}
            onClick={handlePrint}
          >
            Print PDF
          </button>

        </div>

      </div>


      {/* (Add Next Day UI) */}
    <div style={{ marginTop: "30px" }}>

      <h3>Add Next Day</h3>

      <input
        type="date"
        value={newDayDate}
        onChange={(e) => setNewDayDate(e.target.value)}
      />

      <input
        type="number"
        value={newCourtCount}
        onChange={(e) => setNewCourtCount(Number(e.target.value))}
        placeholder="Courts"
      />

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        {Array.from({ length: newCourtCount }).map((_, i) => (
          <input
            key={i}
            type="number"
            placeholder={`Court ${i + 1}`}
            value={newMatchesPerCourt[i + 1] || 10}
            onChange={(e) =>
              setNewMatchesPerCourt({
                ...newMatchesPerCourt,
                [i + 1]: Number(e.target.value),
              })
            }
          />
        ))}
      </div>

      <button
        onClick={addNextDay}
        style={{ marginTop: "15px" }}
      >
        Add Day
      </button>

    </div>

      
      

      {/* FILTERS */}

      {
        showFilters && (

          <div className={styles.filterBox}>

            {/* DATE */}

            <div>

              <h3>
                Select Date
              </h3>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(
                    e.target.value
                  )
                }
                className={styles.courtInput}
              />

            </div>

            {/* CATEGORY */}

            <div>

              <h3>
                Categories
              </h3>

              {
                events.map((ev) => (

                  <label
                    key={ev._id}
                    className={styles.checkboxLabel}
                  >

                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(ev.name)}
                      onChange={(e) => {

                        if (
                          e.target.checked
                        ) {

                          setSelectedCategories([
                            ...selectedCategories,
                            ev.name,
                          ]);

                        } else {

                          setSelectedCategories(
                            selectedCategories.filter(
                              (c) =>
                                c !== ev.name
                            )
                          );

                        }

                      }}
                    />

                    {ev.name}

                  </label>

                ))
              }

            </div>

            {/* ROUNDS */}

            <div className={styles.roundSelector}>

              <h3>
                Select Any 2 Consecutive Rounds
              </h3>

              <div className={styles.roundButtons}>

                {
                  roundsList.map((round) => (

                    <button
                      key={round}
                      onClick={() =>
                        handleRoundSelect(round)
                      }
                      className={
                        selectedRounds.includes(round)
                          ? styles.activeRoundBtn
                          : styles.roundBtn
                      }
                    >

                      {round}

                    </button>

                  ))
                }

              </div>

            </div>

            {/* COURTS */}

            <div className={styles.settingsBox}>

              <h3>
                Court Settings
              </h3>

              <div>

                <label>
                  Number Of Courts
                </label>

                <input
                  type="number"
                  min="1"
                  value={courtCount}
                  onChange={(e) =>
                    setCourtCount(
                      Number(e.target.value)
                    )
                  }
                  className={styles.courtInput}
                />

              </div>

              <div
                style={{
                  marginTop: "20px",
                }}
              >

                <label>
                  Matches Per Court
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap",
                    marginTop: "10px",
                  }}
                >

                  {
                    Array.from({
                      length: courtCount,
                    }).map((_, index) => (

                      <div key={index}>

                        <p>
                          Court {index + 1}
                        </p>

                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={
                            matchesPerCourt[index + 1] || 10
                          }
                          onChange={(e) =>
                            setMatchesPerCourt({
                              ...matchesPerCourt,
                              [index + 1]:
                                Number(e.target.value),
                            })
                          }
                          className={styles.courtInput}
                        />

                      </div>

                    ))
                  }

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

            </div>

          </div>

        )
      }

      {/* GRID */}

{
  !hideGrid && (

    <>
      {days.map((day, dayIndex) => (

        <div key={dayIndex} style={{ marginBottom: "50px" }}>

          {/* DAY TITLE */}
          <h2>
            Day {dayIndex + 1} ({day.date})
          </h2>

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

        </div>
      ))}

<div style={{ marginTop: "30px" }}>
  <h3>Remaining Matches ({notPlacedMatches.length})</h3>

  {notPlacedMatches.length === 0 ? (
    <p style={{ color: "green" }}>
      🎉 All matches scheduled successfully!
    </p>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginTop: "10px",
      }}
    >
      {notPlacedMatches.map((m, index) => (
        <div
          key={m._id}
          style={{
            padding: "8px 12px",
            background: "#ffeaea",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#d32f2f",
          }}
        >
          Match {index + 1}
        </div>
      ))}
    </div>
  )}
</div>
    </>

  )
} 
    </div>            
  );
}