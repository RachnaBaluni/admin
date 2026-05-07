import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./OrderOfPlay.module.css";
import { toast } from "sonner";

import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

/* ================= TIME SLOTS ================= */
const TIME_SLOTS = [
  "07:30",
  "08:15",
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00",
  "12:45",
];

const COURTS = 4;

/* ================= GET PLAYER IDs ================= */
const getPlayers = (match) => {
  if (!match) return [];
  return [
    match?.Team1?.partner1?._id,
    match?.Team1?.partner2?._id,
    match?.Team2?.partner1?._id,
    match?.Team2?.partner2?._id,
  ].filter(Boolean);
};

/* ================= VALIDATE SWAP ================= */
/*
 * We validate BEFORE the swap, simulating the post-swap state.
 *
 * grid[row][col] = { match, time, court }
 * - time and court are FIXED to the slot.
 * - Only Team1 / Team2 inside match will be swapped.
 *
 * After simulating the swap, we check ALL slot pairs:
 *   1. No player appears twice in the same time row.
 *   2. If a player has matches in consecutive rows,
 *      both must be in the same column (court).
 */
const validateSwap = (grid, fromRow, fromCol, toRow, toCol) => {
  // Build post-swap slot list: [ { row, col, players[] } ]
  const slots = [];

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const cell = grid[i][j];
      if (!cell?.match) continue;

      // Simulate: which match's teams will be in this slot after the swap?
      let match = cell.match;
      if (i === fromRow && j === fromCol) {
        match = grid[toRow][toCol].match;   // dragged slot gets target's teams
      } else if (i === toRow && j === toCol) {
        match = grid[fromRow][fromCol].match; // target slot gets dragged's teams
      }

      slots.push({ row: i, col: j, players: getPlayers(match) });
    }
  }

  // Check every unique pair of slots
  for (let a = 0; a < slots.length; a++) {
    for (let b = a + 1; b < slots.length; b++) {
      const A = slots[a];
      const B = slots[b];

      const shared = A.players.filter((p) => B.players.includes(p));
      if (shared.length === 0) continue;

      // Rule 1: Same row (same time) — cannot play twice simultaneously
      if (A.row === B.row) {
        return "❌ Same player cannot play two matches at the same time";
      }

      // Rule 2: Consecutive rows — must be on the same court
      if (Math.abs(A.row - B.row) === 1 && A.col !== B.col) {
        return "❌ Consecutive matches for the same player must be on the same court";
      }
    }
  }

  return null;
};

/* ================= TEAM NAME HELPER ================= */
const getTeamName = (team) => {
  if (!team) return "TBD";
  const p1 = team.partner1?.name || "";
  const p2 = team.partner2?.name ? ` & ${team.partner2.name}` : "";
  return `${p1}${p2}` || "TBD";
};

/* ================= DRAGGABLE MATCH CARD ================= */
/*
 * Accepts only display-ready props — no raw match object.
 * time, category are passed from the SLOT, not from the match,
 * so they never move during a swap.
 */
