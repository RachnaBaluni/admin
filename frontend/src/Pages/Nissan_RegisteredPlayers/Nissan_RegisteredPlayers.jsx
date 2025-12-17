import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./RegisteredPlayers.module.css";
import { Link } from "react-router-dom";
import Header from "../../Components/Header/Header";
import Footer from "../../Components/Footer/Footer";

const RegisteredPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getPlayers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/player/`,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        setPlayers(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEvents = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events/`,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (error) {
      console.log("Error fetching events:", error);
    }
  };

  useEffect(() => {
    getPlayers();
    getEvents();
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (events.length > 0 && selectedEvent === null) {
      setSelectedEvent(events[0]._id);
    }
  }, [events, selectedEvent]);

  /* ============================= */
  /* FILTER + SORT LOGIC           */
  /* ============================= */

  const filteredPlayers = players.filter((player) => {
    const matchesEvent = selectedEvent
      ? player.eventId?._id === selectedEvent
      : true;

    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      player.partner1?.name?.toLowerCase().includes(lowerSearch) ||
      player.partner2?.name?.toLowerCase().includes(lowerSearch) ||
      player.eventId?.name?.toLowerCase().includes(lowerSearch);

    return matchesEvent && matchesSearch;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    // 1️⃣ Complete teams first
    const aComplete = Boolean(a.partner1 && a.partner2);
    const bComplete = Boolean(b.partner1 && b.partner2);

    if (aComplete !== bComplete) {
      return aComplete ? -1 : 1;
    }

    // 2️⃣ Sort by Player 1 name
    const nameA = a.partner1?.name?.toLowerCase() || "";
    const nameB = b.partner1?.name?.toLowerCase() || "";

    return nameA.localeCompare(nameB);
  });

  return (
    <>
      <Header />

      <div className={styles.container}>
        <main className={styles.mainContent}>
          <h2 className={styles.pageTitle}>Registered Teams</h2>

          {/* SEARCH & FILTER */}
          <div className={styles.filtersContainer}>
            <input
              type="text"
              placeholder="Search players or events..."
              className={styles.searchBar}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className={styles.eventFilters}>
              {events.map((event) => (
                <button
                  key={event._id}
                  className={`${styles.filterButton} ${
                    selectedEvent === event._id ? styles.activeFilter : ""
                  }`}
                  onClick={() => setSelectedEvent(event._id)}
                >
                  {event.name}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className={styles.noPlayersMessage}>
              Loading registered players...
            </div>
          ) : sortedPlayers.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.playersTable}>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Player 1</th>
                    <th>Player 2</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player) => (
                    <tr key={player._id}>
                      <td data-label="Event">
                        {player.eventId?.name || "N/A"}
                      </td>
                      <td data-label="Player 1">
                        {player.partner1?.name || "N/A"}
                      </td>
                      <td data-label="Player 2">
                        {player.partner2?.name ||
                          "Partner Not Yet Registered"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noPlayersMessage}>
              No registered players found matching your criteria.
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
};

export default RegisteredPlayers;
