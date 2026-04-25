import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <button onClick={toggleSidebar} className={styles.menuButton}>
        ☰ {/* Hamburger icon */}
      </button>
      <h1>Admin Panel</h1>
      <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
    </header>
  );
};

export default Header;