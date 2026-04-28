import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import styles from "./Layout.module.css";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768); // Sidebar open by default on desktop

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) { // Only toggle on mobile
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  return (
    <div className={styles.layout}>
      <Header toggleSidebar={toggleSidebar} />
      <div className={styles.mainContent}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        {window.innerWidth <= 768 && isSidebarOpen && (
          <div className={`${styles.overlay} ${styles.visible}`} onClick={toggleSidebar}></div>
        )}
        <main className={styles.pageContent}>{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;