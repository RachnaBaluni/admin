import React, { useEffect, useState } from "react";
import "./Result.css";
import axios from "axios";

export default function Result() {
  const [allEvents, setAllEvents] = useState([]);
  const [eventNames, setEventNames] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. Fetch event names
        const eventsResp = await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );

        const namesMap = {};
        const eventIds = [];

        eventsResp.data.data.forEach((ev) => {
          namesMap[ev._id] = ev.name;
          eventIds.push(ev._id);
        });

        setEventNames(namesMap);

        // 2. Fetch matches for each event
        const results = await Promise.all(
          eventIds.map((id) =>
            axios.get(
              `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${id}`,
              {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
              }
            )
          )
        );

        const formatted = results.map((res, idx) => ({
          id: eventIds[idx],
          matches: res.data.success ? res.data.data : [],
        }));

        setAllEvents(formatted);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    fetchAll();
  }, []);

  /* ================= GROUP BY STAGE ================= */
  const groupByStage = (matches) =>
    matches.reduce((acc, match) => {
      const stage = match.Stage;
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(match);
      return acc;
    }, {});

  /* ================= ROUND SORT FIX ================= */
  const getRoundNumber = (stage) => {
    if (!stage) return 0;

    if (typeof stage === "number") return stage;

    const match = stage.toString().match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  /* ================= TEAM RENDER ================= */
  const renderTeam = (team, winnerId) => {
    if (!team) return <td style={{ color: "gray" }}>BYE</td>;

    const isWinner = String(winnerId) === String(team._id);

    return (
      <td
        style={{
          backgroundColor: isWinner ? "#c8e6c9" : "#ffcdd2",
        }}
      >
        {team.partner1?.name} & {team.partner2?.name}
      </td>
    );
  };

  return (
    <div className="resultSection">
      {allEvents.map((event) => {
        const grouped = groupByStage(event.matches);

        // ✅ SORTED STAGES
        const sortedStages = Object.keys(grouped).sort(
          (a, b) => getRoundNumber(a) - getRoundNumber(b)
        );

        return (
          <div key={event.id} style={{ marginBottom: "60px" }}>
            <h2 style={{ marginBottom: "10px" }}>
              {eventNames[event.id] || `Event ID: ${event.id}`}
            </h2>

            {sortedStages.length === 0 ? (
              <p style={{ color: "gray", padding: "15px 0" }}>
                No results available
              </p>
            ) : (
              sortedStages.map((stage) => (
                <div key={stage} style={{ marginBottom: "40px" }}>
                  <h3>{stage}</h3>

                  <table
                    border="1"
                    cellPadding="10"
                    style={{
                      borderCollapse: "collapse",
                      width: "100%",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#e0e0e0" }}>
                        <th>Match</th>
                        <th>Team 1</th>
                        <th>Score</th>
                        <th>Team 2</th>
                        <th>Score</th>
                      </tr>
                    </thead>

                    <tbody>
                      {grouped[stage]
                        .sort(
                          (a, b) =>
                            a.Match_number - b.Match_number
                        )
                        .map((match) => {
                          const winnerId = match.Winner?._id;
                          const scoreParts = match.Score
                            ? match.Score.split("+")
                            : [];

                          return (
                            <tr key={match._id}>
                              <td>
                                {stage === "Round 3"
                                  ? "Final"
                                  : `Match ${match.Match_number}`}
                              </td>

                              {renderTeam(
                                match.Team1,
                                winnerId
                              )}

                              <td>
                                {scoreParts[0] || "—"}
                              </td>

                              {renderTeam(
                                match.Team2,
                                winnerId
                              )}

                              <td>
                                {scoreParts[1] || "—"}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}