import React, { useEffect, useState } from "react";
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
];

/* ================= COURTS ================= */
const COURTS = 4;

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

  const name = (team) =>
    team
      ? `${team.partner1?.name || ""}${
          team.partner2
            ? " & " + team.partner2?.name
            : ""
        }`
      : "BYE";

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

      {/* CATEGORY */}
      <div className={styles.category}>
        {match.category}
      </div>

      {/* TEAM 1 */}
      <div>{name(match.Team1)}</div>

      {/* VS */}
      <div className={styles.vs}>
        VS
      </div>

      {/* TEAM 2 */}
      <div>{name(match.Team2)}</div>

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

  const [grid, setGrid] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= FETCH ================= */
  const fetchData = async () => {

    try {

      const eventsRes = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        {
          withCredentials: true,
        }
      );

      let allMatches = [];

      for (let ev of eventsRes.data.data) {

        const res = await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
          {
            withCredentials: true,
          }
        );

        const matches =
          res.data.data.filter(
            (d) =>
              d.Stage === "Round 1"
          );

        const withCategory =
          matches.map((m) => ({
            ...m,
            category: ev.name,
          }));

        allMatches = [
          ...allMatches,
          ...withCategory,
        ];
      }

      buildGrid(allMatches);

    } catch (err) {

      console.error(err);

      toast.error("Error loading");
    }
  };

  /* ================= BUILD GRID ================= */
  const buildGrid = (matches) => {

    let temp = [];
    let index = 0;

    const rows = Math.ceil(
      matches.length / COURTS
    );

    for (let i = 0; i < rows; i++) {

      let row = [];

      for (let j = 0; j < COURTS; j++) {

        const match = matches[index];

        row.push({
          match: match || null,
          time: TIME_SLOTS[i] || `Followed By ${i - 1}`,
          court: j + 1,
        });

        index++;
      }

      temp.push(row);
    }

    setGrid(temp);
  };

  /* ================= RESET ================= */
  const handleReset = () => {

    setGrid([]);

    toast.success(
      "✅ Order Of Play Reset Successfully"
    );
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

    if (activeId === overId) return;

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

    /* SAME SLOT */
    if (
      activePos.i === overPos.i &&
      activePos.j === overPos.j
    ) {
      return;
    }

    /* COPY GRID */
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
    const temp = dragged.match;

    dragged.match = target.match;

    target.match = temp;

    /* VALIDATION */
    const swappedMatches = [
      {
        match: dragged.match,
        time: dragged.time,
        court: dragged.court,
        timeIndex: activePos.i,
      },
      {
        match: target.match,
        time: target.time,
        court: target.court,
        timeIndex: overPos.i,
      },
    ];

    for (const swapped of swappedMatches) {

      const swappedPlayers =
        getPlayers(swapped.match);

      for (let i = 0; i < newGrid.length; i++) {

        for (let j = 0; j < newGrid[i].length; j++) {

          const cell = newGrid[i][j];

          if (!cell?.match) continue;

          /* SKIP SAME CELL */
          if (
            i === swapped.timeIndex &&
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
          const diff = Math.abs(
            swapped.timeIndex - i
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
      "✅ Match swapped successfully"
    );
  };

  /* ================= UI ================= */
  return (
    <div
      className={styles.container}
      id="print-section"
    >

      {/* TOP BAR */}
      <div className={styles.topBar}>

        <h1>ORDER OF PLAY</h1>

        <div className={styles.buttonGroup}>

          {/* RESET */}
          <button
            className={styles.resetBtn}
            onClick={handleReset}
          >
            Reset Order
          </button>

          {/* GENERATE AGAIN */}
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

      {/* HEADER */}
      <div className={styles.header}>

        {[1, 2, 3, 4].map(
          (court) => (
            <div key={court}>
              COURT {court}
            </div>
          )
        )}

      </div>

      {/* GRID */}
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >

        {grid.map((row, i) => (

          <div
            key={i}
            className={styles.row}
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

    </div>
  );
}