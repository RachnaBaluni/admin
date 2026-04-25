import React, { useState, useEffect } from "react";
import api from "../../../api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./UpdateTeamRanking.module.css";
import { FiMove } from "react-icons/fi";

const SortableItem = ({ id, item }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={styles.tableRow}
    >
      <td data-label="Rank">{item.rank}</td>
      <td data-label="Player 1">{item.partner1.name}</td>
      <td data-label="Player 2">
        {item.partner2 ? item.partner2.name : "N/A"}
      </td>
      <td data-label="Drag" {...listeners} className={styles.dragHandle}>
        <FiMove />
      </td>
    </tr>
  );
};

const UpdateTeamRanking = () => {
  const [allTeams, setAllTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchAllTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/team/all`,
        {
          withCredentials: true,
        }
      );
      const teams = res.data.data;
      setAllTeams(teams);
      const uniqueEvents = [
        ...new Set(teams.map((t) => t.eventId.name)),
      ].sort();
      setEvents(uniqueEvents);
      if (uniqueEvents.length > 0) {
        setSelectedEvent(uniqueEvents[0]);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllTeams();
  }, []);

  useEffect(() => {
    const teamsForEvent = allTeams
      .filter((t) => t.eventId.name === selectedEvent)
      .sort((a, b) => a.rank - b.rank);

    let ranksChanged = false;
    const correctedTeams = teamsForEvent.map((team, index) => {
      const newRank = index + 1;
      if (team.rank !== newRank) {
        ranksChanged = true;
      }
      return { ...team, rank: newRank };
    });

    const updateRanks = async (teams) => {
      const orderedTeamIds = teams.map((t) => t._id);
      try {
        await api.put(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/team/update-ranking`,
          { orderedTeams: orderedTeamIds },
          { withCredentials: true }
        );

        // Update the main list to maintain consistency
        const newAllTeams = allTeams.map((team) => {
          const updatedTeam = teams.find((ut) => ut._id === team._id);
          return updatedTeam || team;
        });
        setAllTeams(newAllTeams);
      } catch (error) {
        console.error("Error updating team ranking:", error);
        fetchAllTeams(); // Re-fetch to revert
      }
    };

    if (ranksChanged) {
      setFilteredTeams(correctedTeams);
      updateRanks(correctedTeams);
    } else {
      setFilteredTeams(teamsForEvent);
    }
  }, [selectedEvent, allTeams]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = filteredTeams.findIndex((t) => t._id === active.id);
      const newIndex = filteredTeams.findIndex((t) => t._id === over.id);
      const newFilteredTeams = arrayMove(filteredTeams, oldIndex, newIndex);

      const updatedTeamsWithRanks = newFilteredTeams.map((team, index) => ({
        ...team,
        rank: index + 1,
      }));
      setFilteredTeams(updatedTeamsWithRanks);

      const orderedTeamIds = updatedTeamsWithRanks.map((t) => t._id);
      try {
        await api.put(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/team/update-ranking`,
          { orderedTeams: orderedTeamIds },
          { withCredentials: true }
        );

        // Update the main list to maintain consistency
        const newAllTeams = allTeams.map((team) => {
          const updatedTeam = updatedTeamsWithRanks.find(
            (ut) => ut._id === team._id
          );
          return updatedTeam || team;
        });
        setAllTeams(newAllTeams);
      } catch (error) {
        console.error("Error updating team ranking:", error);
        fetchAllTeams(); // Re-fetch to revert
      }
    }
  };

  return (
    <div className={styles.updateRanking}>
      <h1>Update Team Ranking</h1>
      <div className={styles.filters}>
        {events.map((event) => (
          <button
            key={event}
            className={`${styles.filterButton} ${
              selectedEvent === event ? styles.active : ""
            }`}
            onClick={() => setSelectedEvent(event)}
          >
            {event}
          </button>
        ))}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.tableContainer}>
            <table className={styles.rankingTable}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player 1</th>
                  <th>Player 2</th>
                  <th>Drag</th>
                </tr>
              </thead>
              <SortableContext
                items={filteredTeams.map((t) => t._id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {filteredTeams.map((team) => (
                    <SortableItem key={team._id} id={team._id} item={team} />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default UpdateTeamRanking;
