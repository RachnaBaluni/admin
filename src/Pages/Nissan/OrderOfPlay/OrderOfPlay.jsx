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

/* ================= TIME SLOTS ================= */
const TIME_SLOTS = [
  "07:30",
  "08:15",
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00",
];

/* ================= GET PLAYERS ================= */
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
    <div className={styles.matchCard}>
      <div className={styles.category}>{match.category || "Match"}</div>

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
export default function OrderOfPlay({eventId}) {
  console.log("EVENT ID:", eventId);
  const [draws, setDraws] = useState([]);
  const [grid, setGrid] = useState([]);

  /* ================= FETCH ================= */
  useEffect(() => {
  if (!eventId) return;
  fetchData();
}, [eventId]);
  const fetchData = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${eventId}`,
        { withCredentials: true }
      );

      const round1 = res.data.data.filter(
        (d) => d.Stage === "Round 1"
      );

      buildGrid(round1);
      setDraws(round1);
    } catch (err) {
      console.error(err);
      toast.error("Error loading draws");
    }
  };

  /* ================= BUILD GRID ================= */
  const buildGrid = (matches) => {
    let index = 0;
    let temp = [];

    for (let i = 0; i < TIME_SLOTS.length; i++) {
      let row = [];

      for (let c = 1; c <= 4; c++) {
        let match = matches[index];

        if (match) {
          match.MatchTime = TIME_SLOTS[i];
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

    // ❌ conflict check
    if (hasConflict(source, target.MatchTime, draws)) {
      toast.error("Same player already playing at this time ❌");
      return;
    }

    // ✅ swap
    setGrid((prev) => {
      const copy = prev.map((row) => [...row]);

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

        // update time + court
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
      <h3>DATE: 21 DEC, 2025</h3>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        {/* HEADER */}
        <div className={styles.header}>
          <div></div>
          <div>COURT 1</div>
          <div>COURT 2</div>
          <div>COURT 3</div>
          <div>COURT 4</div>
        </div>

        {/* BODY */}
        {grid.map((row, i) => (
          <div key={i} className={styles.row}>
            <div className={styles.timeCol}>{TIME_SLOTS[i]}</div>

            {row.map((cell, j) => (
              <Slot key={j} id={`${i}-${j}`} match={cell} />
            ))}
          </div>
        ))}
      </DndContext>
    </div>
  );
}