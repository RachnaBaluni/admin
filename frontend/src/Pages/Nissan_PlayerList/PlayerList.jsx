import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./ViewPlayerList.module.css";
import Header from "../../Components/Header/Header";
import Footer from "../../Components/Footer/Footer";

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPlayers = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/player/details-frontend`,
        {
          withCredentials: true,
        }
      );
      setPlayers(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching players:", error);
      setLoading(false);
    }
  };

 useEffect(() => {
   console.log("Players after update:", players);
 }, [players]);


  useEffect(() => {
    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter((player) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return (
      (player.name &&
        player.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (player.event1 &&
        player.event1.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (player.event1Partner &&
        player.event1Partner.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (player.event2 &&
        player.event2.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (player.event2Partner &&
        player.event2Partner.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (player.city &&
        player.city.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (player.whatsappNumber &&
        String(player.whatsappNumber).includes(lowerCaseSearchTerm)) ||
      (player.dob &&
        new Date(player.dob).toLocaleDateString().includes(lowerCaseSearchTerm))
    );
  });

  return (
    <>
      <Header />
      <div className={styles.playerList}>
        <h1 className={styles.pageTitle}>Player List</h1>

        {/* --- Loading State Display --- */}
        {loading ? (
          <div className={styles.loadingMessage}>
            <p>Loading player data, please wait...</p>
            {/* You could add a simple spinner animation here for better feedback */}
          </div>
        ) : (
          /* --- Content (Search and Table) --- */
          <>
            <div className={styles.filtersContainer}>
              <input
                type="text"
                placeholder="Search by name, event, city, or number..."
                className={styles.searchBar}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredPlayers.length === 0 ? (
              <p className={styles.noPlayersMessage}>
                {searchTerm
                  ? `No players found matching "${searchTerm}".`
                  : "No players found."}
              </p>
            ) : (
              <div className={styles.playersTable}>
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Name</th>
                      <th>Event 1</th>
                      <th>Event 1 Partner</th>
                      <th>Event 2</th>
                      <th>Event 2 Partner</th>
                      <th>Whatsapp Number</th>
                      <th>Year Of Birth</th>
                      <th>City</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player, index) => (
                      <tr key={player.name + index}>
                        <td data-label="S.No">{index + 1}</td>
                        <td data-label="Name">{player.name || "N/A"}</td>
                        <td data-label="Event 1">{player.event1 || "N/A"}</td>
                        <td data-label="Event 1 Partner">
                          {player.event1Partner || "N/A"}
                        </td>
                        <td data-label="Event 2">{player.event2 || "N/A"}</td>
                        <td data-label="Event 2 Partner">
                          {player.event2Partner || "N/A"}
                        </td>
                        <td data-label="Whatsapp Number">
                          {player.whatsappNumber || "N/A"}
                        </td>
                        <td data-label="Date Of Birth">
                          {player.dob ? player.dob : "N/A"}
                        </td>
                        <td data-label="City">{player.city || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PlayerList;
