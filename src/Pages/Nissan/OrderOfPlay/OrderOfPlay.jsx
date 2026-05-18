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
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00",
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

  const getTeamName = (
    team,
    side
  ) => {

    if (team?.partner1?.name) {

      return `${team.partner1?.name || ""}
        ${
          team.partner2
            ? " & " + team.partner2?.name
            : ""
        }`;
    }

    const roundNumber =
      Number(
        match.Stage?.replace(
          "Round ",
          ""
        )
      );

    if (
      !roundNumber ||
      roundNumber === 1
    ) {
      return "TBD";
    }

    const prevRound =
      roundNumber - 1;

    const currentMatchNo =
      match.matchNo || 1;

    const leftMatch =
      (currentMatchNo * 2) - 1;

    const rightMatch =
      currentMatchNo * 2;

    if (side === 1) {
      return `R${prevRound} M${leftMatch} Winner`;
    }

    return `R${prevRound} M${rightMatch} Winner`;
  };

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

      <div className={styles.round}>
        {match.Stage}
      </div>

      <div className={styles.category}>
        {match.category}
      </div>

      <div className={styles.team}>
        {getTeamName(
          match.Team1,
          1
        )}
      </div>

      <div className={styles.vs}>
        VS
      </div>

      <div className={styles.team}>
        {getTeamName(
          match.Team2,
          2
        )}
      </div>

    </div>
  );
}

/* ================= DROP SLOT ================= */

