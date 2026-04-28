// Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./Home.module.css"; // Import CSS module
import Header from "../../Components/Header/Header";
import Footer from "../../Components/Footer/Footer";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // State for mobile menu
  const [tournamentDetail, setTournamentDetail] = useState([]);
  const [pricesBenefit, setpricesBenefit] = useState([]);
  const [venue, setvenue] = useState([]);
  // Function to fetch events from the backend
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

  const getTournamentDetail = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/tournament-details/`,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        setTournamentDetail(res.data.data);
      }
    } catch (error) {
      console.log("Error fetching events:", error);
    }
  };

  const getPricesBenifit = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/prices-benifit/`,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        setpricesBenefit(res.data.data);
      }
    } catch (error) {
      console.log("Error fetching events:", error);
    }
  };

  const getvenue = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/venue/`,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        setvenue(res.data.data);
      }
    } catch (error) {
      console.log("Error fetching events:", error);
    }
  };

  // Function for smooth scrolling
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false); // Close mobile menu after clicking a link
  };

  // Effect hook to fetch events on component mount and scroll to top
  useEffect(() => {
    getEvents();
    getTournamentDetail();
    getPricesBenifit();
    getvenue();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.homeContainer}>
      {/* Header Section */}
      <Header />

      {/* <header className={styles.header}>
        <div className={styles.headerLogoGroup}>
          <div className={styles.logoIcon}>
            <img src="/logo.png" alt="UTA LOGO" />
          </div>
          <h2 className={styles.headerTitle}>Uttaranchal Tennis Association</h2>
        </div>
        <div className={styles.headerNavActions}>
          <div className={styles.navbarNav}>
            <a
              className={styles.navLink}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("top");
              }}
            >
              Home
            </a>
            <a
              className={styles.navLink}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("eventDetails");
              }}
            >
              Events
            </a>
            <a
              className={styles.navLink}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("contactInfo");
              }}
            >
              Contact
            </a>
            <a className={styles.navLink} href="/Nissan/registered-players">
              Registered Players
            </a>
          </div>
          <div className={styles.headerButtons}>
            <Link
              to="/Nissan/register" // Assuming a registration route
              className={styles.registerButton}
            >
              <span className={styles.buttonText}>Register Now</span>
            </Link>
            <Link
              to="/Nissan/login" // Assuming a login route
              className={styles.loginButton}
            >
              <span className={styles.buttonText}>Login</span>
            </Link>
          </div>
        </div>

        <div className={styles.mobileMenuIcon}>
          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className={styles.mobileMenuSvg}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
      </header> */}

      {/* Mobile Navigation Overlay */}
      {/* <div
        className={`${styles.mobileNavOverlay} ${
          mobileMenuOpen ? styles.mobileNavOpen : ""
        }`}
      >
        <div className={styles.mobileNavHeader}>
          <h2 className={styles.headerTitle}>Uttranchal Tennis Association</h2>
          <button
            className={styles.mobileCloseButton}
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg
              className={styles.mobileMenuSvg}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div className={styles.mobileNavLinks}>
          <a
            className={styles.navLink}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("top");
            }}
          >
            Home
          </a>
          <a className={styles.navLink} href="#" onClick={() => scrollToSection("aboutSectionId")}>About</a>
          <a
            className={styles.navLink}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("eventDetails");
            }}
          >
            Events
          </a>
          <a
            className={styles.navLink}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contactInfo");
            }}
          >
            Contact
          </a>
          <a className={styles.navLink} href="/Nissan/registered-players">
            Registered Players
          </a>
        </div>
        <div className={styles.mobileNavButtons}>
          <Link
            to="/Nissan/register"
            className={styles.registerButton}
            onClick={() => setMobileMenuOpen(false)} // Close menu on navigation
          >
            <span className={styles.buttonText}>Register Now</span>
          </Link>
          <Link
            to="/Nissan/login"
            className={styles.loginButton}
            onClick={() => setMobileMenuOpen(false)} // Close menu on navigation
          >
            <span className={styles.buttonText}>Login</span>
          </Link>
        </div>
      </div> */}

      {/* Main Content Sections (Tiles) */}
      <main className={styles.mainContent}>
        {/* Banner Section */}
        <section className={styles.bannerSection} id="top">
          {" "}
          {/* Added id="top" for Home link */}
          <div className={styles.bannerContainer}>
            <div className={styles.bannerPadding}>
              <div
                className={styles.bannerContent}
                style={{
                  backgroundImage: `url('/banner.webp')`, // Correct path for banner image
                }}
              >
                <div className={styles.bannerOverlay}></div>{" "}
                {/* Added for dark overlay */}
                <div className={styles.bannerTextGroup}>
                  <h1 className={styles.bannerTitle}>
                    {/* All India Open Seniors Tennis Tournament 2025, Dehradun */}
                    Indian Tree Open Masters Tennis Tournament 2025, dehradun
                  </h1>
                  <h2 className={styles.bannerSubtitle}>
                    Dates : 20th and 21st December
                  </h2>
                </div>
                <div className={styles.bannerButtons}>
                  <Link
                    to="/tournaments/register"
                    className={styles.registerButton}
                  >
                    <span className={styles.buttonText}>Register Now</span>
                  </Link>
                  <Link to="/tournaments/login" className={styles.loginButton}>
                    <span className={styles.buttonText}>Login</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Ready to Participate Section */}
        <section className={`${styles.ctaSection} ${styles.fullWidthCta}`}>
          <h2 className={styles.sectionTitle}>Ready to Participate?</h2>
          <p className={styles.ctaParagraph}>
            Join us for an exciting tennis tournament with great prizes and
            networking opportunities!
          </p>
          <div className={styles.ctaButtons}>
            <Link
              to="/tournaments/registered-players"
              className={styles.registerButton}
            >
              <span className={styles.buttonText}>View Registered Players</span>
            </Link>
            <Link
              to="/tournaments/registered-teams"
              className={styles.loginButton}
            >
              <span className={styles.buttonText}>View Registered Teams</span>
            </Link> 
            <Link to="/tournaments/draws" className={styles.registerButton}>
              <span className={styles.buttonText}>View Draws</span>
            </Link>
            <Link to="/tournaments/results" className={styles.loginButton}>
              <span className={styles.buttonText}>View Results</span>
            </Link>
            <Link to="/tournaments/viewresults" className={styles.registerButton}>
                <span className={styles.buttonText}>View Results To</span>
                </Link>
          </div>
        </section>

        {/* Tournament Details Section */}
        <section className={styles.section} id="eventDetails">
          {" "}
          {/* Added id="eventDetails" for Events link */}
          <h2 className={styles.sectionTitle}>Tournament Details</h2>
          <div className={styles.gridContainer}>
            {/* Categories And Format Tile */}
            <div className={styles.tile}>
              <h3 className={styles.tileTitle}>Categories And Format</h3>
              <div className={styles.tileContent}>
                <h4 className={styles.tileSubtitle}>Tournament Categories</h4>
                <ul className={styles.tileList}>
                  {events.length > 0 ? (
                    events.map((event) => <li key={event._id}>{event.name}</li>)
                  ) : (
                    <li>No categories available.</li>
                  )}
                </ul>

                {/* {tournamentDetail.map((item) => (
                  <div className="detailsPara" key={item._id}>
                    <h4 className={styles.tileSubtitle}>{item.key}</h4>
                    <div className={styles.tileParagraph}>  
                      <div className="detailsPara" dangerouslySetInnerHTML={{ __html: item.value }}/>
                    </div>
                  </div>
                ))} */}

                {tournamentDetail.map((item) =>
                  item.key === "1" ? (
                    <div key={item._id}>
                      {item.showing && (
                        <>
                          <h4>{item.title}</h4>
                          <p
                            className="db-content"
                            dangerouslySetInnerHTML={{ __html: item.value }}
                          />
                        </>
                      )}
                    </div>
                  ) : null
                )}

                {tournamentDetail.map((item) =>
                  item.key === "2" ? (
                    <div key={item._id}>
                      {item.showing && (
                        <>
                          <h4>{item.title}</h4>
                          <p
                            className="db-content"
                            dangerouslySetInnerHTML={{ __html: item.value }}
                          />
                        </>
                      )}
                    </div>
                  ) : null
                )}
                {/* <p className={styles.tileParagraph}>
                  Any participant who loses both matches in the first round or
                  loses in the first round of a single event will be eligible.
                </p> */}
                {/* <h5 className={styles.tileSmallHeading}>Pairing Logic:</h5>
                <ul className={styles.tileList}>
                  <li>
                    Participants divided into X (Age $\leq$ 50) and Y (Age {">"}
                    50) categories
                  </li>
                  <li>
                    Each pair will have one person from X and one from Y based
                    on lottery system
                  </li>
                </ul> */}
              </div>
            </div>

            {/* Entry & Participation Tile */}
            <div className={styles.tile}>
              <h3 className={styles.tileTitle}>Entry & Participation</h3>
              <div className={styles.tileContent}>
                {tournamentDetail.map((item) =>
                  item.key === "3" ? (
                    <div key={item._id}>
                      {item.showing && (
                        <>
                          <h4>{item.title}</h4>
                          <p
                            className="db-content"
                            dangerouslySetInnerHTML={{ __html: item.value }}
                          />
                        </>
                      )}
                    </div>
                  ) : null
                )}
                {/* <h4 className={styles.tileSubtitle}>Entry Rules:</h4>
                <ul className={styles.tileList}>
                  <li>
                    One player can participate in max 2 categories (excluding
                    Lucky Doubles)
                  </li>
                  <li>Coaches are allowed to play in Category A only</li>
                  <li>Maximum draw size in any category is 32</li>
                  <li>Please carry age proof with you</li>
                </ul> */}

                {tournamentDetail.map((item) =>
                  item.key === "4" ? (
                    <div key={item._id}>
                      {item.showing && (
                        <>
                          <h4>{item.title}</h4>
                          <p
                            className="db-content"
                            dangerouslySetInnerHTML={{ __html: item.value }}
                          />
                        </>
                      )}
                    </div>
                  ) : null
                )}
                {/* <h4 className={styles.tileSubtitle}>Entry Fees</h4>
                <p className={styles.tileParagraph}>Two events: ₹5,000</p> */}
                {/* <p className={styles.tileParagraph}>
                  Two events with accommodation: ₹6,000 (double sharing up to 2
                  days)
                </p> */}
                {/* <p className={styles.tileParagraph}>One event: ₹3,500</p> */}
                {/* <p className={styles.tileParagraphLast}>
                  One event with accommodation: ₹4,500 (double sharing up to 2
                  days)
                </p> */}
                {/* <h5 className={styles.tileImportantDate}>
                  Last date for entry fees
                  : December 7, 2024
                </h5> */}
              </div>
            </div>
          </div>
        </section>
        {/* Prizes & Benefits Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Prizes & Benefits</h2>
          <div className={styles.gridContainer}>
            {/* Prize Money Tile */}
            <div className={styles.tile}>
              {pricesBenefit.map((item) =>
                item.key === "1" ? (
                  <div key={item._id}>
                    <h3 className={styles.tileTitle}>{item.title}</h3>
                    {item.showing && (
                      <p
                        className="db-content"
                        dangerouslySetInnerHTML={{ __html: item.value }}
                      />
                    )}
                  </div>
                ) : null
              )}
              {/* <h3 className={styles.tileTitle}>Prize Money</h3> */}
              {/* <ul className={styles.tileList}>
                <li>Winner team: ₹21,000</li>
                <li>Runners-up team: ₹11,000</li>
                <li>Semi-Finalist teams: ₹4,000 each</li>
                <li>Lucky Doubles: 50% of regular prizes</li>
              </ul> */}
            </div>

            {/* Participant Benefits Tile */}
            <div className={styles.tile}>
              {pricesBenefit.map((item) =>
                item.key === "2" ? (
                  <div key={item._id}>
                    <h3 className={styles.tileTitle}>{item.title}</h3>
                    {item.showing && (
                      <p
                        className="db-content"
                        dangerouslySetInnerHTML={{ __html: item.value }}
                      />
                    )}
                  </div>
                ) : null
              )}

              {/* <h3 className={styles.tileTitle}>Participant Benefits</h3> */}
              {/* <ul className={styles.tileList}>
                <li>Breakfast and Lunch on both days</li>
                <li>Gala dinner on December 9</li>
                <li>
                  Every participant receives Indian Tree T-Shirt, Shorts, Socks,
                  Cap, Wristband (MRP more than ₹3,000)
                </li>
              </ul> */}
            </div>
          </div>
        </section>
        {/* Venue & Important Information Section */}
        <section className={styles.section} id="contactInfo">
          {" "}
          {/* Added id="contactInfo" for Contact link */}
          {/* {pricesBenefit.map((item) =>
                item.key === "2" ? (
                  <div key={item._id}>
                    <h3 className={styles.tileTitle}>{item.title}</h3>
                    {item.showing && (
                      
                    )}
                  </div>
                ) : null,
              )} */}
          <h2 className={styles.sectionTitle}>Venue & Important Information</h2>
          <div className={styles.gridContainerMaps}>
            {/* Tournament Venue Tile */}
            {venue.map((item) =>
              item.key === "1" ? (
                <div className={styles.tile}>
                  <h3 className={styles.tileTitle}>{item.title}</h3>
                  <h2>{item.venue}</h2>
                  <p className={styles.tileParagraph}>{item.address}</p>
                  <div className={styles.mapContainer}>
                    {/* Corrected Google Maps Embed for Shanti Tennis Academy */}
                    <iframe
                      src={item.mapLink}
                      width="600"
                      height="450"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className={styles.mapFrame}
                    ></iframe>
                  </div>
                </div>
              ) : null
            )}

            {/* Gala Party & Stay Tile */}
            {venue.map((item) =>
              item.key === "2" ? (
                <div className={styles.tile}>
                  <h3 className={styles.tileTitle}>{item.title}</h3>
                  <h2>{item.venue}</h2>
                  <p className={styles.tileParagraph}>{item.address}</p>
                  <div className={styles.mapContainer}>
                    <iframe
                      src={item.mapLink}
                      width="600"
                      height="450"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className={styles.mapFrame}
                    ></iframe>
                  </div>
                </div>
              ) : null
            )}
          </div>
          {/* Important Information Tile - Moved to span full width */}
          <div className={`${styles.tile} ${styles.fullWidthTile}`}>
            {tournamentDetail.map((item) =>
              item.key === "5" ? (
                <>
                  <h3 className={styles.tileTitle}>{item.title}</h3>
                  {item.showing && (
                    <p
                      className="db-content"
                      dangerouslySetInnerHTML={{ __html: item.value }}
                    />
                  )}
                </>
              ) : null
            )}

            {/* <h3 className={styles.tileTitle}>Important Information</h3>
            <ul className={styles.tileList}>
              <li>Draws and Order of Play published on December 8</li>
              <li>
                Walk-over given if team doesn't appear within 15 minutes of
                scheduled time
              </li>
              <li>Tournament balls: Head Tour</li>
              <li>
                For queries contact{" "}
                <b>Tournament Director: Sumit Goel (Ph. 9412977857)</b>
              </li>
            </ul> */}
          </div>
        </section>
      </main>

      {/* Footer Section */}
      {/* <footer className={styles.footer}>
        <p className={styles.footerText}>
          © {new Date().getFullYear()} Uttranchal Tennis Association. All rights
          reserved.
        </p>
      </footer> */}

      <Footer />
    </div>
  );
}
