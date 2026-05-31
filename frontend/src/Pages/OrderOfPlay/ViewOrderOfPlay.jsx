import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./ViewOrderOfPlay.module.css";
import { toast } from "sonner";

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
  "13:30",
  "14:15",
  "15:00"
];

const COURTS = 4;

/* ================= CARD ================= */
const MatchCard = ({ match }) => {
  if (!match) return <div className={styles.empty}>—</div>;

  const name = (team) =>
    team
      ? `${team.partner1?.name || ""}${
          team.partner2 ? " & " + team.partner2?.name : ""
        }`
      : "BYE";

  return (
    <div className={styles.card}>
      <div className={styles.time}>{match.MatchTime}</div>

      <div className={styles.category}>
        {match.category}
      </div>

      <div>{name(match.Team1)}</div>

      <div className={styles.vs}>VS</div>

      <div>{name(match.Team2)}</div>
    </div>
  );
};

/* ================= MAIN ================= */
export default function ViewOrderOfPlay() {
  const [grid, setGrid] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

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
      toast.error("Error loading order of play");
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

      {/* GRID */}
      {grid.map((row, i) => (
        <div key={i} className={styles.row}>
          {row.map((cell, j) => (
            <div key={cell?._id || j} className={styles.slot}>
              <MatchCard match={cell} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}