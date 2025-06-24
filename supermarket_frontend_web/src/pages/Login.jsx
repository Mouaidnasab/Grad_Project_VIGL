// src/pages/LoginPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api.js";
import "../Css/Admintry.css";
import welcomeImage from "../images/welcome.png";
import VIGLLogo from "../images/VIGL.png";
import seaWaveSticker from "../images/sea-wave-sticker.png";
import Footer from "../component/footerInit.jsx";

const LoginPage = () => {
  const navigate = useNavigate();
  const GOV_BACKEND_URL = process.env.REACT_APP_GOV_BACKEND_URL;

  // existing state
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [firstLogin, setFirstLogin] = useState(true);
  const stickerRef = useRef(null);
  const [stickerDimensions, setStickerDimensions] = useState({
    width: "700px",
    opacity: 1,
  });

  // new state for modal
  const [showSupermarketModal, setShowSupermarketModal] = useState(false);
  const [supermarkets, setSupermarkets] = useState([]);
  const [selectedSupermarketID, setSelectedSupermarketID] = useState("");

  // handle responsive sticker
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) setStickerDimensions({ width: "300px", opacity: 0.4 });
      else if (w < 992) setStickerDimensions({ width: "500px", opacity: 0.5 });
      else setStickerDimensions({ width: "700px", opacity: 1 });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // check first login
  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        const res = await api.get("/users/is_first_login");
        setFirstLogin(!!res.data);
      } catch (err) {
        if (!err.response) setError("The server is down. Please try later.");
        else setError("Error checking login status.");
      }
    };
    checkFirstLogin();
  }, [navigate]);

  // fetch list of supermarkets from gov backend
  const fetchSupermarkets = async () => {
    try {
      const res = await fetch(`${GOV_BACKEND_URL}/supermarket/get_only_id`);
      const data = await res.json();
      setSupermarkets(data);
    } catch (err) {
      console.error("Error fetching supermarkets:", err);
    }
  };

  // open modal and load list
  const openSupermarketModal = () => {
    setShowSupermarketModal(true);
    fetchSupermarkets();
  };

  // call API to change supermarket then reload
  const handleChangeSupermarket = async () => {
    try {
      await api.get("/users/change_supermarket", {
        params: { SupermarketID: selectedSupermarketID },
      });
      setShowSupermarketModal(false);
      window.location.reload();
    } catch (err) {
      console.error("Error changing supermarket:", err);
    }
  };

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("submitting");
    setIsLoading(true);

    const payload = new URLSearchParams({
      username: formData.username,
      password: formData.password,
    });

    try {
      const res = await api.post("/user_auth/token", payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("refresh_token", res.data.refresh_token);
      setStatus("success");
      navigate(firstLogin ? "/add-staff" : "/");
    } catch (err) {
      setStatus("error");
      setError(
        err.response?.data?.detail ||
          err.message ||
          "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="login-page admin-registration-page"
      style={{ position: "relative" }}
    >
      <button
        onClick={openSupermarketModal}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          width: "24px",
          height: "24px",
          background: "black",
          border: "none",
          opacity: 0,
          cursor: "pointer",
          zIndex: 1000,
        }}
      />

      <div className="split-container">
        <div className="image-side">
          <img src={VIGLLogo} alt="VIGL Logo" className="login-side-image" />
          <div
            className="sea-wave-sticker-container"
            ref={stickerRef}
            style={{
              zIndex: 1,
              width: stickerDimensions.width,
              opacity: stickerDimensions.opacity,
            }}
          >
            <img
              src={seaWaveSticker}
              alt="Sea Wave Sticker"
              className="sea-wave-sticker"
            />
          </div>
        </div>

        <div className="form-container">
          <div className="image-container">
            <img src={welcomeImage} alt="Welcome" className="header-image" />
          </div>
          <h1>Login</h1>

          <form className="registration-form" onSubmit={handleSubmit}>
            <div className="input-group input-group-username">
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                required
              />
              <label htmlFor="username">Username</label>
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
              />
              <label htmlFor="password">Password</label>
            </div>

            {error && <div className="error-message">{error}</div>}
            {status === "success" && (
              <div className="success-message">
                Login successful! Redirecting...
              </div>
            )}

            <div className="button-wrapper">
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSupermarketModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "1.5rem",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h2>Change Supermarket</h2>
            <select
              value={selectedSupermarketID}
              onChange={(e) => setSelectedSupermarketID(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", marginTop: "1rem" }}
            >
              <option value="">— Select a supermarket —</option>
              {supermarkets.map((s) => (
                <option key={s.SupermarketID} value={s.SupermarketID}>
                  {s.RegisteredName}
                </option>
              ))}
            </select>
            <div
              style={{
                marginTop: "1.5rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowSupermarketModal(false)}
                style={{ marginRight: "0.75rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleChangeSupermarket}
                disabled={!selectedSupermarketID}
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default LoginPage;
