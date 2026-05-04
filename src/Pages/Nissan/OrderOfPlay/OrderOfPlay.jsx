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
    match?.Team1?.partner1,
    match?.Team1?.partner2,
    match?.Team2?.partner1,
    match?.Team2?.partner2,
  ]
    .filter(Boolean)
    .map((p) => ({
      id: p._id || "",
      name: (p.name || "").toLowerCase().trim(),
    }));
};

const isSamePlayer = (a, b) =>
  (a.id && b.id && a.id === b.id) || (a.name && b.name && a.name === b.name);

/* ================= VALIDATION ================= */
const validateGrid = (grid) => {
  const all = grid.flat().filter(Boolean);

  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const m1 = all[i];
      const m2 = all[j];

      const p1 = getPlayers(m1);
      const p2 = getPlayers(m2);

      const samePlayer = p1.some((x) =>
        p2.some((y) => isSamePlayer(x, y))
      );

      if (!samePlayer) continue;

      // ❌ SAME TIME
      if (m1.MatchTime === m2.MatchTime) {
        return "Same player same time ❌";
      }

      // ❌ CONSECUTIVE
      const t1 = TIME_SLOTS.indexOf(m1.MatchTime);
      const t2 = TIME_SLOTS.indexOf(m2.MatchTime);

      if (Math.abs(t1 - t2) === 1) {
        if (m1.CourtNumber !== m2.CourtNumber) {
          return "Consecutive match must be same court ❌";
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
      <div className={styles.time}>{match.MatchTime}</div>
      <div className={styles.cat}>{match.category}</div>

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
    data: match, // 🔥 FIXED
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

        const withCat = round1.map((m) => ({
          ...m,
          category: ev.name,
        }));

        allMatches = [...allMatches, ...withCat];
      }

      console.log("TOTAL MATCHES:", allMatches.length);

      buildGrid(allMatches);

    } catch (err) {
      console.error(err);
      toast.error("Error loading data");
    }
  };

  const buildGrid = (matches) => {
    let index = 0;
    let temp = [];

    const rows = Math.ceil(matches.length / COURTS);

    for (let i = 0; i < rows; i++) {
      let row = [];

      for (let j = 0; j < COURTS; j++) {
        let match = matches[index];

        if (match) {
          match.MatchTime = TIME_SLOTS[i];
          match.CourtNumber = j + 1;
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

    console.log("ACTIVE:", source);
    console.log("OVER:", target);

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

      // swap
      const temp = copy[s[0]][s[1]];
      copy[s[0]][s[1]] = copy[t[0]][t[1]];
      copy[t[0]][t[1]] = temp;

      // update
      copy[s[0]][s[1]].MatchTime = TIME_SLOTS[s[0]];
      copy[s[0]][s[1]].CourtNumber = s[1] + 1;

      copy[t[0]][t[1]].MatchTime = TIME_SLOTS[t[0]];
      copy[t[0]][t[1]].CourtNumber = t[1] + 1;

      // validate AFTER swap
      const error = validateGrid(copy);

      if (error) {
        toast.error(error);
        return prev; // revert
      }

      toast.success("Moved ✅");
      return copy;
    });
  };

  return (
    <div className={styles.container}>
      <h1>ORDER OF PLAY</h1>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className={styles.header}>
          {[1,2,3,4].map(c => (
            <div key={c}>COURT {c}</div>
          ))}
        </div>

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