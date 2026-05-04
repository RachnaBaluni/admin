import React, { useEffect, useState } from "react";
import api from "../../../api";
import { toast } from "sonner";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

const courts = [1, 2, 3, 4];

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
        padding: "6px",
        margin: "4px",
        background: "#fff",
        cursor: "grab",
        fontSize: "12px",
      }}
    >
      <b>{match.Event?.name || "Event"}</b>
      <br />

      {match.Team1?.partner1?.name || "—"}{" "}
      {match.Team1?.partner2 ? `& ${match.Team1.partner2.name}` : ""}
      <br />
      <b>VS</b>
      <br />
      {match.Team2?.partner1?.name || "—"}{" "}
      {match.Team2?.partner2 ? `& ${match.Team2.partner2.name}` : ""}
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
        minHeight: "110px",
        padding: "6px",
      }}
    >
      {match ? <DraggableMatch match={match} /> : "—"}
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
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws`,
        { withCredentials: true }
      );

      console.log("TOTAL DRAWS:", res.data.data.length);
      setDraws(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching draws");
    }
  };

  /* ================= DYNAMIC SCHEDULING ================= */

  const courtsCount = 4;

  const matches = draws
    .filter((d) => d.Stage === "Round 1") // ALL categories included
    .sort((a, b) => a.Match_number - b.Match_number);

  console.log("ROUND 1 MATCHES:", matches.length);

  const generateTime = (index) => {
    const baseHour = 9;
    const hour = baseHour + index;
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  const scheduledMatches = matches.map((m, index) => {
    const slot = Math.floor(index / courtsCount);
    const court = (index % courtsCount) + 1;

    return {
      ...m,
      MatchTime: m.MatchTime || generateTime(slot),
      CourtNumber: m.CourtNumber || court,
    };
  });

  const times = [
    ...new Set(scheduledMatches.map((m) => m.MatchTime)),
  ];

  /* ================= DRAG ================= */
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const draggedMatch = active.data.current.match;
    const { time, court } = over.data.current;

    const updated = scheduledMatches.map((m) =>
      m._id === draggedMatch._id
        ? { ...m, MatchTime: time, CourtNumber: court }
        : m
    );

    setDraws(updated);
    toast.success("Match moved ✅");
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>ORDER OF PLAY</h1>

      <DndContext onDragEnd={handleDragEnd}>
        {/* HEADER */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {courts.map((c) => (
            <div
              key={c}
              style={{
                border: "1px solid black",
                padding: "10px",
                background: "#f0f0f0",
              }}
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
                matches={scheduledMatches}
              />
            ))}
          </div>
        ))}
      </DndContext>
    </div>
  );
};

export default OrderOfPlay;