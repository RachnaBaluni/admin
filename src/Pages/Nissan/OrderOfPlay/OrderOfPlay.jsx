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

/* ================= TIME INDEX ================= */
const getTimeIndex = (time) => {
  return TIME_SLOTS.indexOf(time);
};

/* ================= VALIDATION ================= */
const validateGrid = (grid) => {
  let playerMatches = {};

  /* ALL MATCHES */
  grid.forEach((row) => {
    row.forEach((match) => {
      if (!match) return;

      const players = getPlayers(match);

      players.forEach((player) => {
        if (!player) return;

        if (!playerMatches[player]) {
          playerMatches[player] = [];
        }

        playerMatches[player].push({
          time: match.MatchTime,
          court: match.CourtNumber,
        });
      });
    });
  });

  /* VALIDATION */
  for (let player in playerMatches) {
    const matches = playerMatches[player];

    /* SORT BY TIME */
    matches.sort(
      (a, b) =>
        getTimeIndex(a.time) -
        getTimeIndex(b.time)
    );

    for (let i = 0; i < matches.length - 1; i++) {
      const current = matches[i];
      const next = matches[i + 1];

      const diff =
        getTimeIndex(next.time) -
        getTimeIndex(current.time);

      /* SAME TIME */
      if (
        diff === 0 &&
        current.court !== next.court
      ) {
        return "❌ Same player cannot play on different courts at same time";
      }

      /* CONSECUTIVE */
      if (
        diff === 1 &&
        current.court !== next.court
      ) {
        return "❌ Consecutive matches must be on same court";
      }
    }
  }

  return null;
};

/* ================= DRAG CARD ================= */
function DraggableMatch({ match }) {
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
      : "TBD";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={styles.card}
    >
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
function DroppableSlot({
  children,
  id,
  time,
}) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={styles.slot}
    >
      {/* FIXED TIME */}
      <div className={styles.fixedTime}>
        {time}
      </div>

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

        const matches = res.data.data.filter(
          (d) => d.Stage === "Round 1"
        );

        const withCategory = matches.map(
          (m) => ({
            ...m,
            category: ev.name,
          })
        );

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
        let match = matches[index];

        if (match) {
          row.push({
            ...match,
            MatchTime:
              TIME_SLOTS[i] || "",
            CourtNumber: j + 1,
          });
        } else {
          row.push(null);
        }

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

    const newGrid = grid.map((row) => [...row]);

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

    const dragged =
      newGrid[activePos.i][activePos.j];

    const target =
      newGrid[overPos.i][overPos.j];

    /* SWAP */
    newGrid[overPos.i][overPos.j] = dragged
      ? {
          ...dragged,
          MatchTime:
            TIME_SLOTS[overPos.i],
          CourtNumber: overPos.j + 1,
        }
      : null;

    newGrid[activePos.i][activePos.j] = target
      ? {
          ...target,
          MatchTime:
            TIME_SLOTS[activePos.i],
          CourtNumber:
            activePos.j + 1,
        }
      : null;

    /* VALIDATION */
    const error = validateGrid(newGrid);

    if (error) {
      toast.error(error);

      /* CANCEL SWAP */
      return;
    }

    setGrid(newGrid);
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
          <div
            key={i}
            className={styles.row}
          >
            {row.map((cell, j) => (
              <DroppableSlot
                key={j}
                id={`slot-${i}-${j}`}
                time={TIME_SLOTS[i]}
              >
                {cell && (
                  <DraggableMatch
                    match={cell}
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