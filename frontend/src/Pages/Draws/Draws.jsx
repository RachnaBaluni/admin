import React, { useState, useEffect, memo, useCallback } from "react";
import styles from "./Draws.module.css";
import { toast } from "sonner";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

/* =========================
   MATCH (READ ONLY)
   ========================= */
const Match = ({
  team,
  roundIndex,
  opponentTeam,
  matchWinnerId,
  initialScore,
}) => {
  let teamDisplayName;

  if (!team) {
    teamDisplayName = roundIndex === 0 ? "BYE" : "TBD";
  } else {
    teamDisplayName = `${team.partner1?.name || "Unknown"} ${
      team.partner2 ? `& ${team.partner2?.name || "Unknown"}` : ""
    }`;
  }

  const isWinner = team && matchWinnerId && team._id === matchWinnerId;
  const isLoser =
    team && matchWinnerId && opponentTeam && opponentTeam._id === matchWinnerId;

  return (
    <div
      className={`${styles.matchSlot} ${isWinner ? styles.winner : ""} ${
        isLoser || (!team && teamDisplayName === "BYE") ? styles.loser : ""
      }`}
    >
      <div className={styles.teamRow}>
        <span className={styles.teamName}>{teamDisplayName}</span>
        {team && opponentTeam && initialScore && (
          <span className={styles.teamScore}>{initialScore}</span>
        )}
      </div>
    </div>
  );
};

/* =========================
   ROUND (READ ONLY)
   ========================= */
const Round = memo(({ title, matches, roundIndex, totalRounds }) => {
  const isLastRound = roundIndex === totalRounds - 1;

  const [matchScores] = useState(() => {
    const scores = {};
    matches.forEach((match) => {
      const [s1 = "", s2 = ""] = match.Score
        ? match.Score.split(" + ")
        : ["", ""];
      scores[match._id] = { Team1: s1, Team2: s2 };
    });
    return scores;
  });

  return (
    <div className={styles.roundContainer}>
      <h2 className={styles.roundTitle}>{title}</h2>

      <div className={styles.matchesContainer} >
        {matches.map((match, idx) => (
          <React.Fragment key={match._id || idx}>
            <div className={styles.matchPair}
            style={{
    marginTop: `${roundIndex * 90}px`,
  }}>
              {/* Header */}
              <div className={styles.matchHeader}>
                <span className={styles.matchNumber}>
                  Match {match.Match_number}
                </span>
                <span className={styles.matchStatus}>{match.Status}</span>
              </div>

              {/* Meta */}
              <div className={styles.matchMeta}>
                {match.MatchTime && (
                  <span className={styles.matchChip}>
                    {match.MatchTime}
                  </span>
                )}
                {match.CourtNumber && (
                  <span className={styles.matchChip}>
                    Court {match.CourtNumber}
                  </span>
                )}
              </div>

              <Match
                team={match.Team1}
                opponentTeam={match.Team2}
                roundIndex={roundIndex}
                matchWinnerId={match.Winner?._id || match.Winner}
                initialScore={matchScores[match._id]?.Team1}
              />

              <div className={styles.vsSeparator}>V/S</div>

              <Match
                team={match.Team2}
                opponentTeam={match.Team1}
                roundIndex={roundIndex}
                matchWinnerId={match.Winner?._id || match.Winner}
                initialScore={matchScores[match._id]?.Team2}
              />
            </div>

            {!isLastRound && <div className={styles.connectorLine}></div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

/* =========================
   MANAGE RESULT (VIEW ONLY)
   ========================= */
const ManageResult = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDraws = useCallback(async () => {
    if (!selectedEvent) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/nissan-draws/${selectedEvent}`
      );
      if (res.data.success) {
        setDraws(res.data.data);
      }
    } catch {
      toast.error("Error fetching results");
      setDraws([]);
    }
    setLoading(false);
  }, [selectedEvent]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/events`);
        setEvents(res.data.data);
        if (res.data.data.length) {
          setSelectedEvent(res.data.data[0]._id);
        }
      } catch {
        toast.error("Error fetching events");
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  const buildRounds = (draws) => {
    if (!draws.length) return [];

    const grouped = draws.reduce((acc, d) => {
      acc[d.Stage] = acc[d.Stage] || [];
      acc[d.Stage].push(d);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]))
      .map(([stage, matches]) => ({
        title: stage,
        matches: matches.sort(
          (a, b) => a.Match_number - b.Match_number
        ),
      }));
  };

  const rounds = buildRounds(draws);

  return (
    <div className={styles.manageResultContainer}>
      <h1 className={styles.title}>View Draws</h1>

      <div className={styles.eventFilterButtons}>
        {events.map((event) => (
          <button
            key={event._id}
            className={`${styles.filterButton} ${
              selectedEvent === event._id ? styles.active : ""
            }`}
            onClick={() => setSelectedEvent(event._id)}
          >
            {event.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading results...</p>
      ) : draws.length === 0 ? (
        <p>No results available for this event.</p>
      ) : (
        <div className={styles.bracketContainer}>
          {rounds.map((round, idx) => (
            <Round
              key={round.title}
              title={round.title}
              matches={round.matches}
              roundIndex={idx}
              totalRounds={rounds.length}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageResult;
