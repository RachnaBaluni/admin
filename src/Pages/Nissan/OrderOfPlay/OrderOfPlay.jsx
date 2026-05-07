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

/* ================= VALIDATION ================= */
const validateGrid = (grid) => {
  let matches = [];

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) {
        matches.push({
          ...cell,
          row: rowIndex,
          court: colIndex + 1,
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

      /* SAME TIME */
      if (m1.MatchTime === m2.MatchTime) {
        if (m1.CourtNumber !== m2.CourtNumber) {
          return "❌ Same player cannot play on different courts at same time";
        }
      }

      /* CONSECUTIVE */
      const t1 = m1.MatchTime;
      const t2 = m2.MatchTime;

      if (Math.abs(t1.localeCompare(t2)) === 1) {
        if (m1.CourtNumber !== m2.CourtNumber) {
          return "❌ Consecutive matches must be on same court";
        }
      }
    }
  }

  return null;
};

/* ================= DRAG CARD ================= */
function DraggableMatch({ match }) {
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
      <div className={styles.time}>
        {match.MatchTime}
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
            ...match,
            CourtNumber: j + 1,
          });
        }

        index++;
      }

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

    /* SWAP ONLY MATCH */
    newGrid[overPos.i][overPos.j] = draggedMatch;
    newGrid[activePos.i][activePos.j] = targetMatch;

    /* ONLY UPDATE COURT */
    newGrid.forEach((row) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          cell.CourtNumber = colIndex + 1;
        }
      });
    });

    /* VALIDATION */
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
                {cell && (
                  <DraggableMatch match={cell} />
                )}
              </DroppableSlot>
            ))}
          </div>
        ))}
      </DndContext>
    </div>
  );
}