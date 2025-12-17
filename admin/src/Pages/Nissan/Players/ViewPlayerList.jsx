import React, { useState, useEffect } from "react";
import api from "../../../api";
import styles from "./ViewPlayerList.module.css";
import { FiTrash2 } from "react-icons/fi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const ViewPlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/player/details`,
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


  const handleExportExcel = () => {
    const formattedData = players.map((player, index) => ({
      "S.No": index + 1,
      Name: player.name,
      "Event 1": player.event1 || "N/A",
      "Event 1 Partner": player.event1Partner || "N/A",
      "Event 2": player.event2 || "N/A",
      "Event 2 Partner": player.event2Partner || "N/A",
      "Whatsapp Number": player.whatsappNumber,
      DOB: new Date(player.dob).toLocaleDateString(),
      City: player.city,
      "Shirt Size": player.shirtSize,
      Food: player.foodPref,
      Stay: player.stay ? "Yes" : "No",
      "Fee Paid (User)": player.feePaid ? "Yes" : "No",
      "Fee Paid (Admin)": player.feePaidAdmin ? "Yes" : "No",
      "Transaction Id":
        player.transactionDetails || "No Transaction Id Provided",
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Players");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(data, "Player_List.xlsx");
  };


  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleToggleFeeStatus = async (playerId) => {
    try {
      await api.put(
        `${
          import.meta.env.VITE_APP_BACKEND_URL
        }/api/player/toggle-fee/${playerId}`,
        {},
        { withCredentials: true }
      );
      fetchPlayers();
    } catch (error) {
      console.error("Error toggling fee status:", error);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (window.confirm("Are you sure you want to delete this player?")) {
      try {
        await api.delete(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/player/${playerId}`,
          {
            withCredentials: true,
          }
        );
        fetchPlayers();
      } catch (error) {
        console.error("Error deleting player:", error);
      }
    }
  };

  const totalPlayers = players.length;
  const feePaidPlayers = players.filter((p) => p.feePaidAdmin).length;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.playerList}>
      <h1>Player List</h1>
      <div className={styles.stats}>
        <p>Total Players: {totalPlayers}</p>
        <p>Fee Paid: {feePaidPlayers}</p>

        <button
          className={styles.exportButton}
          onClick={handleExportExcel}
        >
          Export to Excel
      </button>

      
      </div>
      

      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>S.no</th>
              <th>Name</th>
              <th>Event 1</th>
              <th>Event 1 Partner</th>
              <th>Event 2</th>
              <th>Event 2 Partner</th>
              <th>Whatsapp Number</th>
              <th>DOB</th>
              <th>City</th>
              <th>Shirt Size</th>
              {/* <th>Short Size</th> */}
              <th>Food</th>
              <th>Stay</th>
              <th>Fee Paid</th>
              <th>Transaction Id</th>
              <th>Fee Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player._id}>
                <td data-label="S.no">{index + 1}</td>
                <td data-label="Name">{player.name}</td>
                <td data-label="Event 1">{player.event1 || "N/A"}</td>
                <td data-label="Event 1 Partner">
                  {player.event1Partner || "N/A"}
                </td>
                <td data-label="Event 2">{player.event2 || "N/A"}</td>
                <td data-label="Event 2 Partner">
                  {player.event2Partner || "N/A"}
                </td>
                <td data-label="Whatsapp Number">{player.whatsappNumber}</td>
                <td data-label="DOB">
                  {new Date(player.dob).toLocaleDateString()}
                </td>
                <td data-label="City">{player.city}</td>
                <td data-label="Shirt Size">{player.shirtSize}</td>
                {/* <td data-label="Short Size">{player.shortSize}</td> */}
                <td data-label="Food">{player.foodPref}</td>
                <td data-label="Stay">{player.stay ? "Yes" : "No"}</td>
                <td data-label="Fee Paid">{player.feePaid ? "Yes" : "No"}</td>
                <td data-label="Transaction Id">
                  {player.transactionDetails || "No Transaction Id Provided"}
                </td>
                <td data-label="Fee Status">
                  <button
                    className={`${styles.statusButton} ${
                      player.feePaidAdmin ? styles.paid : styles.unpaid
                    }`}
                    onClick={() => handleToggleFeeStatus(player._id)}
                  >
                    {player.feePaidAdmin ? "Paid" : "Unpaid"}
                  </button>
                </td>
                <td data-label="Action">
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeletePlayer(player._id)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewPlayerList;
