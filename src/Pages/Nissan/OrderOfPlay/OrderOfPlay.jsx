import React, { useEffect, useState } from "react";
import api from "../../../api";

const OrderOfPlay = () => {
  const [draws, setDraws] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const res = await api.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws`,
        { withCredentials: true }
      );

      const data = res.data.data;

      console.log("TOTAL DRAWS:", data.length);

      // ✅ IMPORTANT FILTER (FIX)
      const round1Matches = data.filter(
        (d) =>
          d.Stage === "Round 1" &&
          d.Team1 &&
          d.Team2
      );

      console.log("VALID ROUND 1:", round1Matches.length);
      console.log("FIRST MATCH:", round1Matches[0]);

      setDraws(data);
      setMatches(round1Matches);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>ORDER OF PLAY (DEBUG)</h1>

      <h3>Total Draws: {draws.length}</h3>
      <h3>Valid Round 1 Matches: {matches.length}</h3>

      <hr />

      {/* SIMPLE LIST (JUST TO SEE DATA) */}
      {matches.map((match, index) => (
        <div
          key={match._id}
          style={{
            border: "1px solid black",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <b>Match {index + 1}</b>
          <br />

          {/* SAFE NAME PRINT */}
          <div>
            {match.Team1?.partner1?.name || "TBD"} &{" "}
            {match.Team1?.partner2?.name || ""}
          </div>

          <b>VS</b>

          <div>
            {match.Team2?.partner1?.name || "TBD"} &{" "}
            {match.Team2?.partner2?.name || ""}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderOfPlay;