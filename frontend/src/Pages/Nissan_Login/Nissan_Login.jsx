import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import styles from "./Nissan_Login.module.css";
import Header from "../../Components/Header/Header";
import Footer from "../../Components/Footer/Footer";

const Nissan_Login = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState({
    whatsappNumber: "",
    dob: "",
  });

  const loginHandler = async (e) => {
    e.preventDefault();
    if (!login.whatsappNumber || !login.dob) {
      return toast.error(
        "Please enter your WhatsApp number and date of birth."
      );
    }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/player/login`,
        login,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (res.data.success) {
  console.log("LOGIN RESPONSE 👉", res.data);
   console.log("PLAYER DATA 👉", res.data.data);

  const token = res.data.token || res.data.data?.token;

  localStorage.setItem("token", token);

  navigate(`/tournaments/login/${res.data.data.id}`);
  toast.success(res.data.message);
}
    } catch (error) {
      toast.error(error.response?.data?.message || "Incorrect Credentials");
      console.log(error);
    }
  };

  return (
    <div>
      {/* <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoWrapper}>
            <img src="/logo.png" alt="UTA LOGO" />
          </div>
          <h1 className={styles.title}>Uttranchal Tennis Association</h1>
        </div>
        <div className={styles.headerRight}>
          <Link to="/tournaments">Back to Home</Link>
        </div>
      </header> */}
    <Header />
      <section className={styles.formContainer}>
        <form className={styles.loginForm} onSubmit={loginHandler}>
          <h2 className={styles.formTitle}>Player Login</h2>
          <p className={styles.formSubtitle}>
            Access your player dashboard to manage your events.
          </p>

          <div className={styles.inputGroup}>
            <label htmlFor="whatsappNumber" className={styles.label}>
              WhatsApp Number
            </label>
            <input
              type="tel"
              id="whatsappNumber"
              className={styles.input}
              placeholder="Enter your WhatsApp number"
              value={login.whatsappNumber}
              onChange={(e) =>
                setLogin({ ...login, whatsappNumber: e.target.value })
              }
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="dob" className={styles.label}>
              Date of Birth
            </label>
            <input
              type="date"
              id="dob"
              className={styles.input}
              value={login.dob}
              onChange={(e) => setLogin({ ...login, dob: e.target.value })}
              required
            />
          </div>

          <button type="submit" className={styles.loginButton}>
            Login
          </button>

          <p className={styles.registerPrompt}>
            Don't have an account?{" "}
            <Link to="/tournaments/register" className={styles.registerLink}>
              Register here
            </Link>
          </p>
        </form>
      </section>
      <Footer />
    </div>
  );
};

export default Nissan_Login;