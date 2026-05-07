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
const validateGrid = (grid) => {
  let matches = [];

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell?.match) {
        matches.push({
          ...cell.match,
          row: rowIndex,
          court: colIndex + 1,
          time: cell.time,
        });
      }
    });
  });

  for (let i = 0; i < matches.length; i++) {
    for (let j = i + 1; j < matches.length; j++) {
      const m1 = matches[i];
      const m2 = matches[j];

      const p1 = getPlayers(m1);
      const p2 = getPlayers(m2);

      const samePlayer = p1.some(
        (p) => p && p2.includes(p)
      );

      if (!samePlayer) continue;

      /* SAME TIME VALIDATION */
      if (m1.time === m2.time) {
        if (m1.court !== m2.court) {
          return "❌ Same player cannot play on different courts at same time";
        }
      }
    }
  }

  return null;
};

/* ================= DRAG CARD ================= */
function DraggableMatch({ match, time }) {
  const { attributes, listeners, setNodeRef, transform } =
    useDraggable({
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
          team.partner2 ? " & " + team.partner2?.name : ""
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
      <div className={styles.time}>
        {time}
      </div>

      <div className={styles.category}>
        {match.category}
      </div>

      <div>{name(match.Team1)}</div>

      <div className={styles.vs}>VS</div>

      <div>{name(match.Team2)}</div>
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
  const [grid, setGrid] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
      const eventsRes = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        { withCredentials: true }
      );

      let allMatches = [];

      for (let ev of eventsRes.data.data) {
        const res = await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
          { withCredentials: true }
        );

        /* ONLY ROUND 1 */
        const matches = res.data.data.filter(
          (d) => d.Stage === "Round 1"
        );

        const withCategory = matches.map((m) => ({
          ...m,
          category: ev.name,
        }));

        allMatches = [...allMatches, ...withCategory];
      }

      buildGrid(allMatches);

    } catch (err) {
      console.error(err);
      toast.error("Error loading");
    }
  };

  /* ================= GRID ================= */
  const buildGrid = (matches) => {
    let temp = [];
    let index = 0;

    const rows = Math.ceil(matches.length / COURTS);

    for (let i = 0; i < rows; i++) {
      let row = [];

      for (let j = 0; j < COURTS; j++) {
        const match = matches[index];

        if (match) {
          row.push({
            match,
            time: TIME_SLOTS[i] || "",
            court: j + 1,
          });
        }

        index++;
      }

      /* REMOVE EMPTY ROW */
      if (row.length > 0) {
        temp.push(row);
      }
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

    const newGrid = [...grid];

    let activePos = null;
    let overPos = null;

    newGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell?.match?._id === activeId) {
          activePos = { i, j };
        }

        if (`slot-${i}-${j}` === overId) {
          overPos = { i, j };
        }
      });
    });

    if (!activePos || !overPos) return;

    const dragged =
      newGrid[activePos.i][activePos.j];

    const target =
      newGrid[overPos.i][overPos.j];

    if (!dragged || !target) return;

    /* ================= ONLY SWAP TEAMS ================= */

    const draggedTeams = {
      Team1: dragged.match.Team1,
      Team2: dragged.match.Team2,
    };

    dragged.match.Team1 = target.match.Team1;
    dragged.match.Team2 = target.match.Team2;

    target.match.Team1 = draggedTeams.Team1;
    target.match.Team2 = draggedTeams.Team2;

    /* TIME FIXED */
    /* COURT FIXED */
    /* CATEGORY FIXED */

    const error = validateGrid(newGrid);

    if (error) {
      toast.error(error);
      return;
    }

    setGrid([...newGrid]);
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1>ORDER OF PLAY</h1>

      {/* HEADER */}
      <div className={styles.header}>
        {[1, 2, 3, 4].map((court) => (
          <div key={court}>
            COURT {court}
          </div>
        ))}
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {grid.map((row, i) => (
          <div key={i} className={styles.row}>
            {row.map((cell, j) => (
              <DroppableSlot
                key={j}
                id={`slot-${i}-${j}`}
              >
                {cell && (
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