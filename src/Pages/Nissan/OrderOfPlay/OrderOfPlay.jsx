import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./OrderOfPlay.module.css";
import { toast } from "sonner";
import { DndContext, closestCenter, useDraggable, useDroppable } from "@dnd-kit/core";

/* ================= TIME ================= */

const getTimeLabel = (index) => {
  if (index === 0) return "07:30";
  if (index === 1) return "08:15";
  return "Followed By";
};

/* ================= PLAYERS ================= */

const getPlayers = (m) => [
  m?.Team1?.partner1?._id,
  m?.Team1?.partner2?._id,
  m?.Team2?.partner1?._id,
  m?.Team2?.partner2?._id,
].filter(Boolean);

/* ================= DRAG CARD ================= */

function DraggableMatch({ match, time }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: match._id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const getTeamName = (team, side) => {
    if (team?.partner1?.name) {
      return `${team.partner1.name}${team.partner2 ? " & " + team.partner2.name : ""}`;
    }

    const roundNumber = Number(match.Stage?.replace("Round ", ""));
    if (!roundNumber || roundNumber === 1) return "TBD";

    const prevRound = roundNumber - 1;
    const currentMatchNo = match.matchNo || 1;

    const leftMatch = currentMatchNo * 2 - 1;
    const rightMatch = currentMatchNo * 2;

    return side === 1
      ? `R${prevRound} M${leftMatch} Winner`
      : `R${prevRound} M${rightMatch} Winner`;
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={styles.card}>
      <div className={styles.fixedTime}>{time}</div>
      <div className={styles.round}>{match.Stage}</div>
      <div className={styles.category}>{match.category}</div>
      <div className={styles.team}>{getTeamName(match.Team1, 1)}</div>
      <div className={styles.vs}>VS</div>
      <div className={styles.team}>{getTeamName(match.Team2, 2)}</div>
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
  const [selectedEventId, setSelectedEventId] = useState("");

  /* 🔥 DEFAULT ROUND 1 */
  const [selectedRounds, setSelectedRounds] = useState(["Round 1"]);

  const [courtCount, setCourtCount] = useState(4);
  const [showFilters, setShowFilters] = useState(false);
  const [hideGrid, setHideGrid] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  /* 🔥 FIX: default 10 matches per court */
  const [matchesPerCourt, setMatchesPerCourt] = useState({
    1: 10,
    2: 10,
    3: 10,
    4: 10,
  });

  const roundsList = ["Round 1","Round 2","Round 3","Round 4","Round 5","Round 6"];

  /* ================= LOAD EVENTS ================= */

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      setSelectedEventId(events[0]._id);

      // 🔥 AUTO LOAD ROUND 1
      setSelectedRounds(["Round 1"]);

      fetchData();
    }
  }, [events]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        { withCredentials: true }
      );
      setEvents(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {
    try {
      setGrid([]);

      const filteredEvents =
        selectedCategories.length > 0
          ? events.filter((ev) => selectedCategories.includes(ev.name))
          : events;

      const responses = await Promise.all(
        filteredEvents.map((ev) =>
          axios.get(
            `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
            { withCredentials: true }
          )
        )
      );

      let allMatches = [];

      const allowedRounds = selectedRounds.map(r => r.toLowerCase());

      responses.forEach((res, i) => {
        const ev = filteredEvents[i];
        const matches = res.data.data || [];

        const filtered = matches
          .filter(m =>
            allowedRounds.includes((m.Stage || "").trim().toLowerCase())
          )
          .map((m, idx) => ({
            ...m,
            category: ev.name,
            matchNo: idx + 1,
          }));

        allMatches.push(...filtered);
      });

      buildGrid(allMatches);
      setHideGrid(false);
      setShowFilters(false);

    } catch (err) {
      toast.error("Error loading matches");
    }
  };

  /* ================= GRID ================= */

  const buildGrid = (matches) => {
    const maxRows = Math.max(...Object.values(matchesPerCourt));

    const temp = Array.from({ length: maxRows }, (_, i) =>
      Array.from({ length: courtCount }, (_, j) => ({
        match: null,
        time: getTimeLabel(i),
        court: j + 1,
      }))
    );

    const timeSlotPlayers = {};

    matches.forEach((match) => {
      if (match.Status === "Completed") return;

      const players = getPlayers(match);
      let placed = false;

      for (let i = 0; i < maxRows; i++) {
        const time = getTimeLabel(i);
        if (!timeSlotPlayers[time]) timeSlotPlayers[time] = new Set();

        const conflict = players.some(p => timeSlotPlayers[time].has(p));
        if (conflict) continue;

        for (let j = 0; j < courtCount; j++) {
          if (temp[i][j].match) continue;

          let ok = true;

          if (i > 0) {
            for (let c = 0; c < courtCount; c++) {
              const prev = temp[i - 1][c].match;
              if (!prev) continue;

              const prevPlayers = getPlayers(prev);

              if (players.some(p => prevPlayers.includes(p)) && c !== j) {
                ok = false;
              }
            }
          }

          if (!ok) continue;

          temp[i][j].match = match;
          players.forEach(p => timeSlotPlayers[time].add(p));
          placed = true;
          break;
        }

        if (placed) break;
      }
    });

    setGrid(temp);
  };

  /* ================= DRAG END (FIXED SAFE SWAP) ================= */

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    let a = null, b = null;

    grid.forEach((r, i) =>
      r.forEach((c, j) => {
        if (c?.match?._id === active.id) a = { i, j };
        if (`slot-${i}-${j}` === over.id) b = { i, j };
      })
    );

    if (!a || !b) return;

    const newGrid = JSON.parse(JSON.stringify(grid));

    const cellA = newGrid[a.i][a.j];
    const cellB = newGrid[b.i][b.j];

    if (!cellA?.match || !cellB?.match) return;

    /* 🔥 SIMULATE SWAP FIRST */
    const tempA = cellB.match;
    const tempB = cellA.match;

    const swapped = [
      {
        match: tempA,
        time: cellA.time,
        court: cellA.court,
        rowIndex: a.i,
      },
      {
        match: tempB,
        time: cellB.time,
        court: cellB.court,
        rowIndex: b.i,
      },
    ];

    /* ================= VALIDATION ================= */

    for (const s of swapped) {
      const players = getPlayers(s.match);

      for (let i = 0; i < newGrid.length; i++) {
        for (let j = 0; j < newGrid[i].length; j++) {
          const cell = newGrid[i][j];
          if (!cell?.match) continue;

          if (i === s.rowIndex && j === s.court - 1) continue;

          const cellPlayers = getPlayers(cell.match);

          if (!players.some(p => cellPlayers.includes(p))) continue;

          if (s.time === cell.time && s.court !== cell.court) {
            toast.error("❌ Same player cannot play on different courts at same time");
            return;
          }

          if (Math.abs(s.rowIndex - i) === 1 && s.court !== cell.court) {
            toast.error("❌ Consecutive matches must be on same court");
            return;
          }
        }
      }
    }

    /* 🔥 APPLY SWAP */
    cellA.match = tempA;
    cellB.match = tempB;

    setGrid(newGrid);
    toast.success("✅ Match swapped");
  };

  /* ================= SAVE ================= */

  const saveOrderOfPlay = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/order-of-play`,
        {
          eventId: selectedEventId,
          playDate: selectedDate,
          grid,
        },
        { withCredentials: true }
      );

      toast.success("Order Of Play Saved");
    } catch {
      toast.error("Save Failed");
    }
  };

  /* ================= UI ================= */

  return (
    <div className={styles.container}>

      <div className={styles.topBar}>
        <h1>ORDER OF PLAY</h1>

        <div className={styles.buttonGroup}>
          <button onClick={() => setShowFilters(!showFilters)}>Settings</button>
          <button onClick={fetchData}>Generate Again</button>
          <button onClick={saveOrderOfPlay}>Save</button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filterBox}>
          <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} />
        </div>
      )}

      {!hideGrid && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>

          {grid.map((row, i) => (
            <div key={i} className={styles.row}
              style={{ gridTemplateColumns: `repeat(${courtCount},1fr)` }}>

              {row.map((cell, j) => (
                <DroppableSlot key={j} id={`slot-${i}-${j}`}>
                  {cell?.match && (
                    <DraggableMatch match={cell.match} time={cell.time} />
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