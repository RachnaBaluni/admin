import React, {
  useEffect,
  useState,
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
  ].filter(Boolean);

};

/* ================= DRAG CARD ================= */

function DraggableMatch({
  match,
  time,
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

    if (team?.partner1?.name) {

      return `${team.partner1?.name || ""}
      ${
        team.partner2
          ? " & " + team.partner2?.name
          : ""
      }`;

    }

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

    if (side === 1) {
      return `R${prevRound} M${leftMatch} Winner`;
    }

    return `R${prevRound} M${rightMatch} Winner`;

  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={styles.card}
    >

      <div className={styles.fixedTime}>
        {time}
      </div>

      <div className={styles.round}>
        {match.Stage}
      </div>

      <div className={styles.category}>
        {match.category}
      </div>

      <div className={styles.team}>
        {
          getTeamName(
            match.Team1,
            1
          )
        }
      </div>

      <div className={styles.vs}>
        VS
      </div>

      <div className={styles.team}>
        {
          getTeamName(
            match.Team2,
            2
          )
        }
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

  const [grid, setGrid] =
    useState([]);

  const [events, setEvents] =
    useState([]);

  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState([]);
 

  const [selectedEventId, setSelectedEventId] = useState("");
  useEffect(() => {
  if (events.length > 0) {
    setSelectedEventId(events[0]._id);
  }
}, [events]);
  const [
    selectedRounds,
    setSelectedRounds,
  ] = useState([
    "Round 1",
    "Round 2",
  ]);

  const [
    courtCount,
    setCourtCount,
  ] = useState(4);

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [
    hideGrid,
    setHideGrid,
  ] = useState(false);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const [
    matchesPerCourt,
    setMatchesPerCourt,
  ] = useState({
    1: 4,
    2: 4,
    3: 4,
    4: 4,
  });

  const roundsList = [
    "Round 1",
    "Round 2",
    "Round 3",
    "Round 4",
    "Round 5",
    "Round 6",
  ];

  /* ================= LOAD EVENTS ================= */

  useEffect(() => {

    fetchEvents();

  }, []);

  /* ================= AUTO LOAD ================= */

  useEffect(() => {

    if (events.length > 0) {

      fetchData();

    }

  }, [events]);

  /* ================= FETCH EVENTS ================= */

  const fetchEvents = async () => {

    try {

      const res =
        await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
          {
            withCredentials: true,
          }
        );

      setEvents(
        res.data.data
      );

    } catch (err) {

      console.error(err);

    }

  };

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {
    console.log("selectedDate value =", selectedDate);
    console.log("Selected Date:", selectedDate);
    console.log("EVENT ID:", selectedEventId);


    try {

      const filteredEvents =
        selectedCategories.length > 0
          ? events.filter((ev) =>
              selectedCategories.includes(
                ev.name
              )
            )
          : events;

      const allResponses =
        await Promise.all(
        
          filteredEvents.map((ev) =>

            axios.get(
              `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
              {
                withCredentials: true,
              }
            )

          )

        );
        console.log("First match:", allResponses[0].data.data[0]); // 👈 HERE

      let allMatches = [];

      allResponses.forEach(
        (res, index) => {

          const ev =
            filteredEvents[index];

      const filteredMatches =
  res.data.data.filter((m) => {

    const isSelectedRound =
      selectedRounds.includes(
        m.Stage?.trim()
      );

    const isCompleted =
      m.Status === "Completed";

    return (
      isSelectedRound &&
      !isCompleted
    );

  });

          const matchesWithData =
            filteredMatches.map(
              (m, idx) => ({
                ...m,
                category: ev.name,
                matchNo: idx + 1,
              })
            );

          allMatches.push(
            ...matchesWithData
          );

        }
      );

      const roundOrder = {
        "Round 1": 1,
        "Round 2": 2,
        "Round 3": 3,
        "Round 4": 4,
        "Round 5": 5,
        "Round 6": 6,
      };

      allMatches.sort(
        (a, b) => {

          const roundDiff =
            (roundOrder[a.Stage] || 99)
            -
            (roundOrder[b.Stage] || 99);

          if (roundDiff !== 0) {
            return roundDiff;
          }

          return (
            (a.matchNo || 0)
            -
            (b.matchNo || 0)
          );

        }
      );

      buildGrid(allMatches);

      setShowFilters(false);

      setHideGrid(false);

    } catch (err) {

      console.error(err);

      toast.error(
        "Error loading matches"
      );

    }

  };

  /* ================= BUILD GRID ================= */

  const buildGrid = (matches) => {

    let temp = [];

    const maxRows = Math.max(
      ...Object.values(matchesPerCourt)
    );

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

    const timeSlotPlayers = {};

    matches.forEach((match) => {

      const players =
        getPlayers(match);

      let placed = false;

      for (let i = 0; i < maxRows; i++) {

        const time =
          getTimeLabel(i);

        if (!timeSlotPlayers[time]) {
          timeSlotPlayers[time] =
            new Set();
        }

        /* SAME TIME VALIDATION */

        const sameTimeConflict =
          players.some((p) =>
            timeSlotPlayers[time].has(p)
          );

        if (sameTimeConflict) {
          continue;
        }

        for (let j = 0; j < courtCount; j++) {

          const courtNo = j + 1;

          const allowedMatches =
            matchesPerCourt[courtNo] || 0;

          if (i >= allowedMatches) {
            continue;
          }

          if (temp[i][j].match) {
            continue;
          }

          /* CONSECUTIVE VALIDATION */

          let consecutiveConflict =
            false;

          if (i > 0) {

            for (
              let prevCourt = 0;
              prevCourt < courtCount;
              prevCourt++
            ) {

              const prevMatch =
                temp[i - 1][prevCourt]
                  .match;

              if (!prevMatch) continue;

              const prevPlayers =
                getPlayers(prevMatch);

              const samePlayer =
                players.some((p) =>
                  prevPlayers.includes(p)
                );

              if (
                samePlayer &&
                prevCourt !== j
              ) {

                consecutiveConflict = true;

                break;

              }

            }

          }

          if (consecutiveConflict) {
            continue;
          }

          /* PLACE MATCH */

          temp[i][j].match = match;

          players.forEach((p) =>
            timeSlotPlayers[time].add(p)
          );

          placed = true;

          break;

        }

        if (placed) {
          break;
        }

      }

    });

    setGrid(temp);

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

    setShowFilters(
      !showFilters
    );

    setHideGrid(
      !showFilters
    );

  };

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

            if (
              i === swapped.rowIndex &&
              j === swapped.court - 1
            ) {
              continue;
            }

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

            if (
              swapped.time ===
                cell.time &&
              swapped.court !==
                cell.court
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

      toast.success(
        "✅ Match swapped"
      );

    };

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
                          value={
                            matchesPerCourt[index + 1] || 1
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

            <div
              className={styles.header}
              style={{
                display: "grid",
                gridTemplateColumns:
                  `repeat(${courtCount},1fr)`,
                gap: "20px",
              }}
            >

              {
                Array.from({
                  length: courtCount,
                }).map((_, index) => (

                  <div key={index}>
                    COURT {index + 1}
                  </div>

                ))
              }

            </div>

            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >

              {
                grid.map((row, i) => (

                  <div
                    key={i}
                    className={styles.row}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        `repeat(${courtCount},1fr)`,
                      gap: "20px",
                    }}
                  >

                    {
                      row.map((cell, j) => (

                        <DroppableSlot
                          key={j}
                          id={`slot-${i}-${j}`}
                        >

                          {
                            cell?.match && (

                              <DraggableMatch
                                match={cell.match}
                                time={cell.time}
                              />

                            )
                          }

                        </DroppableSlot>

                      ))
                    }

                  </div>

                ))
              }

            </DndContext>

          </>

        )
      }

    </div>
  );
}