function DraggableMatch({ matchId, time, category, team1Name, team2Name }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: matchId });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${styles.card} ${isDragging ? styles.dragging : ""}`}
    >
      <div className={styles.fixedTime}>{time}</div>
      <div className={styles.category}>{category}</div>
      <div className={styles.teamName}>{team1Name}</div>
      <div className={styles.vs}>VS</div>
      <div className={styles.teamName}>{team2Name}</div>
    </div>
  );
}

/* ================= DROPPABLE SLOT ================= */
function DroppableSlot({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.slot} ${isOver ? styles.slotOver : ""}`}
    >
      {children}
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function OrderOfPlay() {
  const [grid, setGrid] = useState([]);

  /*
   * Activation constraints prevent click/tap from triggering drag:
   * - Mouse: must move at least 8px before drag starts
   * - Touch: must hold 200ms and move at most 8px tolerance
   */
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
      const eventsRes = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        { withCredentials: true }
      );

      let allMatches = [];

      for (const ev of eventsRes.data.data) {
        const res = await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
          { withCredentials: true }
        );

        const matches = res.data.data
          .filter((d) => d.Stage === "Round 1")
          .map((m) => ({ ...m, category: ev.name }));

        allMatches = [...allMatches, ...matches];
      }

      buildGrid(allMatches);
    } catch (err) {
      console.error(err);
      toast.error("Error loading matches");
    }
  };

  /* ================= BUILD GRID ================= */
  /*
   * grid[row][col] = {
   *   match:  { _id, category, Team1, Team2, ...rest }
   *   time:   string   ← FIXED to this row index forever
   *   court:  number   ← FIXED to this col index forever
   * }
   */
  const buildGrid = (matches) => {
    const rows = Math.ceil(matches.length / COURTS);
    const temp = [];
    let index = 0;

    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < COURTS; j++) {
        row.push({
          match: matches[index] || null,
          time: TIME_SLOTS[i] || "",
          court: j + 1,
        });
        index++;
      }
      temp.push(row);
    }

    setGrid(temp);
  };

  /* ================= DRAG END ================= */
  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Dropped outside any slot
    if (!over) return;

    const activeId = active.id;   // match._id of the dragged card
    const overId   = over.id;     // "slot-{row}-{col}"

    // Locate source (fromRow/fromCol) and target (toRow/toCol)
    let fromRow = null, fromCol = null;
    let toRow   = null, toCol   = null;

    grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell?.match?._id === activeId) {
          fromRow = i; fromCol = j;
        }
        if (`slot-${i}-${j}` === overId) {
          toRow = i; toCol = j;
        }
      });
    });

    // Could not resolve positions
    if (fromRow === null || toRow === null) return;

    // Same slot — nothing to do
    if (fromRow === toRow && fromCol === toCol) return;

    // Target slot must have a match to swap with
    if (!grid[toRow]?.[toCol]?.match) return;

    /* ---- Validate BEFORE mutating state ---- */
    const error = validateSwap(grid, fromRow, fromCol, toRow, toCol);
    if (error) {
      toast.error(error);
      return; // grid is NOT modified — reverted by doing nothing
    }

    /* ---- Swap ONLY Team1 / Team2 between the two slots ---- */
    /*
     * We shallow-copy every row and cell so React detects the change.
     * time, court, category, _id all remain with their original slot.
     */
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell, match: cell.match ? { ...cell.match } : null })));

    const fromTeams = {
      Team1: newGrid[fromRow][fromCol].match.Team1,
      Team2: newGrid[fromRow][fromCol].match.Team2,
    };
    const toTeams = {
      Team1: newGrid[toRow][toCol].match.Team1,
      Team2: newGrid[toRow][toCol].match.Team2,
    };

    newGrid[fromRow][fromCol].match.Team1 = toTeams.Team1;
    newGrid[fromRow][fromCol].match.Team2 = toTeams.Team2;
    newGrid[toRow][toCol].match.Team1     = fromTeams.Team1;
    newGrid[toRow][toCol].match.Team2     = fromTeams.Team2;

    setGrid(newGrid);
  };

  /* ================= RENDER ================= */
  return (
    <div className={styles.container}>
      <h1>ORDER OF PLAY</h1>

      {/* COURT HEADER ROW */}
      <div className={styles.header}>
        <div className={styles.timeLabel} />
        {Array.from({ length: COURTS }, (_, i) => (
          <div key={i} className={styles.courtLabel}>
            COURT {i + 1}
          </div>
        ))}
      </div>

      {/* GRID */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {grid.map((row, i) => (
          <div key={i} className={styles.row}>

            {/* Fixed time label pinned to left of each row */}
            <div className={styles.timeLabel}>{row[0]?.time}</div>

            {row.map((cell, j) => (
              <DroppableSlot key={j} id={`slot-${i}-${j}`}>
                {cell?.match && (
                  /*
                   * We pass time and category from the SLOT (cell),
                   * not from cell.match — so they stay fixed even
                   * after teams are swapped into this slot.
                   */
                  <DraggableMatch
                    matchId={cell.match._id}
                    time={cell.time}
                    category={cell.match.category}
                    team1Name={getTeamName(cell.match.Team1)}
                    team2Name={getTeamName(cell.match.Team2)}
                  />
                )}
              </DroppableSlot>
            ))}

          </div>
        ))}
      </DndContext>
    </div>
  );
}
