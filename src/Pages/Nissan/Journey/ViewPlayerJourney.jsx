import React, { useState, useEffect } from "react";
import api from "../../../api";
import styles from "./ViewPlayerList.module.css";

const ViewPlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const viewPlayerJourney = async (playerId, playerName) => {
    try {
      setLoading(true);
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/player/journey/${playerId}`,
        { withCredentials: true }
      );
      setModalData(res.data.data);
      setSelectedPlayer(playerName);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching journey:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/player/details`,
        { withCredentials: true }
      );
      setPlayers(res.data.data);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter((player) =>
    player.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.playerList}>
      <h1>View Player Journey through the Tournament</h1>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by player name..."
          className={styles.searchBar}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.mainTable}>
          <thead>
            <tr>
              <th>S.no</th>
              <th>Name</th>
              <th>Event 1</th>
              <th>Event 1 Partner</th>
              <th>Event 2</th>
              <th>Event 2 Partner</th>
              <th>View Journey</th>
            </tr>
          </thead>

          <tbody>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player, index) => (
                <tr key={player._id}>
                  <td>{index + 1}</td>
                  <td>{player.name}</td>
                  <td>{player.event1 || "N/A"}</td>
                  <td>{player.event1Partner || "N/A"}</td>
                  <td>{player.event2 || "N/A"}</td>
                  <td>{player.event2Partner || "N/A"}</td>
                  <td>
                    <button
                      className={styles.viewButton}
                      onClick={() =>
                        viewPlayerJourney(player._id, player.name)
                      }
                    >
                      View Journey
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No players found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedPlayer}'s Journey</h2>

            <div className={styles.modalTableContainer}>
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Stage</th>
                    <th>Match No.</th>
                    <th>Team</th>
                    <th>Opponent</th>
                    <th>Winner</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {modalData.map((match, index) => (
                    <tr key={index}>
                      <td>{match.Event?.name || "N/A"}</td>
                      <td>{match.Stage || "N/A"}</td>
                      <td>{match.Match_number || "N/A"}</td>
                      <td>
                        {match.Team1?.partner1?.name}
                        {match.Team1?.partner2
                          ? " & " + match.Team1.partner2.name
                          : ""}
                      </td>
                      <td>
                        {match.Team2?.partner1?.name}
                        {match.Team2?.partner2
                          ? " & " + match.Team2.partner2.name
                          : ""}
                      </td>
                      <td>
                        {match.Winner?.partner1?.name || "N/A"}
                      </td>
                      <td>{match.Status || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className={styles.closeButton}
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPlayerList;