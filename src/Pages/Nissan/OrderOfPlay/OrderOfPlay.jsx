import React, {
  useEffect,
  useState,
} from "react";

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
const TIME_SLOTS = [
  "07:30",
  "08:15",
];

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
function DraggableMatch({
  match,
  time,
}) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: match._id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const name = (team) =>
    team
      ? `${team.partner1?.name || ""}
         ${
           team.partner2
             ? " & " + team.partner2?.name
             : ""
         }`
      : "BYE";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={styles.card}
    >

      {/* TIME */}
      <div className={styles.fixedTime}>
        {time}
      </div>

      {/* ROUND */}
      <div className={styles.round}>
        {match.Stage}
      </div>

      {/* CATEGORY */}
      <div className={styles.category}>
        {match.category}
      </div>

      {/* TEAM 1 */}
      <div className={styles.team}>
        {name(match.Team1)}
      </div>

      {/* VS */}
      <div className={styles.vs}>
        VS
      </div>

      {/* TEAM 2 */}
      <div className={styles.team}>
        {name(match.Team2)}
      </div>

    </div>
  );
}

/* ================= DROP SLOT ================= */
function DroppableSlot({
  children,
  id,
}) {

  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={styles.slot}
    >
      {children}
    </div>
  );
}

/* ================= MAIN ================= */
export default function OrderOfPlay() {

  const [grid, setGrid] = useState([]);

  const [events, setEvents] = useState([]);

  const [selectedCategories, setSelectedCategories] =
    useState([]);

  const [selectedRounds, setSelectedRounds] =
    useState([]);

  const [courtCount, setCourtCount] =
    useState(4);

  const [showFilters, setShowFilters] =
    useState(false);

  const roundsList = [
    "Round 1",
    "Round 2",
    "Round 3",
    "Round 4",
    "Round 5",
    "Quarter Final",
    "Semi Final",
    "Final",
  ];

  /* ================= LOAD EVENTS ================= */
  useEffect(() => {

    fetchEvents();

  }, []);

  /* ================= AUTO LOAD ROUND 1 ================= */
  useEffect(() => {

    if (events.length > 0) {

      fetchData();

    }

  }, [events]);

  /* ================= FETCH EVENTS ================= */
  const fetchEvents = async () => {

    try {

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        {
          withCredentials: true,
        }
      );

      setEvents(res.data.data);

    } catch (err) {

      console.error(err);

      toast.error("Error loading events");
    }
  };

  /* ================= GENERATE ================= */
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
            {
              withCredentials: true,
            }
          )

        )

      );

      let allMatches = [];

      allResponses.forEach((res, index) => {

        const ev = filteredEvents[index];

        const matches = res.data.data.filter(
          (d) => {

            /* DEFAULT ROUND 1 */
            if (selectedRounds.length === 0) {
              return d.Stage === "Round 1";
            }

            return selectedRounds.includes(d.Stage);
          }
        );

        const withCategory =
          matches.map((m) => ({
            ...m,
            category: ev.name,
          }));

        allMatches = [
          ...allMatches,
          ...withCategory,
        ];
      });

      buildGrid(allMatches);

      setShowFilters(false);

      toast.success(
        "✅ Order Generated"
      );

    } catch (err) {

      console.error(err);

      toast.error("Error loading");
    }
  };

  /* ================= BUILD GRID ================= */
  const buildGrid = (matches) => {

    const roundOrder = {
      "Round 1": 1,
      "Round 2": 2,
      "Round 3": 3,
      "Round 4": 4,
      "Round 5": 5,
      "Quarter Final": 6,
      "Semi Final": 7,
      "Final": 8,
    };

    matches.sort(
      (a, b) =>
        (roundOrder[a.Stage] || 99) -
        (roundOrder[b.Stage] || 99)
    );

    let temp = [];
    let index = 0;

    const rows = Math.ceil(
      matches.length / courtCount
    );

    for (let i = 0; i < rows; i++) {

      let row = [];

      for (let j = 0; j < courtCount; j++) {

        const match = matches[index];

        row.push({
          match: match || null,
          time:
            TIME_SLOTS[i] ||
            `Followed By ${i}`,
          court: j + 1,
        });

        index++;
      }

      temp.push(row);
    }

    setGrid(temp);
  };

  /* ================= RESET ================= */
  const handleReset = () => {

    setGrid([]);

    setShowFilters(true);

  };

  /* ================= PRINT ================= */
  const handlePrint = () => {

    window.print();

  };

  /* ================= DRAG END ================= */
  const handleDragEnd = (event) => {

    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    let activePos = null;
    let overPos = null;

    grid.forEach((row, i) => {

      row.forEach((cell, j) => {

        if (
          cell?.match?._id === activeId
        ) {
          activePos = { i, j };
        }

        if (
          `slot-${i}-${j}` === overId
        ) {
          overPos = { i, j };
        }

      });

    });

    if (!activePos || !overPos) {
      return;
    }

    const newGrid = JSON.parse(
      JSON.stringify(grid)
    );

    const dragged =
      newGrid[activePos.i][activePos.j];

    const target =
      newGrid[overPos.i][overPos.j];

    if (
      !dragged?.match ||
      !target?.match
    ) {
      return;
    }

    /* ================= VALIDATION ================= */

    const draggedPlayers =
      getPlayers(dragged.match);

    const targetPlayers =
      getPlayers(target.match);

    const samePlayer =
      draggedPlayers.some((p) =>
        targetPlayers.includes(p)
      );

    if (samePlayer) {

      toast.error(
        "❌ Same player conflict"
      );

      return;
    }

    /* ================= SWAP ================= */

    const temp = dragged.match;

    dragged.match = target.match;

    target.match = temp;

    setGrid(newGrid);

    toast.success(
      "✅ Match swapped"
    );
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>

      {/* TOP BAR */}
      <div className={styles.topBar}>

        <h1>ORDER OF PLAY</h1>

        <div className={styles.buttonGroup}>

          {/* RESET */}
          <button
            className={styles.resetBtn}
            onClick={handleReset}
          >
            Reset Order
          </button>

          {/* GENERATE AGAIN */}
          {
            !showFilters && (
              <button
                className={styles.generateBtn}
                onClick={fetchData}
              >
                Generate Again
              </button>
            )
          }

          {/* PRINT */}
          {
            !showFilters && (
              <button
                className={styles.printBtn}
                onClick={handlePrint}
              >
                Print PDF
              </button>
            )
          }

        </div>

      </div>

      {/* ================= FILTER FORM ================= */}

      {
        showFilters && (

          <div className={styles.filterBox}>

            {/* CATEGORY */}
            <div>

              <h3>Select Categories</h3>

              {events.map((ev) => (

                <label
                  key={ev._id}
                  className={styles.checkboxLabel}
                >

                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(ev.name)}
                    onChange={(e) => {

                      if (e.target.checked) {

                        setSelectedCategories([
                          ...selectedCategories,
                          ev.name,
                        ]);

                      } else {

                        setSelectedCategories(
                          selectedCategories.filter(
                            (c) => c !== ev.name
                          )
                        );
                      }
                    }}
                  />

                  {ev.name}

                </label>

              ))}

            </div>

            {/* ROUNDS */}
            <div>

              <h3>Select Rounds</h3>

              {roundsList.map((round) => (

                <label
                  key={round}
                  className={styles.checkboxLabel}
                >

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

            </div>

            {/* COURTS */}
            <div>

              <h3>Number Of Courts</h3>

              <input
                type="number"
                min="1"
                value={courtCount}
                onChange={(e) =>
                  setCourtCount(Number(e.target.value))
                }
                className={styles.courtInput}
              />

            </div>

            {/* GENERATE */}
            <button
              className={styles.generateBtn}
              onClick={fetchData}
            >
              Generate Order
            </button>

          </div>
        )
      }

      {/* ================= ONLY SHOW GRID WHEN FILTER CLOSED ================= */}

      {
        !showFilters && (
          <>
            {/* HEADER */}
            <div
              className={styles.header}
              style={{
                gridTemplateColumns: `repeat(${courtCount}, 1fr)`,
              }}
            >

              {Array.from({ length: courtCount }).map(
                (_, index) => (
                  <div key={index}>
                    COURT {index + 1}
                  </div>
                )
              )}

            </div>

            {/* GRID */}
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >

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
                          time={
                            cell.time.includes("Followed")
                              ? "Followed By"
                              : cell.time
                          }
                        />

                      )}

                    </DroppableSlot>

                  ))}

                </div>

              ))}

            </DndContext>
          </>
        )
      }

    </div>
  );
}