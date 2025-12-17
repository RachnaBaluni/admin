import React, { useEffect, useState, memo, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import styles from "./DrawDisplay.module.css";

const BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

const TOP_PAUSE = 1000;
const BOTTOM_PAUSE = 2000;

/* ===================== */
/* MATCH SLOT (READ ONLY) */
/* ===================== */

const DisplayMatch = ({ team, opponentTeam, matchWinnerId, roundIndex }) => {
  let teamName = "TBD";

  if (!team) {
    teamName = roundIndex === 0 ? "BYE" : "TBD";
  } else {
    teamName = `${team.partner1?.name || ""}${
      team.partner2 ? ` & ${team.partner2.name}` : ""
    }`;
  }

  const isWinner = team && team._id === matchWinnerId;
  const isLoser =
    team && opponentTeam && opponentTeam._id === matchWinnerId;

  return (
    <div
      className={`${styles.matchSlot} ${
        isWinner ? styles.winner : ""
      } ${isLoser ? styles.loser : ""}`}
    >
      <div className={styles.teamName}>{teamName}</div>
    </div>
  );
};

/* ===================== */
/* ROUND (READ ONLY)     */
/* ===================== */

const DisplayRound = memo(({ title, matches, roundIndex }) => {
  return (
    <div className={styles.roundContainer}>
      <h2 className={styles.roundTitle}>{title}</h2>

      <div className={styles.matchesContainer}>
        {matches.map((match) => (
          <div key={match._id} className={styles.matchPair}>
            <div className={styles.matchNumber}>
              Match {match.Match_number}
            </div>

            <DisplayMatch
              team={match.Team1}
              opponentTeam={match.Team2}
              matchWinnerId={match.Winner?._id || match.Winner}
              roundIndex={roundIndex}
            />

            
            <div className={styles.vsSeparator}>V/S</div>

            

            <DisplayMatch
              team={match.Team2}
              opponentTeam={match.Team1}
              matchWinnerId={match.Winner?._id || match.Winner}
              roundIndex={roundIndex}
            />

            {match.Score && (
              <div className={styles.scoreText}>{match.Score}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

/* ===================== */
/* MAIN DISPLAY           */
/* ===================== */

const DrawDisplay = () => {
  const { state } = useLocation();
  const config = state?.config || [];

  const [eventIndex, setEventIndex] = useState(0);
  const [draws, setDraws] = useState([]);
  const scrollRef = useRef(null);

  const currentConfig = config[eventIndex];

  /* FETCH DRAWS */
  useEffect(() => {
    console.log(currentConfig);
    if (!currentConfig) return;

    axios
      .get(`${BASE_URL}/api/nissan-draws/${currentConfig.eventId}`)
      .then((res) => setDraws(res.data.data || []));
  }, [currentConfig]);

  if (!currentConfig) return null;

  /* BUILD ROUNDS (SAME AS ManageResult) */

  const grouped = draws.reduce((acc, d) => {
    acc[d.Stage] = acc[d.Stage] || [];
    acc[d.Stage].push(d);
    return acc;
  }, {});

  const orderedStages = Object.keys(grouped).sort(
    (a, b) =>
      parseInt(a.split(" ")[1] || 0) -
      parseInt(b.split(" ")[1] || 0)
  );

  const startIdx = orderedStages.indexOf(currentConfig.start);
  const endIdx = orderedStages.indexOf(currentConfig.end);

  const rounds = orderedStages
    .slice(startIdx, endIdx + 1)
    .map((stage) => ({
      title: stage,
      matches: grouped[stage].sort(
        (a, b) => a.Match_number - b.Match_number
      ),
    }));

  /* AUTO SCROLL + EVENT ROTATION */

  useEffect(() => {
    if (!scrollRef.current || !rounds.length) return;

    const container = scrollRef.current;
    const duration =
      (currentConfig.scrollSeconds || 10) * 1000;

    container.scrollTop = 0;

    let startTime = null;
    const maxScroll =
      container.scrollHeight - container.clientHeight;

    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min(
        (ts - startTime) / duration,
        1
      );
      container.scrollTop = maxScroll * progress;
      if (progress < 1) requestAnimationFrame(animate);
    };

    const scrollTimer = setTimeout(
      () => requestAnimationFrame(animate),
      TOP_PAUSE
    );

    const rotateTimer = setTimeout(
      () => setEventIndex((i) => (i + 1) % config.length),
      TOP_PAUSE + duration + BOTTOM_PAUSE
    );

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(rotateTimer);
    };
  }, [rounds, eventIndex, currentConfig, config.length]);

  return (
    <div className={styles.displayScreen}>
      <header className={styles.displayHeader}>
        <h1>{currentConfig.eventName || "EVENT"}</h1>
      </header>

      <div ref={scrollRef} className={styles.scrollArea}>
        <div className={styles.bracketContainer}>
          {rounds.map((round, idx) => (
            <DisplayRound
              key={round.title}
              title={round.title}
              matches={round.matches}
              roundIndex={idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrawDisplay;
