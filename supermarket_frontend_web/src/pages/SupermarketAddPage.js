import React, { useState } from "react";
import "./AdminRegistrationPage.css";
import welcomeImage from "../images/welcome.png";
import LogoCarousel from "../components/LogoCarousel.js";
import Footer from "../components/footerInit.js";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SupermarketAddPage = () => {
  const [formData, setFormData] = useState({
    registeredID: "",
    registeredDate: "",
    registeredName: "",
    address: "",
    contactPersonFullName: "",
  });

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const payload = {
      RegisteredID: formData.registeredID,
      RegisteredDate: formData.registeredDate,
      RegisteredName: formData.registeredName,
      Address: formData.address,
      ContactPersonFullName: formData.contactPersonFullName,
    };

    try {
      const response = await api.post("/supermarket/create", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Supermarket created successfully:", response.data);
      setStatus("success");

      navigate("/staff-add");
    } catch (err) {
      console.error("Error creating supermarket:", err);
      setStatus("error");
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(
          err.message || "An unexpected error occurred. Please try again."
        );
      }
    }
  };

  const getButtonLabel = () => {
    switch (status) {
      case "submitting":
        return "Submitting...";
      case "error":
        return "Retry";
      case "success":
        return "Next";
      default:
        return "Submit";
    }
  };

  return (
    <div className="page-container">
      <div className="image-container">
        <img src={welcomeImage} alt="Logo" className="header-image" />
      </div>

      <div className="form-container">
        <h1>Supermarket Registration</h1>
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="input-group-name">
            <div className="input-group">
              <input
                type="text"
                name="registeredID"
                value={formData.registeredID}
                onChange={handleChange}
                placeholder="Registered ID"
                required
                //use 'disabled' for later to disable input
              />
              <label htmlFor="registeredID">Registered ID</label>
            </div>
            <div className="input-group">
              <input
                type="date"
                name="registeredDate"
                value={formData.registeredDate}
                onChange={handleChange}
                placeholder="Registered Date"
                required
              />
              <label htmlFor="registeredDate">Registered Date</label>
            </div>
          </div>

          <div className="input-group input-group-username">
            <input
              type="text"
              name="registeredName"
              value={formData.registeredName}
              onChange={handleChange}
              placeholder="Registered Name"
              required
            />
            <label htmlFor="registeredName">Registered Name</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              required
            />
            <label htmlFor="address">Address</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              name="contactPersonFullName"
              value={formData.contactPersonFullName}
              onChange={handleChange}
              placeholder="Contact Person Full Name"
              required
            />
            <label htmlFor="contactPersonFullName">
              Contact Person Full Name
            </label>
          </div>

          {status === "error" && error && (
            <div className="error-message">{error}</div>
          )}

          <div className="button-wrapper">
            {/* <button type="button" className="back-btn" onClick={handleBack}>
              Back
            </button> */}
            <button
              type="submit" // Changed to submit the form
              className="next-btn"
              disabled={status === "submitting"}
            >
              {getButtonLabel()}
            </button>
          </div>
        </form>
      </div>

      <div className="carousel-container">
        <LogoCarousel />
      </div>
      <Footer />
    </div>
  );
};

export default SupermarketAddPage;
