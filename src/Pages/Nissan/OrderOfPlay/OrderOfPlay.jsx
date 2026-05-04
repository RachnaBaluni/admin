import React, { useEffect, useState } from "react";
import api from "../../../api";
import { toast } from "sonner";

const courts = [1, 2, 3, 4];
const timeSlots = ["07:30", "08:15", "09:00", "09:45", "10:30"];

const OrderOfPlay = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [draws, setDraws] = useState([]);

  // ================= FETCH EVENTS =================
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
          { withCredentials: true }
        );

        setEvents(res.data.data);

        if (res.data.data.length > 0) {
          setSelectedEvent(res.data.data[0]._id);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching events");
      }
    };

    fetchEvents();
  }, []);

  // ================= FETCH DRAWS =================
  useEffect(() => {
    if (selectedEvent) {
      fetchDraws();
    }
  }, [selectedEvent]);

  const fetchDraws = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${selectedEvent}`,
        { withCredentials: true }
      );

      const data = res.data.data;

      console.log("TOTAL DRAWS:", data.length);

      // ✅ Round 1 ALL categories
      const matches = data.filter(
        (d) =>
          d.Stage === "Round 1" &&
          d.Team1 &&
          d.Team2
      );

      console.log("ROUND 1 MATCHES:", matches.length);

      // ✅ auto schedule fill
      const scheduled = matches.map((m, index) => ({
        ...m,
        MatchTime: timeSlots[Math.floor(index / 4)],
        CourtNumber: (index % 4) + 1,
      }));

      setDraws(scheduled);

    } catch (err) {
      console.error(err);
      toast.error("Error fetching draws");
    }
  };

  // ================= NAME =================
  const getName = (team) => {
    if (!team) return "TBD";

    return `${team.partner1?.name || "TBD"} ${
      team.partner2 ? "& " + (team.partner2?.name || "") : ""
    }`;
  };

  const getMatch = (time, court) => {
    return draws.find(
      (m) => m.MatchTime === time && m.CourtNumber === court
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>ORDER OF PLAY</h1>

      {/* ✅ EVENT SELECT */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.name}
            </option>
          ))}
        </select>
      </div>

      {/* HEADER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
        }}
      >
        {courts.map((c) => (
          <div
            key={c}
            style={{
              border: "1px solid black",
              padding: "10px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            COURT {c}
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
                    <div style={{ fontSize: "12px", color: "gray" }}>
                      {match.EventCategory || ""}
                    </div>

                    <div>{getName(match.Team1)}</div>

                    <b>VS</b>

                    <div>{getName(match.Team2)}</div>
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