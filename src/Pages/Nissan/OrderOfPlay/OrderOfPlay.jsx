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

  grid.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell) {
        matches.push({
          ...cell,
          court: j + 1,
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

      const samePlayer = p1.some(p => p2.includes(p));
      if (!samePlayer) continue;

      // ✅ SAME TIME
      if (m1.MatchTime === m2.MatchTime && m1.court !== m2.court) {
        return "❌ Same player same time different court";
      }

      // ✅ CONSECUTIVE (correct logic)
      const t1 = TIME_SLOTS.indexOf(m1.MatchTime);
      const t2 = TIME_SLOTS.indexOf(m2.MatchTime);

      if (Math.abs(t1 - t2) === 1) {
        if (m1.court !== m2.court) {
          return "❌ Consecutive matches must be on same court";
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
      <div className={styles.category}>{match.category}</div>

      <div>{name(match.Team1)}</div>
      <div className={styles.vs}>VS</div>
      <div>{name(match.Team2)}</div>
    </div>
  );
};

/* ================= SLOT ================= */
const Slot = ({ match }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: match?._id,
  });

  const { setNodeRef: dropRef } = useDroppable({
    id: match?._id,
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

        const matches = res.data.data.filter(
          (d) => d.Stage === "Round 1"
        );

        const withCat = matches.map(m => ({
          ...m,
          category: ev.name
        }));

        allMatches = [...allMatches, ...withCat];
      }

      buildGrid(allMatches);

    } catch (err) {
      console.error(err);
      toast.error("Error loading");
    }
  };

  /* ================= GRID ================= */
  const buildGrid = (matches) => {
    let index = 0;
    let temp = [];

    const rows = Math.ceil(matches.length / COURTS);

    for (let i = 0; i < rows; i++) {
      let row = [];

      for (let j = 0; j < COURTS; j++) {
        let m = matches[index];

        if (m) {
          m.MatchTime = TIME_SLOTS[i];
          m.CourtNumber = j + 1;
        }

        row.push(m || null);
        index++;
      }

      temp.push(row);
    }

    setGrid(temp);
  };

  /* ================= DRAG ================= */
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setGrid((prev) => {
      const copy = prev.map((r) => [...r]);

      let s, t;

      copy.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell?._id === active.id) s = [i, j];
          if (cell?._id === over.id) t = [i, j];
        });
      });

      if (!s || !t) return prev;

      // 🔁 SWAP ONLY
      const temp = copy[s[0]][s[1]];
      copy[s[0]][s[1]] = copy[t[0]][t[1]];
      copy[t[0]][t[1]] = temp;

      // 🕒 RESET TIME + COURT
      copy.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell) {
            cell.MatchTime = TIME_SLOTS[i];
            cell.CourtNumber = j + 1;
          }
        });
      });

      // ✅ VALIDATION
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
        
        {/* HEADER */}
        <div className={styles.header}>
          {[1,2,3,4].map(c => (
            <div key={c}>COURT {c}</div>
          ))}
        </div>

        {/* GRID */}
        {grid.map((row, i) => (
          <div key={i} className={styles.row}>
            {row.map((cell, j) => (
              <Slot key={cell?._id || j} match={cell} />
            ))}
          </div>
        ))}
      </DndContext>
    </div>
  );
}