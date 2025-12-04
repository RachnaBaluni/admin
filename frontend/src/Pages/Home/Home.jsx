import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";
import ListItem from "../../Components/ListItem.jsx/ListItem";
import axios from "axios";

// Import icons from react-icons
import {
  FaUser,
  FaChalkboardTeacher,
  FaBuilding,
  FaMapMarkerAlt,
  FaEnvelope, // Added for email icon
  FaBriefcase, // Added for position icon
  FaUserCircle, // Added for a generic person icon
} from "react-icons/fa"; // Make sure to import the new icons

const Home = () => {
  const [events, setEvents] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState("");

  const backgroundImages = ["/banner.jpg", "/bannerHome.jpg", "/img1.jpg"];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/main-events`
        );
        setEvents(response.data.data.slice(0, 3)); // Get first 3 events
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    const setRandomBackgroundImage = () => {
      const randomImage =
        backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
      setBackgroundImage(`url(${randomImage})`);
    };

    fetchEvents();
    setRandomBackgroundImage();
  }, []);
  // Data for Key Personnel
  const keyPersonnel = [
    {
      name: "Ashok Kumar",
      position: "President",
      contact: "ashokkumar@bccinfra.com",
    },
    {
      name: "Sumit Goel",
      position: "Secretary",
      contact: "goelsumit3@rediffmail.com",
    },
    {
      name: "Dinesh Nagpal",
      position: "Treasurer",
      contact: "dineshnagpal@yahoo.com",
    },
  ];

  return (
    <div>
      <main>
        <div
          className={styles.homeBanner}
          style={{ backgroundImage: backgroundImage }}
        >
          <h1>Welcome to Uttaranchal Tennis Association</h1>
          <p>Promoting tennis excellence in the heart of the Himalayas.</p>
          <Link to="/tournaments">Explore Tournaments</Link>
        </div>

        {/* <section className={styles.upcomingEvents}>
          <div className={styles.upcomingEventsHeader}>
            <h2>Upcoming Events</h2>
          </div>
          <div className={styles.upcomingEventsListContainer}>
            {events.map((event, index) => (
              <ListItem
                key={event._id}
                heading={event.name}
                description={event.description}
                imageurl={`/img${index + 1}.jpg`}
              />
            ))}
          </div>
        </section> */}

        {/* New Section: Home Grid Section */}
        <section className={styles.homeGridSection}>
          <h2 className={styles.homeGridSectionTitle}>Join Our Community</h2>{" "}
          <div className={styles.gridContainer}>
            <div className={styles.gridItem}>
              <FaUser className={styles.gridIcon} />
              <h3>Players</h3>
              <p>Become a member and compete in a tournament</p>
            </div>
            <div className={styles.gridItem}>
              <FaChalkboardTeacher className={styles.gridIcon} />
              <h3>Coaches</h3>
              <p>Get Certified and coach aspiring players</p>
            </div>
            <div className={styles.gridItem}>
              <FaBuilding className={styles.gridIcon} />
              <h3>Academies</h3>
              <p>Affiliate your Academy with us</p>
            </div>
            <div className={styles.gridItem}>
              <FaMapMarkerAlt className={styles.gridIcon} />
              <h3>Districts</h3>
              <p>Represent your District in state events</p>
            </div>
          </div>
          <Link to="/joinUs">Join Us Now</Link>{" "}
        </section>

        {/* REPLACED: Key Personnel Section (from Table to Cards) */}
        <section className={styles.keyPersonnelSection}>
          <h2 className={styles.keyPersonnelTitle}>Key Personnel</h2>
          <div className={styles.personnelCardsContainer}>
            {" "}
            {/* New container for cards */}
            {keyPersonnel.map((person, index) => (
              <div key={index} className={styles.personnelCard}>
                {" "}
                {/* Individual card */}
                <FaUserCircle className={styles.personnelIcon} />{" "}
                {/* Icon for person */}
                <h3>{person.name}</h3>
                <p className={styles.personnelPosition}>
                  <FaBriefcase className={styles.detailIcon} />{" "}
                  {person.position}
                </p>
                <p className={styles.personnelContact}>
                  <FaEnvelope className={styles.detailIcon} />{" "}
                  <a href={`mailto:${person.contact}`}>{person.contact}</a>
                </p>
              </div>
            ))}
          </div>
        </section>
        {/* END REPLACED SECTION */}
      </main>
    </div>
  );
};

export default Home;
