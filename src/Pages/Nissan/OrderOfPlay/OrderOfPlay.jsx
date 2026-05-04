import React, { useEffect, useState } from "react";
import api from "../../../api";
import styles from "./OrderOfPlay.module.css";
import { toast } from "sonner";

import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

/* ================= TIME ================= */
const TIME_SLOTS = [
  "07:30","08:15","09:00","09:45",
  "10:30","11:15","12:00","12:45"
];

const COURTS = 4;

/* ================= PLAYERS ================= */
const getPlayers = (match) => {
  return [
    match?.Team1?.partner1?._id,
    match?.Team1?.partner2?._id,
    match?.Team2?.partner1?._id,
    match?.Team2?.partner2?._id,
  ].filter(Boolean);
};

/* ================= VALIDATION ================= */
const validateGrid = (grid) => {
  const all = grid.flat().filter(Boolean);

  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const m1 = all[i];
      const m2 = all[j];

      const p1 = getPlayers(m1);
      const p2 = getPlayers(m2);

      const samePlayer = p1.some((p) => p2.includes(p));
      if (!samePlayer) continue;

      // ❌ same time diff court
      if (
        m1.MatchTime === m2.MatchTime &&
        m1.CourtNumber !== m2.CourtNumber
      ) {
        return "❌ Same player cannot play on 2 courts at same time";
      }

      // ❌ consecutive diff court
      const t1 = TIME_SLOTS.indexOf(m1.MatchTime);
      const t2 = TIME_SLOTS.indexOf(m2.MatchTime);

      if (Math.abs(t1 - t2) === 1) {
        if (m1.CourtNumber !== m2.CourtNumber) {
          return "❌ Consecutive matches must be on same court";
        }
      }
    }
  }

  return null;
};

/* ================= MATCH CARD ================= */
const MatchCard = ({ match }) => {
  if (!match) return <div className={styles.empty}>—</div>;

  const name = (t) =>
    t
      ? `${t.partner1?.name || ""}${
          t.partner2 ? " & " + t.partner2?.name : ""
        }`
      : "TBD";

  return (
    <div className={styles.card}>
      <div className={styles.time}>{match.MatchTime}</div>
      <div className={styles.category}>{match.category}</div>

      <div>{name(match.Team1)}</div>
      <div className={styles.vs}>VS</div>
      <div>{name(match.Team2)}</div>
    </div>
  );
};

/* ================= SLOT ================= */
const Slot = ({ id, match }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.slot}
      {...attributes}
      {...listeners}
    >
      <MatchCard match={match} />
    </div>
  );
};

/* ================= MAIN ================= */
export default function OrderOfPlay() {
  const [grid, setGrid] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
      const eventsRes = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        { withCredentials: true }
      );

      let allMatches = [];

      for (let ev of eventsRes.data.data) {
        const res = await api.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
          { withCredentials: true }
        );

        const round1 = res.data.data.filter(
          (d) => d.Stage === "Round 1"
        );

        const withCategory = round1.map((m) => ({
          ...m,
          category: ev.name,
        }));

        allMatches = [...allMatches, ...withCategory];
      }

      buildGrid(allMatches);
    } catch (err) {
      console.error(err);
      toast.error("Error loading data");
    }
  };

  /* ================= GRID ================= */
  const buildGrid = (matches) => {
    let temp = [];
    let index = 0;

    const totalRows = Math.ceil(matches.length / COURTS);

    for (let i = 0; i < totalRows; i++) {
      let row = [];

      for (let j = 0; j < COURTS; j++) {
        let match = matches[index];

        if (match) {
          match = {
            ...match,
            MatchTime: TIME_SLOTS[i],
            CourtNumber: j + 1,
          };
        }

        row.push(match || null);
        index++;
      }

      temp.push(row);
    }

    setGrid(temp);
  };

  /* ================= FLATTEN ================= */
  const flattenGrid = (grid) => {
    return grid.flat().map((item, index) => ({
      ...item,
      uniqueId: item?._id || `empty-${index}`
    }));
  };

  /* ================= DRAG ================= */
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    if (active.id === over.id) return;

    setGrid((prev) => {
      const flat = flattenGrid(prev);

      const oldIndex = flat.findIndex(i => i.uniqueId === active.id);
      const newIndex = flat.findIndex(i => i.uniqueId === over.id);

      if (oldIndex === -1 || newIndex === -1) return prev;

      const newFlat = arrayMove(flat, oldIndex, newIndex);

      let newGrid = [];
      let index = 0;

      for (let i = 0; i < prev.length; i++) {
        let row = [];

        for (let j = 0; j < COURTS; j++) {
          const item = newFlat[index];

          if (item && item._id) {
            row.push({
              ...item,
              MatchTime: TIME_SLOTS[i],
              CourtNumber: j + 1,
            });
          } else {
            row.push(null);
          }

          index++;
        }

        newGrid.push(row);
      }

      const error = validateGrid(newGrid);

      if (error) {
        toast.error(error);
        return prev;
      }

      return newGrid;
    });
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1>ORDER OF PLAY</h1>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <SortableContext
          items={flattenGrid(grid).map(i => i.uniqueId)}
          strategy={rectSortingStrategy}
        >
          <div className={styles.header}>
            {[1,2,3,4].map(c => <div key={c}>COURT {c}</div>)}
          </div>

          {grid.map((row, i) => (
            <div key={i} className={styles.row}>
              {row.map((cell, j) => (
                <Slot
                  key={`${i}-${j}`}
                  id={cell?._id || `empty-${i}-${j}`}
                  match={cell}
                />
              ))}
            </div>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}