function DroppableSlot({
  children,
  id,
}) {

  const { setNodeRef } =
    useDroppable({
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

  const [grid, setGrid] =
    useState([]);

  const [events, setEvents] =
    useState([]);

  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState([]);

  /* DEFAULT */

  const [
    selectedRounds,
    setSelectedRounds,
  ] = useState([
    "Round 1",
    "Round 2",
  ]);

  const [
    courtCount,
    setCourtCount,
  ] = useState(4);

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [
    matchesPerCourt,
    setMatchesPerCourt,
  ] = useState({
    1: 4,
    2: 4,
    3: 4,
    4: 4,
  });

  const roundsList = [
    "Round 1",
    "Round 2",
    "Round 3",
    "Round 4",
    "Round 5",
    "Round 6",
  ];

  /* ================= LOAD EVENTS ================= */

  useEffect(() => {
    fetchEvents();
  }, []);

  /* ================= AUTO LOAD ================= */

  useEffect(() => {

    if (events.length > 0) {
      fetchData();
    }

  }, [events]);

  /* ================= FETCH EVENTS ================= */

  const fetchEvents = async () => {

    try {

      const res =
        await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
          {
            withCredentials: true,
          }
        );

      setEvents(
        res.data.data
      );

    } catch (err) {

      console.error(err);

      toast.error(
        "Error loading events"
      );
    }
  };

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {

    try {

      const filteredEvents =
        selectedCategories.length > 0
          ? events.filter((ev) =>
              selectedCategories.includes(
                ev.name
              )
            )
          : events;

      const allResponses =
        await Promise.all(

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

      allResponses.forEach(
        (res, index) => {

          const ev =
            filteredEvents[index];

          const filteredMatches =
            res.data.data.filter(
              (m) =>
                selectedRounds.includes(
                  m.Stage?.trim()
                )
            );

          const matchesWithData =
            filteredMatches.map(
              (m, idx) => ({
                ...m,
                category: ev.name,
                matchNo: idx + 1,
              })
            );

          allMatches.push(
            ...matchesWithData
          );
        }
      );

      /* SORT */

      const roundOrder = {
        "Round 1": 1,
        "Round 2": 2,
        "Round 3": 3,
        "Round 4": 4,
        "Round 5": 5,
        "Round 6": 6,
      };

      allMatches.sort(
        (a, b) => {

          const roundDiff =
            (roundOrder[a.Stage] || 99)
            -
            (roundOrder[b.Stage] || 99);

          if (roundDiff !== 0) {
            return roundDiff;
          }

          return (
            (a.matchNo || 0)
            -
            (b.matchNo || 0)
          );
        }
      );

      buildGrid(allMatches);

      setShowFilters(false);

      toast.success(
        "Order Generated"
      );

    } catch (err) {

      console.error(err);

      toast.error(
        "Error loading matches"
      );
    }
  };

  /* ================= BUILD GRID ================= */

  const buildGrid = (
    matches
  ) => {

    let temp = [];

    let matchIndex = 0;

    const maxRows =
      Math.max(
        ...Object.values(
          matchesPerCourt
        )
      );

    for (
      let i = 0;
      i < maxRows;
      i++
    ) {

      let row = [];

      for (
        let j = 0;
        j < courtCount;
        j++
      ) {

        const courtNo =
          j + 1;

        const allowedMatches =
          matchesPerCourt[
            courtNo
          ] || 0;

        if (
          i < allowedMatches
        ) {

          const match =
            matches[
              matchIndex
            ];

          row.push({
            match:
              match || null,
            time:
              TIME_SLOTS[i]
              ||
              `Followed By ${i}`,
            court:
              courtNo,
          });

          if (match) {
            matchIndex++;
          }

        } else {

          row.push({
            match: null,
            time:
              TIME_SLOTS[i]
              ||
              `Followed By ${i}`,
            court:
              courtNo,
          });
        }
      }

      temp.push(row);
    }

    setGrid(temp);
  };

  /* ================= SETTINGS ================= */

  const handleSettings =
    () => {

      setShowFilters(
        !showFilters
      );

    };

  /* ================= PRINT ================= */

  const handlePrint =
    () => {

      window.print();

    };

  /* ================= ROUND SELECT ================= */

  const handleRoundSelect =
    (round) => {

      let updated =
        [...selectedRounds];

      if (
        updated.includes(
          round
        )
      ) {

        updated =
          updated.filter(
            (r) =>
              r !== round
          );

      } else {

        if (
          updated.length >= 2
        ) {

          toast.error(
            "Only 2 rounds allowed"
          );

          return;
        }

        updated.push(round);
      }

      const nums =
        updated
          .map((r) =>
            Number(
              r.replace(
                "Round ",
                ""
              )
            )
          )
          .sort(
            (a, b) =>
              a - b
          );

      if (
        nums.length === 2 &&
        nums[1] - nums[0] !== 1
      ) {

        toast.error(
          "Select consecutive rounds"
        );

        return;
      }

      setSelectedRounds(
        updated
      );
    };

  /* ================= DRAG END ================= */

  const handleDragEnd =
    (event) => {

      const {
        active,
        over,
      } = event;

      if (!over) return;

      const activeId =
        active.id;

      const overId =
        over.id;

      let activePos =
        null;

      let overPos =
        null;

      grid.forEach(
        (row, i) => {

          row.forEach(
            (
              cell,
              j
            ) => {

              if (
                cell?.match?._id ===
                activeId
              ) {

                activePos = {
                  i,
                  j,
                };
              }

              if (
                `slot-${i}-${j}` ===
                overId
              ) {

                overPos = {
                  i,
                  j,
                };
              }
            }
          );
        }
      );

      if (
        !activePos ||
        !overPos
      ) {
        return;
      }

      const newGrid =
        JSON.parse(
          JSON.stringify(
            grid
          )
        );

      const dragged =
        newGrid[
          activePos.i
        ][activePos.j];

      const target =
        newGrid[
          overPos.i
        ][overPos.j];

      if (
        !dragged?.match ||
        !target?.match
      ) {
        return;
      }

      const tempMatch =
        dragged.match;

      dragged.match =
        target.match;

      target.match =
        tempMatch;

      setGrid(newGrid);

      toast.success(
        "Match swapped"
      );
    };

  /* ================= UI ================= */

  return (
    <div
      className={
        styles.container
      }
    >

      {/* TOP BAR */}

      <div
        className={
          styles.topBar
        }
      >

        <h1>
          ORDER OF PLAY
        </h1>

        <div
          className={
            styles.buttonGroup
          }
        >

          <button
            className={
              styles.resetBtn
            }
            onClick={
              handleSettings
            }
          >
            Settings
          </button>

          <button
            className={
              styles.generateBtn
            }
            onClick={
              fetchData
            }
          >
            Generate Again
          </button>

          <button
            className={
              styles.printBtn
            }
            onClick={
              handlePrint
            }
          >
            Print PDF
          </button>

        </div>

      </div>

      {/* SETTINGS */}

      {showFilters && (

        <div
          className={
            styles.filterBox
          }
        >

          {/* CATEGORY */}

          <div>

            <h3>
              Categories
            </h3>

            {events.map(
              (
                ev
              ) => (

                <label
                  key={
                    ev._id
                  }
                  className={
                    styles.checkboxLabel
                  }
                >

                  <input
                    type="checkbox"
                    checked={
                      selectedCategories.includes(
                        ev.name
                      )
                    }
                    onChange={(
                      e
                    ) => {

                      if (
                        e.target.checked
                      ) {

                        setSelectedCategories([
                          ...selectedCategories,
                          ev.name,
                        ]);

                      } else {

                        setSelectedCategories(
                          selectedCategories.filter(
                            (
                              c
                            ) =>
                              c !==
                              ev.name
                          )
                        );
                      }
                    }}
                  />

                  {ev.name}

                </label>

              )
            )}

          </div>

          {/* ROUNDS */}

          <div
            className={
              styles.roundSelector
            }
          >

            <h3>
              Select Any 2 Consecutive Rounds
            </h3>

            <div
              className={
                styles.roundButtons
              }
            >

              {roundsList.map(
                (
                  round
                ) => (

                  <button
                    key={
                      round
                    }
                    onClick={() =>
                      handleRoundSelect(
                        round
                      )
                    }
                    className={
                      selectedRounds.includes(
                        round
                      )
                        ? styles.activeRoundBtn
                        : styles.roundBtn
                    }
                  >

                    {round}

                  </button>

                )
              )}

            </div>

          </div>

          {/* SETTINGS */}

          <div
            className={
              styles.settingsBox
            }
          >

            <div
              className={
                styles.settingItem
              }
            >

              <label>
                Number Of Courts
              </label>

              <input
                type="number"
                min="1"
                value={
                  courtCount
                }
                onChange={(
                  e
                ) =>
                  setCourtCount(
                    Number(
                      e.target
                        .value
                    )
                  )
                }
                className={
                  styles.courtInput
                }
              />

            </div>

            <div
              className={
                styles.settingItem
              }
            >

              <label>
                Matches Per Court
              </label>

              {Array.from({
                length:
                  courtCount,
              }).map(
                (
                  _,
                  index
                ) => (

                  <div
                    key={
                      index
                    }
                    className={
                      styles.matchCourtRow
                    }
                  >

                    <span>
                      Court {index + 1}
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={
                        matchesPerCourt[
                          index + 1
                        ] || 1
                      }
                      onChange={(
                        e
                      ) =>

                        setMatchesPerCourt(
                          {
                            ...matchesPerCourt,
                            [
                              index + 1
                            ]:
                              Number(
                                e.target
                                  .value
                              ),
                          }
                        )

                      }
                      className={
                        styles.smallInput
                      }
                    />

                  </div>

                )
              )}

            </div>

            <button
              className={
                styles.generateBtn
              }
              onClick={
                fetchData
              }
            >
              Apply Changes
            </button>

          </div>

        </div>

      )}

      {/* HIDE TABLE WHEN SETTINGS OPEN */}

      {!showFilters && (
        <>

          {/* HEADER */}

          <div
            className={
              styles.header
            }
            style={{
              gridTemplateColumns:
                `repeat(${courtCount}, 1fr)`,
            }}
          >

            {Array.from({
              length:
                courtCount,
            }).map(
              (
                _,
                index
              ) => (

                <div
                  key={
                    index
                  }
                >
                  COURT {index + 1}
                </div>

              )
            )}

          </div>

          {/* MATCHES */}

          <DndContext
            collisionDetection={
              closestCenter
            }
            onDragEnd={
              handleDragEnd
            }
          >

            {grid.map(
              (
                row,
                i
              ) => (

                <div
                  key={i}
                  className={
                    styles.row
                  }
                  style={{
                    gridTemplateColumns:
                      `repeat(${courtCount}, 1fr)`,
                  }}
                >

                  {row.map(
                    (
                      cell,
                      j
                    ) => (

                      <DroppableSlot
                        key={j}
                        id={`slot-${i}-${j}`}
                      >

                        {cell?.match && (

                          <DraggableMatch
                            match={
                              cell.match
                            }
                            time={
                              cell.time.includes(
                                "Followed"
                              )
                                ? "Followed By"
                                : cell.time
                            }
                          />

                        )}

                      </DroppableSlot>

                    )
                  )}

                </div>

              )
            )}

          </DndContext>

        </>
      )}

    </div>
  );
}