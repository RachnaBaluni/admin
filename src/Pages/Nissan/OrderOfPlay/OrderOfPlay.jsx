import React, { useEffect, useState } from "react";
import api from "../../../api";
import styles from "./OrderOfPlay.module.css";
import { toast } from "sonner";
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";

/* ================= TIME ================= */
const TIME_SLOTS = [
  "07:30","08:15","09:00","09:45",
  "10:30","11:15","12:00","12:45",
  "01:30","02:15","03:00","03:45"
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

/* ================= CONFLICT ================= */
const hasConflict = (match, time, allMatches) => {
  const players = getPlayers(match);

  return allMatches.some((m) => {
    if (m._id === match._id) return false;
    if (m.MatchTime !== time) return false;

    const other = getPlayers(m);
    return players.some((p) => other.includes(p));
  });
};

/* ================= CARD ================= */
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
      <div className={styles.category}>{match.category}</div>

      <div>{name(match.Team1)}</div>
      <div className={styles.vs}>VS</div>
      <div>{name(match.Team2)}</div>

      <div className={styles.time}>{match.MatchTime}</div>
    </div>
  );
};

/* ================= SLOT ================= */
const Slot = ({ id, match }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: match,
  });

  const { setNodeRef: dropRef } = useDroppable({
    id,
    data: match,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : {};

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        dropRef(node);
      }}
      style={style}
      className={styles.slot}
      {...listeners}
      {...attributes}
    >
      <MatchCard match={match} />
    </div>
  );
};

/* ================= MAIN ================= */
export default function OrderOfPlay() {
  const [draws, setDraws] = useState([]);
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

      setDraws(allMatches);
      buildGrid(allMatches);
    } catch (err) {
      console.error(err);
      toast.error("Error loading draws");
    }
  };

  /* ================= GRID ================= */
  const buildGrid = (matches) => {
    let index = 0;
    let temp = [];

    const totalRows = Math.ceil(matches.length / COURTS);

    for (let i = 0; i < totalRows; i++) {
      let row = [];

      for (let c = 1; c <= COURTS; c++) {
        let match = matches[index];

        if (match) {
          match.MatchTime = TIME_SLOTS[i] || `Slot ${i + 1}`;
          match.CourtNumber = c;
        }

        row.push(match || null);
        index++;
      }

      temp.push(row);
    }

    setGrid(temp);
  };

  /* ================= DRAG ================= */
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const source = active.data.current;
    const target = over.data.current;

    if (!source || !target) return;

    if (hasConflict(source, target.MatchTime, draws)) {
      toast.error("Player already playing at same time ❌");
      return;
    }

    setGrid((prev) => {
      const copy = prev.map((r) => [...r]);

      let s, t;

      copy.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell?._id === source._id) s = [i, j];
          if (cell?._id === target._id) t = [i, j];
        });
      });

      if (s && t) {
        const temp = copy[s[0]][s[1]];
        copy[s[0]][s[1]] = copy[t[0]][t[1]];
        copy[t[0]][t[1]] = temp;

        copy[s[0]][s[1]].MatchTime = TIME_SLOTS[s[0]];
        copy[t[0]][t[1]].MatchTime = TIME_SLOTS[t[0]];
      }

      return copy;
    });

    toast.success("Match moved ✅");
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1>ORDER OF PLAY</h1>
      <h3>DATE: Tournament Day</h3>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        {/* HEADER */}
        <div className={styles.header}>
          <div>TIME</div>
          {[1, 2, 3, 4].map((c) => (
            <div key={c}>COURT {c}</div>
          ))}
        </div>

        {/* GRID */}
        {grid.map((row, i) => (
          <div key={i} className={styles.row}>
            <div className={styles.timeCol}>
              {TIME_SLOTS[i] || `Slot ${i + 1}`}
            </div>

            {row.map((cell, j) => (
              <Slot key={j} id={`${i}-${j}`} match={cell} />
            ))}
          </div>
        ))}
      </DndContext>
    </div>
  );
}