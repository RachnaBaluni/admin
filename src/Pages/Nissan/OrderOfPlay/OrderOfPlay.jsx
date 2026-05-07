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
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00",
  "12:45",
];

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

/* ================= VALIDATION ================= */
/* ================= VALIDATE GRID ================= */
const validateGrid = (grid) => {
  let allMatches = [];

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell?.match) {
        allMatches.push({
          ...cell.match,
          court: colIndex + 1,
          timeIndex: rowIndex,
        });
      }
    });
  });

  for (let i = 0; i < allMatches.length; i++) {
    for (let j = i + 1; j < allMatches.length; j++) {
      const m1 = allMatches[i];
      const m2 = allMatches[j];

      const p1 = getPlayers(m1);
      const p2 = getPlayers(m2);

      const samePlayer = p1.some((p) =>
        p2.includes(p)
      );

      /* NO SAME PLAYER */
      if (!samePlayer) continue;

      /* ================= SAME TIME ================= */
      if (m1.timeIndex === m2.timeIndex) {
        return "❌ Same player cannot play at same time";
      }

      /* ================= CONSECUTIVE ================= */
      const diff = Math.abs(
        m1.timeIndex - m2.timeIndex
      );

      /*
        ONLY consecutive:
        07:30 -> 08:15
        08:15 -> 09:00
      */
      if (diff === 1) {
        if (m1.court !== m2.court) {
          return "❌ Consecutive matches must be on same court";
        }
      }
    }
  }

  return null;
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
            ? " & " +
              team.partner2?.name
            : ""
        }`
      : "TBD";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={styles.card}
    >
      {/* FIXED TIME */}
      <div className={styles.fixedTime}>
        {time}
      </div>

      <div className={styles.category}>
        {match.category}
      </div>

      <div>{name(match.Team1)}</div>

      <div className={styles.vs}>
        VS
      </div>

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
          time: TIME_SLOTS[i] || "",
          court: j + 1,
        });

        index++;
      }

      temp.push(row);
    }

    setGrid(temp);
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

    if (!activePos || !overPos)
      return;

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

    /* SAVE OLD */
    const oldDraggedTeam1 =
      dragged.match.Team1;

    const oldDraggedTeam2 =
      dragged.match.Team2;

    const oldTargetTeam1 =
      target.match.Team1;

    const oldTargetTeam2 =
      target.match.Team2;

    /* TEMP SWAP */
    dragged.match.Team1 =
      oldTargetTeam1;

    dragged.match.Team2 =
      oldTargetTeam2;

    target.match.Team1 =
      oldDraggedTeam1;

    target.match.Team2 =
      oldDraggedTeam2;

    /* VALIDATE */
    const error =
      validateGrid(newGrid);

    /* INVALID => REVERT */
    if (error) {
      dragged.match.Team1 =
        oldDraggedTeam1;

      dragged.match.Team2 =
        oldDraggedTeam2;

      target.match.Team1 =
        oldTargetTeam1;

      target.match.Team2 =
        oldTargetTeam2;

      toast.error(error);
      return;
    }

    /* SUCCESS */
    setGrid(newGrid);
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1>ORDER OF PLAY</h1>

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
        collisionDetection={
          closestCenter
        }
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
                    time={cell.time}
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