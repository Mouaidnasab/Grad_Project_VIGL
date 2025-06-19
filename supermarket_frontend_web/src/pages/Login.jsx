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
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [firstLogin, setFirstLogin] = useState(true);

  const navigate = useNavigate();
  const stickerRef = useRef(null);
  const [stickerDimensions, setStickerDimensions] = useState({
    width: "700px",
    opacity: 1,
  });

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      if (windowWidth < 768) {
        setStickerDimensions({ width: "300px", opacity: 0.4 });
      } else if (windowWidth >= 768 && windowWidth < 992) {
        setStickerDimensions({ width: "500px", opacity: 0.5 });
      } else {
        setStickerDimensions({ width: "700px", opacity: 1 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        const response = await api.get("/users/is_first_login");
        if (response.data) {
          setFirstLogin(true);
        } else {
          setFirstLogin(false);
          console.log("Fiddsrst login:", response.data);
          console.log("Redirecting to dashboard...", firstLogin);
        }
      } catch (err) {
        // If server unreachable or other error, display generic message
        if (!err.response) {
          console.error("Server unreachable:", err);
          setError("The server is currently down. Please try again later.");
        } else {
          console.error("Error checking owner status:", err);
          setError("An unexpected error occurred while checking owner status.");
        }
      }
    };
    checkFirstLogin();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("submitting");
    setIsLoading(true);

    const loginPayload = new URLSearchParams({
      username: formData.username,
      password: formData.password,
    });

    try {
      const response = await api.post("/user_auth/token", loginPayload, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);

      setStatus("success");
      if (firstLogin) {
        console.log("Redirecting to registration...");
        navigate("/add-staff");
      } else {
        console.log("Redirecting to dashboard...");
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setStatus("error");
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(
          err.message || "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page admin-registration-page">
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
      <Footer />
    </div>
  );
};

export default LoginPage;
