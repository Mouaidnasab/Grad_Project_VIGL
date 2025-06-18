import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api.js";
import "../css/Login.css";
import sideImage from "../images/KKTC2.png";
import headerLogo from "../images/Govlogo.png";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const stickerRef = useRef(null);
  const [stickerDimensions, setStickerDimensions] = useState({
    width: "700px",
    opacity: 1,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setStickerDimensions({ width: "300px", opacity: 0.4 });
      } else if (width < 992) {
        setStickerDimensions({ width: "500px", opacity: 0.5 });
      } else {
        setStickerDimensions({ width: "700px", opacity: 1 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
      const response = await api.post("/user_auth/token/", payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);

      setStatus("success");

      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setStatus("error");
      setError(
        err.response?.data?.detail ||
          err.message ||
          "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page admin-registration-page">
      <div className="split-container">
        <div className="image-side">
          <img
            ref={stickerRef}
            src={sideImage}
            alt="Login Visual"
            className="login-side-image"
            style={{
              width: stickerDimensions.width,
              opacity: stickerDimensions.opacity,
            }}
          />
        </div>

        <div className="form-container">
          <div className="image-container">
            <img src={headerLogo} alt="Logo" className="header-image" />
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
    </div>
  );
};

export default LoginPage;
