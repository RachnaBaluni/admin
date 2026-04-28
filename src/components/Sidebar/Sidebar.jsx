import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";
import {
  FiGrid,
  FiCalendar,
  FiUsers,
  FiUser,
  FiSettings,
  FiCheckCircle,
  FiX,
  FiChevronDown,
  FiBarChart2,
  FiGitMerge,
  FiClipboard,
  FiEdit,
} from "react-icons/fi";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [isNissanOpen, setIsNissanOpen] = useState(false);
  const location = useLocation();

  const isNissanActive = location.pathname.startsWith("/nissan");

  const toggleNissanMenu = () => {
    setIsNissanOpen(!isNissanOpen);
  };

  return (
    <div
      className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
    >
      <div className={styles.logo}>
        <h2>UTA Admin</h2>
        <button onClick={toggleSidebar} className={styles.closeButton}>
          <FiX />
        </button>
      </div>
      <ul>
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? styles.active : "")}
            onClick={toggleSidebar}
          >
            <FiGrid className={styles.icon} /> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/events"
            className={({ isActive }) => (isActive ? styles.active : "")}
            onClick={toggleSidebar}
          >
            <FiCalendar className={styles.icon} /> Main Events
          </NavLink>
        </li>
        <li className={styles.collapsible}>
          <div
            className={`${styles.collapsibleHeader} ${
              isNissanActive ? styles.active : ""
            }`}
            onClick={toggleNissanMenu}
          >
            <FiCalendar className={styles.icon} />
            <span>Nissan Tournament</span>
            <FiChevronDown
              className={`${styles.chevron} ${
                isNissanOpen ? styles.rotate : ""
              }`}
            />
          </div>
          {isNissanOpen && (
            <ul className={styles.submenu}>
              <li>
                <NavLink
                  to="/nissan/update-team-ranking"
                  className={({ isActive }) => (isActive ? styles.active : "")}
                  onClick={toggleSidebar}
                >
                  <FiBarChart2 className={styles.icon} /> Update Team Ranking
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/nissan/view-player-list"
                  className={({ isActive }) => (isActive ? styles.active : "")}
                  onClick={toggleSidebar}
                >
                  <FiUsers className={styles.icon} /> View Player List
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/nissan/view-player-journey"
                  className={({ isActive }) => (isActive ? styles.active : "")}
                  onClick={toggleSidebar}
                >
                  <FiUsers className={styles.icon} /> View Player Journey
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/nissan/manage-draw"
                  className={({ isActive }) => (isActive ? styles.active : "")}
                  onClick={toggleSidebar}
                >
                  <FiGitMerge className={styles.icon} /> Manage Draw
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/nissan/manage-result"
                  className={({ isActive }) => (isActive ? styles.active : "")}
                  onClick={toggleSidebar}
                >
                  <FiClipboard className={styles.icon} /> Manage Result
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/nissan/update-events"
                  className={({ isActive }) => (isActive ? styles.active : "")}
                  onClick={toggleSidebar}
                >
                  <FiEdit className={styles.icon} /> Update Events
                </NavLink>
              </li>
            </ul>
          )}
        </li>
        <li>
          <NavLink
            to="/members"
            className={({ isActive }) => (isActive ? styles.active : "")}
            onClick={toggleSidebar}
          >
            <FiUsers className={styles.icon} /> Members
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/approvals"
            className={({ isActive }) => (isActive ? styles.active : "")}
            onClick={toggleSidebar}
          >
            <FiCheckCircle className={styles.icon} /> Approvals
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/users"
            className={({ isActive }) => (isActive ? styles.active : "")}
            onClick={toggleSidebar}
          >
            <FiUser className={styles.icon} /> Users
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? styles.active : "")}
            onClick={toggleSidebar}
          >
            <FiSettings className={styles.icon} /> Settings
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
