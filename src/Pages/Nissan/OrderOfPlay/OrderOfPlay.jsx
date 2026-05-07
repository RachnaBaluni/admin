import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./ViewOrderOfPlay.module.css";
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

/* ================= DRAG CARD ================= */
function DraggableMatch({ match }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: match._id,
    data: {
      match,
    },
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
      <div className={styles.time}>{match.MatchTime}</div>

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
export default function ViewOrderOfPlay() {
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
        let match = matches[index];

        if (match) {
          match.MatchTime = TIME_SLOTS[i] || "";
          match.CourtNumber = j + 1;
        }

        row.push(match || null);
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

    const newGrid = [...grid];

    let activePos = null;
    let overPos = null;

    newGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell?._id === activeId) {
          activePos = { i, j };
        }

        if (`slot-${i}-${j}` === overId) {
          overPos = { i, j };
        }
      });
    });

    if (!activePos || !overPos) return;

    const draggedMatch =
      newGrid[activePos.i][activePos.j];

    const targetMatch =
      newGrid[overPos.i][overPos.j];

    /* SWAP */
    newGrid[overPos.i][overPos.j] = draggedMatch;
    newGrid[activePos.i][activePos.j] =
      targetMatch;

    /* UPDATE TIME + COURT */
    newGrid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          cell.MatchTime = TIME_SLOTS[rowIndex];
          cell.CourtNumber = colIndex + 1;
        }
      });
    });

    setGrid([...newGrid]);
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1>ORDER OF PLAY</h1>

      {/* HEADER */}
      <div className={styles.header}>
        {[1, 2, 3, 4].map((court) => (
          <div key={court}>COURT {court}</div>
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
                {cell ? (
                  <DraggableMatch match={cell} />
                ) : (
                  <div className={styles.empty}>—</div>
                )}
              </DroppableSlot>
            ))}
          </div>
        ))}
      </DndContext>
    </div>
  );
}