import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  console.log("EMAIL:", email);
  console.log("PASSWORD:", password);

  try {
    const res = await axios.post(
      "https://backendds.onrender.com/api/admin/login",
      { email, password },
      { withCredentials: true }
    );

    console.log("LOGIN RESPONSE:", res.data);
    localStorage.setItem("token", res.data.token);

    localStorage.setItem("isAuthenticated", "true");

    navigate("/dashboard");
  } catch (error) {
    console.log("LOGIN ERROR:", error.response?.data || error.message);
    alert(error.response?.data?.message || "Invalid credentials");
  }
};
  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleLogin} className={styles.loginForm}>
        <h1>Admin Login</h1>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
