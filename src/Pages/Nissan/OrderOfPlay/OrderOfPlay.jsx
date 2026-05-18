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

const TIME_SLOTS = [
  "07:30",
  "08:15",
  "09:00",
  "09:45",
  "10:30",
  "11:15",
];

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

  /* ================= TEAM NAME ================= */

  const name = (team, side) => {

    /* REAL PLAYERS */

    if (team?.partner1?.name) {

      return `${team.partner1?.name || ""}
        ${
          team.partner2
            ? " & " + team.partner2?.name
            : ""
        }`;

    }

    /* TBD WINNER */

    const roundNumber =
      Number(match.Stage?.replace("Round ", ""));

    if (!roundNumber || roundNumber === 1) {
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

      {/* TIME */}

      <div className={styles.fixedTime}>
        {time}
      </div>

      {/* ROUND */}

      <div className={styles.round}>
        {match.Stage}
      </div>

      {/* CATEGORY */}

      <div className={styles.category}>
        {match.category}
      </div>

      {/* TEAM 1 */}

      <div className={styles.team}>
        {name(match.Team1, 1)}
      </div>

      {/* VS */}

      <div className={styles.vs}>
        VS
      </div>

      {/* TEAM 2 */}

      <div className={styles.team}>
        {name(match.Team2, 2)}
      </div>

    </div>
  );
}

/* ================= DROP SLOT ================= */

