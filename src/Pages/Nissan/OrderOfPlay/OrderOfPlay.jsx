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
      ? `${team.partner1?.name || ""}${
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

      <div className={styles.fixedTime}>
        {time}
      </div>

      <div className={styles.category}>
        {match.category}
      </div>

      <div>{name(match.Team1)}</div>

      <div className={styles.vs}>
        VS
      </div>

      <div>{name(match.Team2)}</div>

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

  const [courtCount, setCourtCount] =
    useState(4);

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= FETCH ================= */
  const fetchData = async () => {

    try {

      const eventsRes = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
        {
          withCredentials: true,
        }
      );

      setEvents(eventsRes.data.data);

      const filteredEvents =
        selectedCategories.length > 0
          ? eventsRes.data.data.filter((ev) =>
              selectedCategories.includes(ev.name)
            )
          : eventsRes.data.data;

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

        const matches = res.data.data;

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
      "Quarter Final": 3,
      "Semi Final": 4,
      "Final": 5,
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
          time: TIME_SLOTS[i] || `Followed By ${i - 1}`,
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

    toast.success(
      "✅ Order Reset Successfully"
    );
  };

  /* ================= PRINT ================= */
  const handlePrint = () => {

    const printWindow = window.open(
      "",
      "_blank"
    );

    let html = `
      <html>
      <head>

        <title>Order Of Play</title>

        <style>

          body{
            font-family:Arial;
            padding:20px;
          }

          .table{
            display:grid;
            grid-template-columns:repeat(${courtCount},1fr);
            gap:10px;
          }

          .court{
            border:1px solid #000;
            padding:10px;
            text-align:center;
            font-weight:bold;
            background:#e6ffe6;
          }

          .card{
            border:1px solid #999;
            padding:10px;
            border-radius:8px;
            text-align:center;
          }

        </style>

      </head>

      <body>

        <h1>
          ORDER OF PLAY
        </h1>

        <div class="table">
    `;

    for (let i = 1; i <= courtCount; i++) {

      html += `
        <div class="court">
          COURT ${i}
        </div>
      `;
    }

    grid.forEach((row) => {

      row.forEach((cell) => {

        if (!cell?.match) {

          html += `<div></div>`;

          return;
        }

        const teamName = (team) =>
          team
            ? `${team.partner1?.name || ""}
               ${
                 team.partner2
                   ? " & " + team.partner2?.name
                   : ""
               }`
            : "BYE";

        html += `
          <div class="card">

            <b>
              ${
                cell.time.includes("Followed")
                  ? "Followed By"
                  : cell.time
              }
            </b>

            <br/><br/>

            ${cell.match.category}

            <br/><br/>

            ${teamName(cell.match.Team1)}

            <br/><br/>

            <b>VS</b>

            <br/><br/>

            ${teamName(cell.match.Team2)}

          </div>
        `;
      });

    });

    html += `
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);
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

    const temp = dragged.match;

    dragged.match = target.match;

    target.match = temp;

    for (let i = 0; i < newGrid.length; i++) {

      for (let j = 0; j < newGrid[i].length; j++) {

        const cell = newGrid[i][j];

        if (!cell?.match) continue;

        const players1 =
          getPlayers(cell.match);

        for (let x = 0; x < newGrid.length; x++) {

          for (let y = 0; y < newGrid[x].length; y++) {

            if (
              i === x &&
              j === y
            ) continue;

            const compare =
              newGrid[x][y];

            if (!compare?.match) continue;

            const players2 =
              getPlayers(compare.match);

            const samePlayer =
              players1.some((p) =>
                players2.includes(p)
              );

            if (
              samePlayer &&
              cell.time === compare.time &&
              cell.court !== compare.court
            ) {

              toast.error(
                "❌ Same player conflict"
              );

              return;
            }
          }
        }
      }
    }

    setGrid(newGrid);

    toast.success(
      "✅ Match swapped"
    );
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>

      <div className={styles.topBar}>

        <h1>ORDER OF PLAY</h1>

        <div className={styles.buttonGroup}>

          <button
            className={styles.resetBtn}
            onClick={handleReset}
          >
            Reset
          </button>

          <button
            className={styles.generateBtn}
            onClick={fetchData}
          >
            Generate
          </button>

          <button
            className={styles.printBtn}
            onClick={handlePrint}
          >
            Print PDF
          </button>

        </div>

      </div>

      {/* CONTROLS */}
      <div className={styles.controls}>

        <div className={styles.categoryBox}>

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

        <div className={styles.courtBox}>

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

      </div>

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

    </div>
  );
}