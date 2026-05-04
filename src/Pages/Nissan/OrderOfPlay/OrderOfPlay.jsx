import React, { useEffect, useState } from "react";
import api from "../../../api";

const courts = [1, 2, 3, 4];
const timeSlots = [
  "07:30",
  "08:15",
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00",
];

const OrderOfPlay = () => {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws`,
        { withCredentials: true }
      );

      const draws = res.data.data;

      // ✅ STEP 1: ALL categories Round 1
      const matches = draws.filter((d) => d.Stage === "Round 1");

      console.log("TOTAL ROUND 1:", matches.length);

      // ✅ STEP 2: AUTO SCHEDULING
      const scheduled = autoSchedule(matches);

      setSchedule(scheduled);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= PLAYER CHECK ================= */
  const getPlayers = (match) => {
    return [
      match.Team1?.partner1?.name,
      match.Team1?.partner2?.name,
      match.Team2?.partner1?.name,
      match.Team2?.partner2?.name,
    ].filter(Boolean);
  };

  const hasClash = (players, scheduledMatches, time) => {
    for (let m of scheduledMatches) {
      if (m.MatchTime !== time) continue;

      const existingPlayers = getPlayers(m);
      if (players.some((p) => existingPlayers.includes(p))) {
        return true;
      }
    }
    return false;
  };

  /* ================= AUTO SCHEDULE ================= */
  const autoSchedule = (matches) => {
    let result = [];

    for (let match of matches) {
      const players = getPlayers(match);
      let placed = false;

      for (let time of timeSlots) {
        for (let court of courts) {
          const clash = hasClash(players, result, time);

          const courtTaken = result.find(
            (m) => m.MatchTime === time && m.CourtNumber === court
          );

          if (!clash && !courtTaken) {
            result.push({
              ...match,
              MatchTime: time,
              CourtNumber: court,
            });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }

      // ❗ fallback (force place if no slot found)
      if (!placed) {
        result.push({
          ...match,
          MatchTime: timeSlots[0],
          CourtNumber: 1,
        });
      }
    }

    return result;
  };

  /* ================= GROUP BY TIME ================= */
  const getMatch = (time, court) => {
    return schedule.find(
      (m) => m.MatchTime === time && m.CourtNumber === court
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>ORDER OF PLAY</h1>

      {/* HEADER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          border: "1px solid black",
        }}
      >
        {courts.map((c) => (
          <div
            key={c}
            style={{ border: "1px solid black", padding: "10px" }}
          >
            <b>COURT {c}</b>
          </div>
        ))}
      </div>

      {/* TABLE */}
      {timeSlots.map((time) => (
        <div
          key={time}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
          }}
        >
          {courts.map((court) => {
            const match = getMatch(time, court);

            return (
              <div
                key={court}
                style={{
                  border: "1px solid black",
                  minHeight: "120px",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                <b>{time}</b>
                <br />

                {match ? (
                  <>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {match.EventCategory}
                    </div>

                    <div>
                      {match.Team1?.partner1?.name} &{" "}
                      {match.Team1?.partner2?.name}
                    </div>

                    <b>VS</b>

                    <div>
                      {match.Team2?.partner1?.name} &{" "}
                      {match.Team2?.partner2?.name}
                    </div>
                  </>
                ) : (
                  "Empty"
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default OrderOfPlay;