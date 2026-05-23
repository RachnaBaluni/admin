import React, {
  useEffect,
  useState,
  useRef,
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

const getTimeLabel = (index) => {
  if (index === 0) return "07:30";

  if (index === 1) return "08:15";

  return "Followed By";
};

/* ================= PLAYERS ================= */

const getPlayers = (
  m,
  allMatches = []
) => {
  if (!m) return [];

  const currentPlayers = [
    m?.Team1?.partner1?._id,
    m?.Team1?.partner2?._id,
    m?.Team2?.partner1?._id,
    m?.Team2?.partner2?._id,
  ].filter(Boolean);

  const hasTeam1 =
    m?.Team1?.partner1?._id;

  const hasTeam2 =
    m?.Team2?.partner1?._id;

  // NORMAL MATCH
  if (hasTeam1 && hasTeam2) {
    return currentPlayers;
  }

  // ONE TEAM + TBD
  if (
    (hasTeam1 && !hasTeam2) ||
    (!hasTeam1 && hasTeam2)
  ) {
    return currentPlayers;
  }

  const roundNumber = Number(
    m.Stage?.replace("Round ", "")
  );

  if (
    !roundNumber ||
    roundNumber === 1
  ) {
    return [];
  }

  const prevRound =
    roundNumber - 1;

  const currentMatchNo =
    m.matchNo || 1;

  const leftMatchNo =
    (currentMatchNo * 2) - 1;

  const rightMatchNo =
    currentMatchNo * 2;

  const leftMatch =
    allMatches.find(
      (x) =>
        x.Stage ===
          `Round ${prevRound}` &&
        x.matchNo === leftMatchNo
    );

  const rightMatch =
    allMatches.find(
      (x) =>
        x.Stage ===
          `Round ${prevRound}` &&
        x.matchNo === rightMatchNo
    );

  return [
    ...getPlayers(
      leftMatch,
      allMatches
    ),
    ...getPlayers(
      rightMatch,
      allMatches
    ),
  ];
};

/* ================= DRAG CARD ================= */

function DraggableMatch({
  match,
  time,
  allMatchesRef,
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
    // NORMAL TEAM
    if (team?.partner1?.name) {
      return `${team.partner1?.name || ""}
      ${
        team.partner2
          ? " & " +
            team.partner2?.name
          : ""
      }`;
    }

    const roundNumber = Number(
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

    const leftPrevMatch =
      allMatchesRef.current.find(
        (m) =>
          m.Stage ===
            `Round ${prevRound}` &&
          m.matchNo === leftMatch
      );

    const rightPrevMatch =
      allMatchesRef.current.find(
        (m) =>
          m.Stage ===
            `Round ${prevRound}` &&
          m.matchNo === rightMatch
      );

    const getAutoWinner = (m) => {
      if (!m) return null;

      const team1Exists =
        m.Team1?.partner1?.name;

      const team2Exists =
        m.Team2?.partner1?.name;

      // Team1 vs TBD
      if (
        team1Exists &&
        !team2Exists
      ) {
        return `${m.Team1.partner1?.name}
        ${
          m.Team1.partner2
            ? " & " +
              m.Team1.partner2?.name
            : ""
        }`;
      }

      // TBD vs Team2
      if (
        !team1Exists &&
        team2Exists
      ) {
        return `${m.Team2.partner1?.name}
        ${
          m.Team2.partner2
            ? " & " +
              m.Team2.partner2?.name
            : ""
        }`;
      }

      return null;
    };

    // LEFT SIDE
    if (side === 1) {
      const autoWinner =
        getAutoWinner(
          leftPrevMatch
        );

      if (autoWinner) {
        return autoWinner;
      }

      return `R${prevRound} M${leftMatch} Winner`;
    }

    // RIGHT SIDE
    const autoWinner =
      getAutoWinner(
        rightPrevMatch
      );

    if (autoWinner) {
      return autoWinner;
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
  ] = useState([
    "Cat.B(85+ combined)",
  ]);

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
    matchesPerCourt,
    setMatchesPerCourt,
  ] = useState({
    1: 10,
    2: 10,
    3: 10,
    4: 10,
  });

  const allMatchesRef =
    useRef([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      fetchData();
    }
  }, [events]);

  const fetchEvents =
    async () => {
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
      }
    };

  /* ================= FETCH DATA ================= */

  const fetchData =
    async () => {
      setGrid([]);

      try {
        const filteredEvents =
          selectedCategories.length >
          0
            ? events.filter((ev) =>
                selectedCategories.includes(
                  ev.name
                )
              )
            : events;

        const allResponses =
          await Promise.all(
            filteredEvents.map(
              (ev) =>
                axios.get(
                  `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${ev._id}`,
                  {
                    withCredentials: true,
                  }
                )
            )
          );

        let allMatches = [];

        const allowedRounds =
          selectedRounds.map(
            (r) =>
              r
                .trim()
                .toLowerCase()
          );

        allResponses.forEach(
          (res, index) => {
            const ev =
              filteredEvents[
                index
              ];

            const matches =
              res.data.data || [];

            const filteredMatches =
              matches.filter((m) =>
                allowedRounds.includes(
                  (
                    m.Stage || ""
                  )
                    .trim()
                    .toLowerCase()
                )
              );

            const roundCounters =
              {};

            const matchesWithData =
              filteredMatches.map(
                (m) => {
                  const stage =
                    (
                      m.Stage ||
                      "Round 1"
                    ).trim();

                  if (
                    !roundCounters[
                      stage
                    ]
                  ) {
                    roundCounters[
                      stage
                    ] = 1;
                  }

                  const currentMatchNo =
                    roundCounters[
                      stage
                    ]++;

                  return {
                    ...m,
                    category:
                      ev.name,
                    matchNo:
                      currentMatchNo,
                  };
                }
              );

            allMatches.push(
              ...matchesWithData
            );
          }
        );

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
              (roundOrder[
                a.Stage
              ] || 99) -
              (roundOrder[
                b.Stage
              ] || 99);

            if (
              roundDiff !== 0
            )
              return roundDiff;

            return (
              (a.matchNo ||
                0) -
              (b.matchNo ||
                0)
            );
          }
        );

        allMatchesRef.current =
          allMatches;

        buildGrid(allMatches);
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
        row.push({
          match: null,
          time: getTimeLabel(i),
          court: j + 1,
        });
      }

      temp.push(row);
    }

    const timeSlotPlayers =
      {};

    matches.forEach((match) => {
      const players =
        getPlayers(
          match,
          matches
        );

      let placed = false;

      for (
        let i = 0;
        i < maxRows;
        i++
      ) {
        const time =
          getTimeLabel(i);

        if (
          !timeSlotPlayers[
            time
          ]
        ) {
          timeSlotPlayers[
            time
          ] = new Set();
        }

        const sameTimeConflict =
          players.some((p) =>
            timeSlotPlayers[
              time
            ].has(p)
          );

        if (
          sameTimeConflict
        ) {
          continue;
        }

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
            i >=
            allowedMatches
          ) {
            continue;
          }

          if (
            temp[i][j]
              .match
          ) {
            continue;
          }

          let consecutiveConflict =
            false;

          if (i > 0) {
            for (
              let prevCourt = 0;
              prevCourt <
              courtCount;
              prevCourt++
            ) {
              const prevMatch =
                temp[
                  i - 1
                ][prevCourt]
                  .match;

              if (!prevMatch)
                continue;

              const prevPlayers =
                getPlayers(
                  prevMatch,
                  matches
                );

              const samePlayer =
                players.some(
                  (p) =>
                    prevPlayers.includes(
                      p
                    )
                );

              if (
                samePlayer &&
                prevCourt !==
                  j
              ) {
                consecutiveConflict = true;

                break;
              }
            }
          }

          if (
            consecutiveConflict
          ) {
            continue;
          }

          temp[i][j].match =
            match;

          players.forEach((p) =>
            timeSlotPlayers[
              time
            ].add(p)
          );

          placed = true;

          break;
        }

        if (placed) {
          break;
        }
      }
    });

    setGrid(temp);
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        style={{
          display: "grid",
          gridTemplateColumns:
            `repeat(${courtCount},1fr)`,
          gap: "20px",
        }}
      >
        {Array.from({
          length: courtCount,
        }).map((_, index) => (
          <div key={index}>
            COURT {index + 1}
          </div>
        ))}
      </div>

      <DndContext
        collisionDetection={
          closestCenter
        }
      >
        {grid.map(
          (row, i) => (
            <div
              key={i}
              className={
                styles.row
              }
              style={{
                display: "grid",
                gridTemplateColumns:
                  `repeat(${courtCount},1fr)`,
                gap: "20px",
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
                          cell.time
                        }
                        allMatchesRef={
                          allMatchesRef
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
    </div>
  );
}