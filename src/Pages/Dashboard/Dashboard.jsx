import React, { useEffect, useState } from "react";
import api from "../../api";
import styles from "./Dashboard.module.css";
import { FiCalendar, FiUsers, FiUser, FiAward, FiMapPin } from "react-icons/fi";

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState({
    players: [],
    coaches: [],
    academies: [],
    districts: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, membersRes] = await Promise.all([
          api.get(`${import.meta.env.VITE_APP_BACKEND_URL}/api/events`, {
            withCredentials: true,
          }),
          api.get(`${import.meta.env.VITE_APP_BACKEND_URL}/api/member/all`, {
            withCredentials: true,
          }),
        ]);
        setEvents(eventsRes.data.data);
        setMembers(membersRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <FiCalendar className={styles.icon} />
          <div className={styles.statInfo}>
            <h3>Total Events</h3>
            <p>{events.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <FiUsers className={styles.icon} />
          <div className={styles.statInfo}>
            <h3>Total Players</h3>
            <p>{members.players.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <FiUser className={styles.icon} />
          <div className={styles.statInfo}>
            <h3>Total Coaches</h3>
            <p>{members.coaches.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <FiAward className={styles.icon} />
          <div className={styles.statInfo}>
            <h3>Total Academies</h3>
            <p>{members.academies.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <FiMapPin className={styles.icon} />
          <div className={styles.statInfo}>
            <h3>Total Districts</h3>
            <p>{members.districts.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
