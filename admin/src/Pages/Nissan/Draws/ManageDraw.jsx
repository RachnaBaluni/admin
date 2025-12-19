import React, { useState, useEffect } from "react";
import api from "../../../api";
import styles from "./ManageDraw.module.css";
import { toast } from "sonner";
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
  useSensors,
  useSensor,
} from "@dnd-kit/core";
import { TouchSensor, PointerSensor } from "@dnd-kit/core";

const Match = ({
  team,
  isWinnerSlot = false,
  roundIndex,
  matchId,
  slotType,
}) => {
  let teamDisplayName;
  if (isWinnerSlot) {
    teamDisplayName = "Winner";
  } else if (!team) {
    teamDisplayName = roundIndex === 0 ? "BYE" : "TBD";
  } else {
    teamDisplayName = `${team.partner1?.name || "Unknown"} ${
      team.partner2 ? `& ${team.partner2?.name || "Unknown"}` : ""
    }`;
  }

  const id = `${matchId}-${slotType}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
      data: { team, matchId, roundIndex, slotType },
      disabled: !team && roundIndex !== 0, // Disable dragging for TBD slots (except BYE in Stage 1)
    });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: id,
    data: { team, matchId, roundIndex, slotType },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isDraggable = !(!team && roundIndex !== 0); // Re-evaluate the draggable condition for clarity

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDroppableNodeRef(node);
      }}
      style={style}
      className={`${styles.matchSlot} ${isDragging ? styles.dragging : ""} ${
        isOver ? styles.over : ""
      } ${isDraggable ? styles.draggableSlot : ""}`} // Add new class for draggable slots
      {...listeners}
      {...attributes}
    >
      <div className={styles.teamName}>{teamDisplayName}</div>
      {isDraggable && <span className={styles.dragHandle}>⠿</span>}{" "}
      {/* Drag icon */}
    </div>
  );
};

const Round = ({
  title,
  matches,
  roundIndex,
  totalRounds,
  onUpdateTime,
  onUpdateCourt,
}) => {
  const isLastRound = roundIndex === totalRounds - 1;

  return (
    <div className={styles.roundContainer}>
      <h2 className={styles.roundTitle}>{title}</h2>
      <div className={styles.matchesContainer}>
        {matches.map((match, matchIndex) => (
          <React.Fragment
            key={match._id || `match-${roundIndex}-${matchIndex}`}
          >
            <div className={styles.matchPair}>
              <div className={styles.matchNumber}>
                Match {match.Match_number}
              </div>
              <div className={styles.matchMeta}>
                <input
                  type="time"
                  value={match.MatchTime || ""}
                  className={styles.timeInput}
                  onChange={(e) =>
                    onUpdateTime(match._id, e.target.value)
                  }
                />

                <select
                  value={match.CourtNumber || ""}
                  className={styles.courtSelect}
                  onChange={(e) =>
                    onUpdateCourt(match._id, Number(e.target.value))
                  }
                >
                  <option value="">Court</option>
                  {[1, 2, 3, 4].map((court) => (
                    <option key={court} value={court}>
                      Court {court}
                    </option>
                  ))}
                </select>
              </div>

              <Match
                team={match.Team1}
                roundIndex={roundIndex}
                matchId={match._id}
                slotType="Team1"
              />
              <Match
                team={match.Team2}
                roundIndex={roundIndex}
                matchId={match._id}
                slotType="Team2"
              />
            </div>
            {!isLastRound && <div className={styles.connectorLine}></div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const ManageDraw = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDraws = async () => {
    if (selectedEvent) {
      setLoading(true);
      try {
        const drawsRes = await api.get(
          `${
            import.meta.env.VITE_APP_BACKEND_URL
          }/api/nissan-draws/${selectedEvent}`,
          { withCredentials: true }
        );
        setDraws(drawsRes.data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching data.");
        console.error("Error fetching data:", error);
        setDraws([]);
      }
      setLoading(false);
    }
  };


// =====================
// UPDATE MATCH TIME
// =====================
const updateMatchTime = async (drawId, matchTime) => {
  // optimistic UI update
  setDraws((prev) =>
    prev.map((draw) =>
      draw._id === drawId
        ? { ...draw, MatchTime: matchTime }
        : draw
    )
  );

  try {
    await api.post(
      `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/updateTime/${drawId}`,
      { matchTime },
      { withCredentials: true }
    );
  } catch (error) {
    toast.error("Failed to update match time");
  }
};

// =====================
// UPDATE COURT NUMBER
// =====================
const updateMatchCourt = async (drawId, matchCourt) => {
  setDraws((prev) =>
    prev.map((draw) =>
      draw._id === drawId
        ? { ...draw, CourtNumber: matchCourt }
        : draw
    )
  );

  try {
    await api.post(
      `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/updateCourt/${drawId}`,
      { matchCourt },
      { withCredentials: true }
    );
  } catch (error) {
    toast.error("Failed to update court number");
  }
};


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`,
          {
            withCredentials: true,
          }
        );
        setEvents(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedEvent(res.data.data[0]._id);
        }
      } catch (error) {
        toast.error("Error fetching events.");
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchDraws();
  }, [selectedEvent]);

  const handleCreateDraws = async () => {
    if (selectedEvent) {
      setLoading(true);
      try {
        await api.post(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/`,
          { eventId: selectedEvent },
          { withCredentials: true }
        );
        toast.success("Draws created/reset successfully!");
        fetchDraws();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to create/reset draws."
        );
        console.error("Error creating draws:", error);
      }
      setLoading(false);
    }
  };

  const handleDeleteDraws = async () => {
    if (selectedEvent && draws.length > 0) {
      setLoading(true);
      try {
        for (const draw of draws) {
          await api.delete(
            `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${
              draw._id
            }`,
            { withCredentials: true }
          );
        }
        setDraws([]);
        toast.success("All draws for this event deleted successfully!");
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete draws.");
        console.error("Error deleting draws:", error);
      }
      setLoading(false);
    }
  };

  const buildRounds = (draws) => {
    if (!draws || draws.length === 0) return [];

    const roundsData = draws.reduce((acc, draw) => {
      const { Stage } = draw;
      if (!acc[Stage]) {
        acc[Stage] = [];
      }
      acc[Stage].push(draw);
      return acc;
    }, {});

    return Object.entries(roundsData)
      .sort(([stageA], [stageB]) => {
        const numA = parseInt(stageA.split(" ")[1] || 0);
        const numB = parseInt(stageB.split(" ")[1] || 0);
        return numA - numB;
      })
      .map(([stage, matches]) => ({
        title: stage,
        matches: matches.sort((a, b) => a.Match_number - b.Match_number),
      }));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const draggedTeam = active.data.current.team;
    const sourceMatchId = active.data.current.matchId;
    const sourceSlotType = active.data.current.slotType;
    const sourceRoundIndex = active.data.current.roundIndex;

    const targetMatchId = over.data.current.matchId;
    const targetSlotType = over.data.current.slotType;
    const targetRoundIndex = over.data.current.roundIndex;

    if (sourceMatchId === targetMatchId) {
      toast.error("Cannot swap within the same matchup.");
      return;
    }

    if (sourceRoundIndex !== targetRoundIndex) {
      toast.error("Cannot swap teams between different stages.");
      return;
    }

    // Find the original source and target draws from the current state (before setDraws)
    const currentDraws = draws; // Use the state variable directly
    const originalSourceDraw = currentDraws.find(
      (draw) => draw._id === sourceMatchId
    );
    const originalTargetDraw = currentDraws.find(
      (draw) => draw._id === targetMatchId
    );

    if (!originalSourceDraw || !originalTargetDraw) {
      console.error("Original source or target draw not found.");
      return;
    }

    const originalTargetTeam = originalTargetDraw[targetSlotType]; // Team originally in the target slot

    setDraws((prevDraws) => {
      const newDraws = prevDraws.map((draw) => {
        if (draw._id === sourceMatchId) {
          const newSourceSlotValue = originalTargetTeam
            ? originalTargetTeam
            : null;
          return { ...draw, [sourceSlotType]: newSourceSlotValue };
        } else if (draw._id === targetMatchId) {
          return { ...draw, [targetSlotType]: draggedTeam };
        }
        return draw;
      });

      return newDraws;
    });

    // Make API call to save the changes
    try {
      await api.put(
        `${
          import.meta.env.VITE_APP_BACKEND_URL
        }/api/nissan-draws/swap-matchup/`,
        {
          sourceMatchId,
          sourceSlotType,
          targetMatchId,
          targetSlotType,
          draggedTeamId: draggedTeam ? draggedTeam._id : null,
          originalTargetTeamId: originalTargetTeam
            ? originalTargetTeam._id
            : null,
        },
        { withCredentials: true }
      );
      toast.success("Draw updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update draw.");
      console.error("Error updating draw:", error);
      // Optionally, revert the UI state if the API call fails
      // setDraws(prevDraws); // This would require storing the prevDraws before setDraws
    }
  };

  const rounds = buildRounds(draws);
  const totalRounds = rounds.length;

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  return (
    <div className={styles.manageDrawContainer}>
      <h1>Manage Draws</h1>
      <div className={styles.eventFilterButtons}>
        {events.map((event) => (
          <button
            key={event._id}
            className={`${styles.filterButton} ${
              selectedEvent === event._id ? styles.active : ""
            }`}
            onClick={() => setSelectedEvent(event._id)}
          >
            {event.name}
          </button>
        ))}
      </div>
      <div className={styles.controls}>
        <button
          onClick={handleCreateDraws}
          className={styles.drawButton}
          disabled={loading || !selectedEvent}
        >
          {loading
            ? "Loading..."
            : draws.length > 0
            ? "Reset Draws"
            : "Create Draws"}
        </button>
        {draws.length > 0 && (
          <button
            onClick={handleDeleteDraws}
            className={styles.deleteDrawButton}
            disabled={loading || !selectedEvent}
          >
            Delete All Draws
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading draws...</p> // Or a spinner component
      ) : draws.length === 0 ? (
        <p>
          No draws made for this event yet. Create new draws to get started!
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
        >
          <div className={styles.bracketContainer}>
            {rounds.map((round, roundIndex) => (
              <Round
                key={round.title}
                title={round.title}
                matches={round.matches}
                roundIndex={roundIndex}
                totalRounds={totalRounds}
                onUpdateTime={updateMatchTime}
                onUpdateCourt={updateMatchCourt}
              />

            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default ManageDraw;
