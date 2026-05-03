import React, { useEffect, useState } from "react";
import api from "../../../api";
import { toast } from "sonner";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

const courts = [1, 2, 3, 4];

/* ================= VALIDATION ================= */
const isValidMatchPlacement = (match, time, court, schedule) => {
  const players = [
    match.Team1?.partner1?.name,
    match.Team1?.partner2?.name,
    match.Team2?.partner1?.name,
    match.Team2?.partner2?.name,
  ].filter(Boolean);

  for (let m of schedule) {
    if (m.MatchTime !== time) continue;

    const existingPlayers = [
      m.Team1?.partner1?.name,
      m.Team1?.partner2?.name,
      m.Team2?.partner1?.name,
      m.Team2?.partner2?.name,
    ];

    if (players.some((p) => existingPlayers.includes(p))) {
      return "Player clash ❌";
    }
  }

  const courtTaken = schedule.find(
    (m) => m.MatchTime === time && m.CourtNumber === court
  );

  if (courtTaken) return "Court occupied ❌";

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
        background: "#fff",
        cursor: "grab",
        borderRadius: "6px",
      }}
    >
      <b>{match.EventCategory}</b>
      <br />
      {match.Team1?.partner1?.name} & {match.Team1?.partner2?.name}
      <br />
      <b>VS</b>
      <br />
      {match.Team2?.partner1?.name} & {match.Team2?.partner2?.name}
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
      {match ? <DraggableMatch match={match} /> : "Empty"}
    </div>
  );
};

/* ================= MAIN ================= */
const OrderOfPlay = () => {
  const [draws, setDraws] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  /* ================= FETCH EVENTS ================= */
  useEffect(() => {
    const fetchEvents = async () => {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        { withCredentials: true }
      );
      setEvents(res.data.data);
      setSelectedEvent(res.data.data[0]?._id);
    };
    fetchEvents();
  }, []);

  /* ================= FETCH DRAWS ================= */
  useEffect(() => {
    if (!selectedEvent) return;

    const fetchDraws = async () => {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${selectedEvent}`,
        { withCredentials: true }
      );

      setDraws(res.data.data);

      // default category
      if (res.data.data.length > 0) {
        setSelectedCategory(res.data.data[0].EventCategory);
      }
    };

    fetchDraws();
  }, [selectedEvent]);

  /* ================= FILTER ================= */
  const matches = draws.filter(
    (d) =>
      d.Stage === "Round 1" &&
      d.EventCategory === selectedCategory
  );

  const times = ["09:00", "10:00", "11:00", "12:00"];

  /* ================= DRAG ================= */
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

    if (error) return toast.error(error);

    const updated = draws.map((d) =>
      d._id === draggedMatch._id
        ? { ...d, MatchTime: time, CourtNumber: court }
        : d
    );

    setDraws(updated);
    toast.success("Updated ✅");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>ORDER OF PLAY</h1>

      {/* EVENTS */}
      <div>
        {events.map((e) => (
          <button key={e._id} onClick={() => setSelectedEvent(e._id)}>
            {e.name}
          </button>
        ))}
      </div>

      {/* CATEGORY */}
      <div style={{ margin: "10px 0" }}>
        {[...new Set(draws.map((d) => d.EventCategory))].map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        {/* HEADER */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {courts.map((c) => (
            <div key={c} style={{ border: "1px solid black" }}>
              <b>COURT {c}</b>
            </div>
          ))}
        </div>

        {/* BODY */}
        {times.map((time) => (
          <div
            key={time}
            style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}
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