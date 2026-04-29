import React, { useState, useEffect, memo } from "react";
import axios from "axios";
import styles from "./ViewResult.module.css";
import { toast } from "sonner";

/* ================= MATCH ================= */
const Match = ({
  team,
  roundIndex,
  matchId,
  onUpdateMatch,
  matchWinnerId,
}) => {
  let teamDisplayName;

  if (!team) {
    teamDisplayName = roundIndex === 0 ? "BYE" : "TBD";
  } else {
    teamDisplayName =
      (team.partner1?.name || "Unknown") +
      (team.partner2 ? ` & ${team.partner2?.name}` : "");
  }

  // ✅ HANDLE OBJECT + STRING + NULL
  const winnerId = matchWinnerId?._id || matchWinnerId;

  // ✅ APPLY COLOR ONLY IF RESULT EXISTS
  const hasResult = !!winnerId;

  const isWinner =
    hasResult && team && String(team._id) === String(winnerId);

  const isLoser =
    hasResult && team && String(team._id) !== String(winnerId);

  const handleClick = async () => {
    if (!team) return;

    try {
      await onUpdateMatch(matchId, {
        Winner: team._id,
        Status: "Completed",
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      className={`${styles.matchSlot} ${isWinner ? styles.winner : ""} ${
        isLoser ? styles.loser : ""
      }`}
      onClick={handleClick}
    >
      <div className={styles.teamName}>{teamDisplayName}</div>
    </div>
  );
};

/* ================= ROUND ================= */
const Round = memo(({ title, matches, roundIndex, onUpdateMatch }) => {
  const customLayout = {
    0: { offset: 0, gap: 20 },
    1: { offset: 120, gap: 180 },
    2: { offset: 260, gap: 500 },
    3: { offset: 520, gap: 1200 },
  };

  const offset = customLayout[roundIndex]?.offset || 0;
  const gap = customLayout[roundIndex]?.gap || 20;

  return (
    <div className={styles.roundContainer}>
      <h2 className={styles.roundTitle}>{title}</h2>

      <div
        className={styles.matchesWrapper}
        style={{
          marginTop: `${offset}px`,
          gap: `${gap}px`,
        }}
      >
        {matches.map((m) => (
          <div key={m._id} className={styles.matchPair}>
            <div className={styles.matchNumber}>
              Match {m.Match_number}
            </div>

            <Match
              team={m.Team1}
              roundIndex={roundIndex}
              matchId={m._id}
              matchWinnerId={m.Winner}
              onUpdateMatch={onUpdateMatch}
            />

            <div className={styles.vsSeparator}>V/S</div>

            <Match
              team={m.Team2}
              roundIndex={roundIndex}
              matchId={m._id}
              matchWinnerId={m.Winner}
              onUpdateMatch={onUpdateMatch}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

/* ================= MAIN ================= */
const ViewResult = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [draws, setDraws] = useState([]);

  const API = import.meta.env.VITE_APP_BACKEND_URL;

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API}/api/events`);
      setEvents(res.data.data);
      setSelectedEvent(res.data.data[0]?._id);
    } catch {
      toast.error("Failed to load events");
    }
  };

  const fetchDraws = async () => {
    if (!selectedEvent) return;

    try {
      const res = await axios.get(
        `${API}/api/nissan-draws/${selectedEvent}`
      );
      setDraws(res.data.data);
    } catch {
      toast.error("Failed to load draws");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchDraws();
  }, [selectedEvent]);

  const handleUpdateMatch = async (id, data) => {
    await axios.put(`${API}/api/nissan-draws/${id}`, data);
    fetchDraws();
  };

  const rounds = Object.entries(
    draws.reduce((acc, d) => {
      if (!acc[d.Stage]) acc[d.Stage] = [];
      acc[d.Stage].push(d);
      return acc;
    }, {})
  )
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([_, matches]) =>
      matches.sort((a, b) => a.Match_number - b.Match_number)
    );

  return (
    <div className={styles.manageResultContainer}>
      <h1>View Results</h1>

      <div className={styles.eventFilterButtons}>
        {events.map((e) => (
          <button
            key={e._id}
            onClick={() => setSelectedEvent(e._id)}
            className={`${styles.filterButton} ${
              selectedEvent === e._id ? styles.active : ""
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      <div className={styles.bracketContainer}>
        {rounds.map((r, i) => (
          <Round
            key={i}
            title={`Round ${i + 1}`}
            matches={r}
            roundIndex={i}
            onUpdateMatch={handleUpdateMatch}
          />
        ))}
      </div>
    </div>
  );
};

export default ViewResult;