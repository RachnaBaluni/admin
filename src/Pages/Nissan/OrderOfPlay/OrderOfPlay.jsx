import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./OrderOfPlay.module.css";
import { toast } from "sonner";

import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

/* ================= TIME ================= */
const TIME_SLOTS = ["07:30", "08:15"];

/* ================= PLAYERS ================= */
const getPlayers = (m) => {
  return [
    m?.Team1?.partner1?._id,
    m?.Team1?.partner2?._id,
    m?.Team2?.partner1?._id,
    m?.Team2?.partner2?._id,
  ].filter(Boolean);
};

/* ================= DRAG CARD ================= */
function DraggableMatch({ match, time, allMatches }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: match._id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  /* ================= TEAM LOGIC ================= */

  const getTeamName = (team) => {
    if (!team) return "BYE";

    return `${team.partner1?.name || ""}${
      team.partner2 ? " & " + team.partner2?.name : ""
    }`;
  };

  const name = (team, side) => {
    if (team?.partner1) return getTeamName(team);

    const prevMatchId =
      side === 1
        ? match.previousMatch1
        : match.previousMatch2;

    const prevMatch = allMatches?.find(
      (m) => m._id === prevMatchId
    );

    if (!prevMatch) return "TBD";

    const team1Exists = prevMatch.Team1?.partner1;
    const team2Exists = prevMatch.Team2?.partner1;

    /* BYE WINNER */
    if (team1Exists && !team2Exists)
      return getTeamName(prevMatch.Team1);

    if (!team1Exists && team2Exists)
      return getTeamName(prevMatch.Team2);

    /* NORMAL WINNER */
    const roundNo =
      prevMatch.Stage.replace("Round ", "R");

    return `W-${roundNo}-M${prevMatch.matchNumber}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={styles.card}
    >
      <div className={styles.fixedTime}>{time}</div>

      <div className={styles.round}>{match.Stage}</div>

      <div className={styles.category}>{match.category}</div>

      <div className={styles.team}>{name(match.Team1, 1)}</div>

      <div className={styles.vs}>VS</div>

      <div className={styles.team}>{name(match.Team2, 2)}</div>
    </div>
  );
}

/* ================= DROP SLOT ================= */
function DroppableSlot({ children, id }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={styles.slot}>
      {children}
    </div>
  );
}

/* ================= MAIN ================= */
export default function OrderOfPlay() {
  const [grid, setGrid] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRounds, setSelectedRounds] = useState([]);
  const [courtCount, setCourtCount] = useState(4);
  const [showFilters, setShowFilters] = useState(false);

  const roundsList = [
    "Round 1",
    "Round 2",
    "Round 3",
    "Round 4",
    "Round 5",
  ];

  /* ================= FETCH EVENTS ================= */
  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) fetchData();
  }, [events]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        { withCredentials: true }
      );
      setEvents(res.data.data);
    } catch (err) {
      toast.error("Error loading events");
    }
  };

  /* ================= FETCH MATCHES ================= */
  const fetchData = async () => {
    try {
      const filteredEvents =
        selectedCategories.length > 0
          ? events.filter((ev) =>
              selectedCategories.includes(ev.name)
            )
          : events;

      const allResponses = await Promise.all(
        filteredEvents.map((ev) =>
          axios.get(
            `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
            { withCredentials: true }
          )
        )
      );

      let allMatches = [];

      allResponses.forEach((res, index) => {
        const ev = filteredEvents[index];

        const matches = res.data.data.filter((d) => {
          if (selectedRounds.length === 0)
            return d.Stage === "Round 1";

          return selectedRounds.includes(d.Stage);
        });

        allMatches = [
          ...allMatches,
          ...matches.map((m) => ({
            ...m,
            category: ev.name,
          })),
        ];
      });

      buildGrid(allMatches);
      setShowFilters(false);
    } catch (err) {
      toast.error("Error loading");
    }
  };

  /* ================= GRID ================= */
  const buildGrid = (matches) => {
    const roundOrder = {
      "Round 1": 1,
      "Round 2": 2,
      "Round 3": 3,
      "Round 4": 4,
      "Round 5": 5,
    };

    matches.sort(
      (a, b) =>
        (roundOrder[a.Stage] || 99) -
        (roundOrder[b.Stage] || 99)
    );

    let temp = [];
    let index = 0;

    const rows = Math.ceil(matches.length / courtCount);

    for (let i = 0; i < rows; i++) {
      let row = [];

      for (let j = 0; j < courtCount; j++) {
        row.push({
          match: matches[index] || null,
          time: TIME_SLOTS[i] || `Followed By`,
          court: j + 1,
        });

        index++;
      }

      temp.push(row);
    }

    setGrid(temp);
  };

  /* ================= DRAG ================= */
  const handleDragEnd = () => {
    toast.success("Match swapped");
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h1>ORDER OF PLAY</h1>

        <button onClick={() => setShowFilters(true)}>
          Reset
        </button>
      </div>

      {showFilters && (
        <div className={styles.filterBox}>
          <h3>Select Rounds</h3>

          {roundsList.map((round) => (
            <label key={round}>
              <input
                type="checkbox"
                checked={selectedRounds.includes(round)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRounds([
                      ...selectedRounds,
                      round,
                    ]);
                  } else {
                    setSelectedRounds(
                      selectedRounds.filter(
                        (r) => r !== round
                      )
                    );
                  }
                }}
              />
              {round}
            </label>
          ))}

          <button onClick={fetchData}>
            Generate
          </button>
        </div>
      )}

      {!showFilters && (
        <DndContext onDragEnd={handleDragEnd}>
          {grid.map((row, i) => (
            <div
              key={i}
              className={styles.row}
              style={{
                gridTemplateColumns: `repeat(${courtCount}, 1fr)`,
              }}
            >
              {row.map((cell, j) => (
                <DroppableSlot
                  key={j}
                  id={`slot-${i}-${j}`}
                >
                  {cell?.match && (
                    <DraggableMatch
                      match={cell.match}
                      allMatches={grid
                        .flatMap((r) =>
                          r.map((c) => c.match)
                        )
                        .filter(Boolean)}
                      time={cell.time}
                    />
                  )}
                </DroppableSlot>
              ))}
            </div>
          ))}
        </DndContext>
      )}
    </div>
  );
}