import React, { useState, useEffect, useRef } from "react";
import styles from "./Header.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../../redux/user.slice.js"; // Adjust path to your userSlice
import { toast } from "sonner";
import axios from "axios";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  // Function to fetch user details if a token exists and Redux store is empty
  const fetchUserDetails = async () => {
    // console.log("fetchUserDetails called on component mount."); // Keep for debugging
    // console.log("Current Redux user state:", user); // Keep for debugging

    if (Object.keys(user).length > 0) {
      // console.log("User already in Redux state. Skipping API call."); // Keep for debugging
      return;
    }

    try {
      // console.log("Attempting to fetch user details from backend..."); // Keep for debugging
      const token = localStorage.getItem("token");

if (!token) return;

const response = await axios.get(`${API_BASE_URL}/api/member/me`, {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});
      if (response.data.success && response.data.user) {
        // console.log("API call successful. User data received:", response.data.user); // Keep for debugging
        dispatch(setUser(response.data.user)); // Populate Redux store
        // toast.success("Welcome back!"); // Optional
      } else {
        // console.log("API call successful but no user data found in response:", response.data); // Keep for debugging
        dispatch(setUser({})); // Ensure store is empty if backend indicates no user
      }
    } catch (error) {
      console.error(
        "Error fetching user details:",
        error.response?.status,
        error.response?.data?.message || error.message
      );
      dispatch(setUser({})); // Clear user state on error (e.g., token expired, invalid)
      // Do not show toast here, as it's a silent background check
    }
  };

  useEffect(() => {
    fetchUserDetails();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/member/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      dispatch(setUser({}));
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error(
        error.response?.data?.message || "Logout failed. Please try again."
      );
    } finally {
      setShowDropdown(false);
      setMobileMenuOpen(false);
    }
  };

  const getProfileChar = () => {
    if (!user || Object.keys(user).length === 0) return "?";

    switch (user.type) {
      case "Player":
      case "Coach":
        return user.name ? user.name.charAt(0).toUpperCase() : "?";
      case "Academy":
        return user.academyName
          ? user.academyName.charAt(0).toUpperCase()
          : "?";
      case "District":
        return user.districtName
          ? user.districtName.charAt(0).toUpperCase()
          : "?";
      default:
        return "?";
    }
  };

  const getUserDisplayName = () => {
    if (!user || Object.keys(user).length === 0) return "Guest";

    switch (user.type) {
      case "Player":
      case "Coach":
        return user.name || "Unknown";
      case "Academy":
        return user.academyName || "Unknown Academy";
      case "District":
        return user.districtName || "Unknown District";
      default:
        return "Guest";
    }
  };

  const getUserType = () => {
    if (user && user.type) {
      return user.type;
    }
    return "User";
  };

  const isLoggedIn = Object.keys(user).length > 0;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLogoGroup}>
          <div className={styles.logoIcon}>
            <img src="/logo.png" alt="UTA LOGO" />
            <h2 className={styles.headerTitle}>
              Uttaranchal Tennis Association
            </h2>
          </div>
        </div>
        <div className={styles.headerNavActions}>
          {/* Desktop Navigation Links */}
          <div className={styles.navbarNav}>
            <Link to="/">Home</Link>
            <Link to="/tournaments">Tournaments</Link>
            <Link to="/about">About Us</Link>
            <Link to="/joinUs">Join Us</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
          {/* Action Buttons / Profile Section */}
          <div className={styles.headerButtons}>
            {isLoggedIn ? (
              <div className={styles.profileSection} ref={dropdownRef}>
                <div
                  className={styles.profileImage}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {getProfileChar()}
                </div>
                {showDropdown && (
                  <div className={styles.dropdownMenu}>
                    {/* Desktop Dropdown: Profile Info at the top */}
                    <div className={styles.dropdownProfileHeader}>
                      <div className={styles.profileImage}>
                        {getProfileChar()}
                      </div>
                      <div className={styles.profileText}>
                        <span className={styles.profileName}>
                          {getUserDisplayName()}
                        </span>
                        <span className={styles.profileType}>
                          ({getUserType()})
                        </span>
                      </div>
                    </div>
                    <div className={styles.dropdownLinks}>
                      {/* <Link
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                      >
                        Profile
                      </Link>
                      <Link to="/status" onClick={() => setShowDropdown(false)}>
                        Status
                      </Link>
                      <Link to="/events" onClick={() => setShowDropdown(false)}>
                        Events
                      </Link> */}
                      <button
                        className={styles.logoutButton} // Using the new logoutButton class
                        onClick={handleLogout}
                      >
                        <span className={styles.buttonText}>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className={styles.loginButton}>
                <span className={styles.buttonText}>Login</span>
              </Link>
            )}
          </div>
        </div>
        {/* Mobile menu icon */}
        <div className={styles.mobileMenuIcon}>
          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(true)}
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
      </header>

      {/* Mobile Navigation Overlay */}
      <div
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
          <Link
            className={styles.navLink}
            to="/"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            className={styles.navLink}
            to="/tournaments"
            onClick={() => setMobileMenuOpen(false)}
          >
            Tournaments
          </Link>
          <Link
            className={styles.navLink}
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
          >
            About Us
          </Link>
          <Link
            className={styles.navLink}
            to="/joinUs"
            onClick={() => setMobileMenuOpen(false)}
          >
            Join Us
          </Link>
          <Link
            className={styles.navLink}
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact Us
          </Link>

          {/* Mobile Profile Info and Links (shown if logged in) */}
          {isLoggedIn && (
            <>
              {/* Separator for clarity */}
              <div className={styles.mobileSeparator}></div>
              {/* Profile Info */}
              <div className={styles.mobileProfileInfo}>
                <div className={styles.profileImage}>{getProfileChar()}</div>
                <div className={styles.profileText}>
                  <span className={styles.profileName}>
                    {getUserDisplayName()}
                  </span>
                  <span className={styles.profileType}>({getUserType()})</span>
                </div>
              </div>
              {/* Indented Profile-related Links */}
              {/* <Link
                className={`${styles.navLink} ${styles.indentedNavLink}`}
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                className={`${styles.navLink} ${styles.indentedNavLink}`}
                to="/status"
                onClick={() => setMobileMenuOpen(false)}
              >
                Status
              </Link>
              <Link
                className={`${styles.navLink} ${styles.indentedNavLink}`}
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link> */}
            </>
          )}
        </div>
        {/* Mobile Navigation Buttons (Login/Logout) */}
        <div className={styles.mobileNavButtons}>
          {isLoggedIn ? (
            <button className={styles.logoutButton} onClick={handleLogout}>
              <span className={styles.buttonText}>Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={styles.loginButton}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className={styles.buttonText}>Login</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
