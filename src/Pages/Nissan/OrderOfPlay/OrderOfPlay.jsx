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

      for (let c = 0; c < COURTS; c++) {
        let match = matches[index];

        if (match) {
          match = {
            ...match,
            MatchTime: TIME_SLOTS[i], // FIXED
            CourtNumber: c + 1,
          };
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

    // ❌ same slot
    if (active.id === over.id) return;

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

      // swap ONLY
      const temp = copy[s[0]][s[1]];
      copy[s[0]][s[1]] = copy[t[0]][t[1]];
      copy[t[0]][t[1]] = temp;

      // keep time FIXED
      copy[s[0]][s[1]] = {
        ...copy[s[0]][s[1]],
        MatchTime: TIME_SLOTS[s[0]],
        CourtNumber: s[1] + 1,
      };

      copy[t[0]][t[1]] = {
        ...copy[t[0]][t[1]],
        MatchTime: TIME_SLOTS[t[0]],
        CourtNumber: t[1] + 1,
      };

      const error = validateGrid(copy);

      if (error) {
        toast.error(error);
        return prev;
      }

      return copy;
    });
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1>ORDER OF PLAY</h1>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className={styles.header}>
          {[1, 2, 3, 4].map((c) => (
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