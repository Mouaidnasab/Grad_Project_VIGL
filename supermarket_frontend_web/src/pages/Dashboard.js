import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footerInit";
import certified from "../images/dashboard-usdalogo.png";
import iso from "../images/dashboard-isologo.png";
import foodsafety from "../images/dashboard-foodsafetylogo.png";
import leftimg from "../images/dashboard-leftimage.png";
import api from "../api.js";

const Dashboard = () => {
  const [penalties, setPenalties] = useState([]);

  useEffect(() => {
    fetchPenalties();
  }, []);

  const fetchPenalties = async () => {
    try {
      const response = await api.get("/product/get_penalties");
      console.log("Fetched Penalties:", response.data);
      setPenalties(response.data);
    } catch (error) {
      console.error("Error fetching penalties:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        {/* Main Content Section */}
        <main className="main-content">
          <div className="stats-container">
            <div className="stat-item icon-container">
              <i className="basket-icon"></i>
            </div>
            <div className="stat-item rate-section">
              <i className="star-icon"></i>
              <span className="rating">5.00 Rate</span>
            </div>
            <div className="stat-item image-container">
              <img src={certified} className="stat-image" alt="certified" />
            </div>
            <div className="stat-item image-container">
              <img src={foodsafety} className="stat-image2" alt="foodsafety" />
            </div>
            <div className="stat-item image-container1">
              <img src={iso} className="stat-image1" alt="iso certified" />
            </div>
            <div className="stat-item">
              <i className="date-icon"></i>
              <span className="stat-text">Established since</span>
              <span className="stat-highlight">25 years</span>
            </div>
            <div className="stat-item">
              <i className="available-icon"></i>
              <span className="stat-text">Available</span>
              <span className="stat-subtext">7 Screens | 9 Shelves</span>
            </div>
          </div>

          {/* Middle Row */}
          <div className="middle-row">
            <div className="info-box">
              <h2 className="h2infobox">
                Active Screens: <span className="highlight">5</span>
              </h2>
              <h2 className="h2infobox2">
                Prices to be updated: <span className="highlight">3</span>
              </h2>
            </div>
            <div className="image-containerleft">
              <img src={leftimg} alt="Dashboard left" />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="bottom-row">
            <div className="penalties-box">
              <h3>Pending Penalties</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Issued Date</th>
                    <th>Last Payment</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {penalties.length > 0 ? (
                    penalties.map((penalty) => (
                      <tr key={penalty.PenaltyID}>
                        <td>{penalty.PenaltyID}</td>
                        <td>{penalty.IssuedDate}</td>
                        <td>{penalty.LastPaymentDate}</td>
                        <td>₺{penalty.Amount}</td>
                        <td>{penalty.Reason}</td>
                        <td>{penalty.Status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        No penalties
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <button className="view-more">View More</button>
            </div>
            <div className="quick-access-box">
              <h3 className="quickh3">Quick Access</h3>
              <button className="quick-btn">Products Details</button>
              <button className="quick-btn">Statistics</button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
