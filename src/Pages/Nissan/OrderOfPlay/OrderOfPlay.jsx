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
    match?.Team1?.partner1?.name,
    match?.Team1?.partner2?.name,
    match?.Team2?.partner1?.name,
    match?.Team2?.partner2?.name,
  ]
    .filter(Boolean)
    .map((n) => n.toLowerCase().trim());
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

      const samePlayer = p1.some((n) => p2.includes(n));
      if (!samePlayer) continue;

      // ❌ SAME TIME + DIFFERENT CATEGORY
      if (
        m1.MatchTime === m2.MatchTime &&
        m1.category !== m2.category
      ) {
        return "⚠️ Same player different category same time";
      }

      // ❌ CONSECUTIVE + DIFFERENT COURT
      const t1 = TIME_SLOTS.indexOf(m1.MatchTime);
      const t2 = TIME_SLOTS.indexOf(m2.MatchTime);

      if (Math.abs(t1 - t2) === 1) {
        if (m1.CourtNumber !== m2.CourtNumber) {
          return "⚠️ Consecutive matches must be same court";
        }
      }
    }
  }

  return null;
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
      <div className={styles.timeTop}>{match.MatchTime}</div>
      <div className={styles.category}>{match.category}</div>

      <div>{name(match.Team1)}</div>
      <div className={styles.vs}>VS</div>
      <div>{name(match.Team2)}</div>
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

      console.log("TOTAL MATCHES:", allMatches.length);

      // 🔀 MIX CATEGORY
      let grouped = {};
      allMatches.forEach((m) => {
        if (!grouped[m.category]) grouped[m.category] = [];
        grouped[m.category].push(m);
      });

      let mixed = [];
      let max = Math.max(...Object.values(grouped).map((a) => a.length));

      for (let i = 0; i < max; i++) {
        Object.keys(grouped).forEach((cat) => {
          if (grouped[cat][i]) mixed.push(grouped[cat][i]);
        });
      }

      buildGrid(mixed);
    } catch (err) {
      console.error(err);
      toast.error("Error loading data");
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

    setGrid((prev) => {
      const copy = prev.map((r) => [...r]);

      let s, t;

      copy.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell?._id === source._id) s = [i, j];
          if (cell?._id === target._id) t = [i, j];
        });
      });

      if (!s || !t) return prev;

      // 🔄 swap
      const temp = copy[s[0]][s[1]];
      copy[s[0]][s[1]] = copy[t[0]][t[1]];
      copy[t[0]][t[1]] = temp;

      // update time + court
      copy[s[0]][s[1]].MatchTime = TIME_SLOTS[s[0]];
      copy[t[0]][t[1]].MatchTime = TIME_SLOTS[t[0]];

      copy[s[0]][s[1]].CourtNumber = s[1] + 1;
      copy[t[0]][t[1]].CourtNumber = t[1] + 1;

      // ✅ VALIDATE
      const error = validateGrid(copy);

      if (error) {
        toast.error(error);
        return prev; // ❌ revert
      }

      toast.success("Moved ✅");
      return copy;
    });
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1>ORDER OF PLAY</h1>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        {/* HEADER */}
        <div className={styles.header}>
          {[1, 2, 3, 4].map((c) => (
            <div key={c}>COURT {c}</div>
          ))}
        </div>

        {/* GRID */}
        {grid.map((row, i) => (
          <div key={i} className={styles.row}>
            {row.map((cell, j) => (
              <Slot key={j} id={`${i}-${j}`} match={cell} />
            ))}
          </div>
        ))}
      </DndContext>
    </div>
  );
}