function DroppableSlot({
  children,
  id,
}) {

  const { setNodeRef } = useDroppable({
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

  const [selectedCategories, setSelectedCategories] =
    useState([]);

  /* DEFAULT */

  const [selectedRounds, setSelectedRounds] =
    useState(["Round 1", "Round 2"]);

  const [courtCount, setCourtCount] =
    useState(4);

  const [matchesPerCourt, setMatchesPerCourt] =
    useState(2);

  const [showFilters, setShowFilters] =
    useState(false);

  /* 6 ROUNDS */

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

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        {
          withCredentials: true,
        }
      );

      setEvents(res.data.data);

    } catch (err) {

      console.error(err);

      toast.error("Error loading events");

    }
  };

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {

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
            {
              withCredentials: true,
            }
          )

        )

      );

      let allMatches = [];

      allResponses.forEach((res, index) => {

        const ev =
          filteredEvents[index];

        const matches =
          res.data.data.filter((d) =>
            selectedRounds.includes(d.Stage)
          );

        const withCategory =
          matches.map((m, idx) => ({
            ...m,
            category: ev.name,
            matchNo: idx + 1,
          }));

        allMatches = [
          ...allMatches,
          ...withCategory,
        ];

      });

      buildGrid(allMatches);

    } catch (err) {

      console.error(err);

      toast.error("Error loading");

    }
  };

  /* ================= BUILD GRID ================= */

  const buildGrid = (matches) => {

    const roundOrder = {
      "Round 1": 1,
      "Round 2": 2,
      "Round 3": 3,
      "Round 4": 4,
      "Round 5": 5,
      "Round 6": 6,
    };

    matches.sort(
      (a, b) =>
        (roundOrder[a.Stage] || 99) -
        (roundOrder[b.Stage] || 99)
    );

    let temp = [];

    let index = 0;

    const rows =
      matchesPerCourt;

    for (let i = 0; i < rows; i++) {

      let row = [];

      for (let j = 0; j < courtCount; j++) {

        if (index >= matches.length) {
          break;
        }

        const match =
          matches[index];

        row.push({
          match: match || null,
          time:
            TIME_SLOTS[i] ||
            `Followed By ${i}`,
          court: j + 1,
        });

        index++;

      }

      temp.push(row);

    }

    setGrid(temp);

  };

  /* ================= PRINT ================= */

  const handlePrint = () => {

    window.print();

  };

  /* ================= DRAG END ================= */

  const handleDragEnd = (event) => {

    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      return;
    }

    let activePos = null;
    let overPos = null;

    grid.forEach((row, i) => {

      row.forEach((cell, j) => {

        if (
          cell?.match?._id === activeId
        ) {

          activePos = { i, j };

        }

        if (
          `slot-${i}-${j}` === overId
        ) {

          overPos = { i, j };

        }

      });

    });

    if (!activePos || !overPos) {
      return;
    }

    const newGrid = JSON.parse(
      JSON.stringify(grid)
    );

    const dragged =
      newGrid[activePos.i][activePos.j];

    const target =
      newGrid[overPos.i][overPos.j];

    if (
      !dragged?.match ||
      !target?.match
    ) {
      return;
    }

    /* TEMP SWAP */

    const tempMatch =
      dragged.match;

    dragged.match =
      target.match;

    target.match =
      tempMatch;

    /* ================= VALIDATION ================= */

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

      for (let i = 0; i < newGrid.length; i++) {

        for (let j = 0; j < newGrid[i].length; j++) {

          const cell =
            newGrid[i][j];

          if (!cell?.match) continue;

          /* SKIP SAME CELL */

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

          if (!samePlayer) continue;

          /* SAME TIME */

          if (
            swapped.time === cell.time &&
            swapped.court !== cell.court
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
            swapped.court !== cell.court
          ) {

            toast.error(
              "❌ Consecutive matches must be on same court"
            );

            return;
          }
        }
      }
    }

    /* SUCCESS */

    setGrid(newGrid);

    toast.success(
      "✅ Match swapped"
    );

  };

  /* ================= UI ================= */

  return (

    <div className={styles.container}>

      {/* ================= TOP BAR ================= */}

      <div className={styles.topBar}>

        <div>

          <h1>ORDER OF PLAY</h1>

          <p className={styles.selectedRoundText}>
            Showing :
            {" "}
            {selectedRounds.join(" + ")}
          </p>

        </div>

        <div className={styles.buttonGroup}>

          {/* CHANGE */}

          <button
            className={styles.resetBtn}
            onClick={() =>
              setShowFilters(!showFilters)
            }
          >
            Change Rounds
          </button>

          {/* GENERATE */}

          <button
            className={styles.generateBtn}
            onClick={fetchData}
          >
            Generate Again
          </button>

          {/* PRINT */}

          <button
            className={styles.printBtn}
            onClick={handlePrint}
          >
            Print PDF
          </button>

        </div>

      </div>

      {/* ================= FILTERS ================= */}

      {
        showFilters && (

          <div className={styles.filterBox}>

            {/* ROUNDS */}

            <div className={styles.roundSelector}>

              <h3>
                Select Consecutive Rounds
              </h3>

              <div className={styles.roundButtons}>

                {roundsList.map(
                  (round, index) => {

                    const nextRound =
                      roundsList[index + 1];

                    if (!nextRound) return null;

                    const isActive =
                      selectedRounds.includes(round) &&
                      selectedRounds.includes(nextRound);

                    return (

                      <button
                        key={round}
                        type="button"
                        className={
                          isActive
                            ? styles.activeRoundBtn
                            : styles.roundBtn
                        }
                        onClick={() => {

                          setSelectedRounds([
                            round,
                            nextRound,
                          ]);

                        }}
                      >

                        {round}
                        {" + "}
                        {nextRound}

                      </button>

                    );
                  }
                )}

              </div>

            </div>

            {/* COURTS */}

            <div>

              <h3>
                Number Of Courts
              </h3>

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

            {/* MATCH LIMIT */}

            <div className={styles.courtLimitBox}>

              <h3>
                Matches Per Court
              </h3>

              <p className={styles.limitText}>
                Enter how many matches each court can handle
              </p>

              <input
                type="number"
                min="1"
                value={matchesPerCourt}
                onChange={(e) =>
                  setMatchesPerCourt(
                    Number(e.target.value)
                  )
                }
                className={styles.courtInput}
              />

            </div>

            {/* APPLY */}

            <button
              className={styles.generateBtn}
              onClick={() => {

                fetchData();

                setShowFilters(false);

              }}
            >
              Apply Changes
            </button>

          </div>

        )
      }

      {/* ================= GRID ================= */}

      <>
        {/* HEADER */}

        <div
          className={styles.header}
          style={{
            gridTemplateColumns:
              `repeat(${courtCount}, 1fr)`,
          }}
        >

          {Array.from({
            length: courtCount,
          }).map((_, index) => (

            <div key={index}>
              COURT {index + 1}
            </div>

          ))}

        </div>

        {/* MATCHES */}

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >

          {grid.map((row, i) => (

            <div
              key={i}
              className={styles.row}
              style={{
                gridTemplateColumns:
                  `repeat(${courtCount}, 1fr)`,
              }}
            >

              {row.map((cell, j) => (

                <DroppableSlot
                  key={j}
                  id={`slot-${i}-${j}`}
                >

                  {cell?.match && (

                    <DraggableMatch
                      match={cell.match}
                      time={
                        cell.time.includes("Followed")
                          ? "Followed By"
                          : cell.time
                      }
                    />

                  )}

                </DroppableSlot>

              ))}

            </div>

          ))}

        </DndContext>

      </>

    </div>
  );
}