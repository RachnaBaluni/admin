import React, { useEffect, useState } from "react";
import api from "../../../api";
import { toast } from "sonner";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

const courts = [1, 2, 3, 4];

// 🔥 apna REAL event id yaha daalo
const EVENT_ID = "685c156477b6439dbcd5f5b8";

/* ================= VALIDATION ================= */
const isValidMatchPlacement = (match, time, court, schedule) => {
  const players = [
    match.Team1?.partner1?.name,
    match.Team1?.partner2?.name,
    match.Team2?.partner1?.name,
    match.Team2?.partner2?.name,
  ].filter(Boolean);

  // ❌ same player same time
  for (let m of schedule) {
    if (m.MatchTime !== time) continue;

    const existingPlayers = [
      m.Team1?.partner1?.name,
      m.Team1?.partner2?.name,
      m.Team2?.partner1?.name,
      m.Team2?.partner2?.name,
    ];

    const clash = players.some((p) => existingPlayers.includes(p));
    if (clash) return "Player already playing at same time ❌";
  }

  // ❌ same court occupied
  const courtTaken = schedule.find(
    (m) => m.MatchTime === time && m.CourtNumber === court
  );

  if (courtTaken) return "Court already occupied ❌";

  return null;
};

/* ================= DRAG MATCH ================= */
const DraggableMatch = ({ match }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: match._id,
    data: { match },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        border: "1px solid black",
        padding: "8px",
        margin: "5px",
        background: "#fff",
        cursor: "grab",
        borderRadius: "6px",
      }}
    >
      <b>{match.EventCategory}</b>
      <br />
      {match.Team1?.partner1?.name} &{" "}
      {match.Team1?.partner2?.name}
      <br />
      <b>VS</b>
      <br />
      {match.Team2?.partner1?.name} &{" "}
      {match.Team2?.partner2?.name}
    </div>
  );
};

/* ================= DROP CELL ================= */
const DropCell = ({ time, court, matches }) => {
  const { setNodeRef } = useDroppable({
    id: `${time}-${court}`,
    data: { time, court },
  });

  const match = matches.find(
    (m) => m.MatchTime === time && m.CourtNumber === court
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        border: "1px solid black",
        minHeight: "130px",
        padding: "10px",
      }}
    >
      <b>{time}</b>
      <br />
      {match ? (
        <DraggableMatch match={match} />
      ) : (
        <span style={{ color: "#999" }}>Empty</span>
      )}
    </div>
  );
};

/* ================= MAIN ================= */
const OrderOfPlay = () => {
  const [draws, setDraws] = useState([]);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${EVENT_ID}`,
        { withCredentials: true }
      );

      console.log("DRAW DATA:", res.data);
      setDraws(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching draws");
    }
  };

  // 👉 Only Round 1
  const matches = draws.filter((d) => d.Stage === "Round 1");

  // 🔥 fixed times (important)
  const times = ["09:00", "10:00", "11:00", "12:00"];

  /* ================= DRAG END ================= */
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const draggedMatch = active.data.current.match;
    const { time, court } = over.data.current;

    const error = isValidMatchPlacement(
      draggedMatch,
      time,
      court,
      matches
    );

    if (error) {
      toast.error(error);
      return;
    }

    // update UI
    const updated = draws.map((d) =>
      d._id === draggedMatch._id
        ? { ...d, MatchTime: time, CourtNumber: court }
        : d
    );

    setDraws(updated);

    toast.success("Match moved ✅");
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>ORDER OF PLAY</h1>

      <DndContext onDragEnd={handleDragEnd}>
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
              style={{ border: "1px solid black", padding: "10px" }}
            >
              <b>COURT {c}</b>
            </div>
          ))}
        </div>

        {/* ROWS */}
        {times.map((time) => (
          <div
            key={time}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
            }}
          >
            {courts.map((court) => (
              <DropCell
                key={court}
                time={time}
                court={court}
                matches={matches}
              />
            ))}
          </div>
        ))}
      </DndContext>
    </div>
  );
};

export default OrderOfPlay;