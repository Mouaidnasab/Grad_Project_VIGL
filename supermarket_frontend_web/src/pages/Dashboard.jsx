import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";
import "../Css/Dashboard.css";
import { Link } from "react-router-dom";
import BootstrapNavbar from "../component/BootstrapNavbar";
import certified from "../images/certified.png";
import squareImage from "../images/preview.webp";
import iso from "../images/iso-certification-gold-stamp-luxury-free-vector-removebg-preview (1).png";
import seaWaveSticker from "../images/sea-wave-sticker.png";
import api from "../Api.js"; // for backend calls

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

// Sample graph data moved outside of the component scope
const graphSampleData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "This Month",
      data: [5000, 15000, 10000, 20000, 15000, 25000],
      borderColor: "#3B82F6",
      borderWidth: 2,
      fill: true,
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.4,
    },
    {
      label: "Last Month",
      data: [7000, 12000, 8000, 18000, 14000, 22000],
      borderColor: "#EF4444",
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      tension: 0.4,
    },
  ],
};

// ─── RATING SECTION (UNCHANGED) ─────────────────────────────────────────────────────────────────────────────────────────────────────
const RatingSection = () => (
  <div className="rating-section">
    <div className="rating-info">
      <div className="rating-item">
        <span className="rating-star" role="img" aria-label="star">
          ⭐
        </span>
        <p className="rating-text">5.0 Rate</p>
      </div>
      <div className="rating-item">
        <div className="certified-logo">
          <img src={certified} alt="Certified" className="certified-image" />
        </div>
        <p className="certified-text">Certified</p>
      </div>
      <div className="rating-item">
        <span className="rating-store" role="img" aria-label="store">
          🏪
        </span>
        <p className="rating-text">Since 1999</p>
      </div>
      <div className="rating-item">
        <div className="certified-logo">
          <img src={iso} alt="ISO Certified" className="iso-image" />
        </div>
        <p className="certified-text">ISO Certified</p>
      </div>
    </div>
    <div className="quick-access">
      <p className="quick-access-label">QUICK ACCESS:</p>
      <div className="rating-buttons">
        <a href="/manage-products" className="rating-button">
          Products Details
        </a>
        <a href="/about" className="rating-button">
          Statistics
        </a>
        <a href="/manage-shelves-screens" className="rating-button">
          Manage Shelves &amp; Screens
        </a>
      </div>
    </div>
  </div>
);

// ─── SCREEN STATS (UPDATED TO ACCEPT DYNAMIC COUNTS) ─────────────────────────────────────────────────────────────────────────────
const ScreenStats = ({ activeCount, availableCount }) => (
  <div className="screen-stats">
    <div className="screen-stat">
      <span className="screen-icon" role="img" aria-label="active screens">
        🖥️
      </span>
      <div className="screen-details">
        <p className="screen-label">Active Screens</p>
        <p className="screen-value">{activeCount}</p>
      </div>
    </div>
    <div className="screen-stat">
      <span className="screen-icon" role="img" aria-label="available screens">
        🖥️
      </span>
      <div className="screen-details">
        <p className="screen-label">Available Screens</p>
        <p className="screen-value">{availableCount}</p>
      </div>
    </div>
  </div>
);

// ─── PENALTIES AND SALES (UNCHANGED) ─────────────────────────────────────────────────────────────────────────────────────────────
const PenaltiesAndSales = ({ penalties }) => {
  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => `${value / 1000}k` },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="penalties-sales">
      <div className="penalties">
        <h3 className="section-titlea">Penalties</h3>

        {penalties.length > 0 ? (
          <table className="penalties-table">
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
              {penalties.slice(0, 3).map((penalty) => (
                <tr key={penalty.PenaltyID}>
                  <td>{penalty.PenaltyID}</td>
                  <td>{penalty.IssuedDate}</td>
                  <td>{penalty.LastPaymentDate}</td>
                  <td>₺{penalty.Amount}</td>
                  <td>{penalty.Reason}</td>
                  <td>{penalty.Status}</td>
                </tr>
              ))}
              {penalties.length > 4 && (
                <tr>
                  <td colSpan="6" className="ellipsis text-center">
                    ...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <p className="penalties-status">NO PENALTIES</p>
        )}
        <Link to="/penalties">
          <button className="penalties-button mt-3 px-5">VIEW MORE</button>
        </Link>
      </div>
      <div className="sales">
        <div className="sales-header">
          <h3 className="section-titlea">Sale</h3>
          <div>
            <select className="sales-select" defaultValue="2022">
              <option>2022</option>
              <option>2023</option>
              <option>2024</option>
            </select>
            <select className="sales-select" defaultValue="7days">
              <option>7 days</option>
              <option>1 month</option>
              <option>1 year</option>
            </select>
          </div>
        </div>
        <p className="sales-amount">$4,509</p>
        <div className="sales-chart" style={{ height: "250px" }}>
          <Line data={graphSampleData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD (UPDATED TO FETCH “active_screens”) ───────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [isOverlapping, setIsOverlapping] = useState(false);
  const [penalties, setPenalties] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);

  const stickerRef = useRef(null);
  const statsRef = useRef(null);
  const dashboardRef = useRef(null);

  // 1) Fetch penalties from backend on mount
  useEffect(() => {
    const fetchPenalties = async () => {
      try {
        const response = await api.get("/product/get_penalties");
        console.log("Fetched Penalties:", response.data);
        setPenalties(response.data);
      } catch (error) {
        console.error("Error fetching penalties:", error);
      }
    };
    fetchPenalties();
  }, []);

  // 2) Fetch active/available screens on mount
  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const response = await api.get("/screen/active_screens");
        // Assuming response.data has the shape: { active: [...], available: [...] }
        const { active, available } = response.data;
        setActiveCount(Array.isArray(active) ? active.length : 0);
        setAvailableCount(Array.isArray(available) ? available.length : 0);
      } catch (error) {
        console.error("Error fetching screens:", error);
      }
    };
    fetchScreens();
  }, []);

  // 3) Overlap detection logic (unchanged)
  useEffect(() => {
    const checkOverlap = () => {
      if (stickerRef.current && statsRef.current) {
        const stickerRect = stickerRef.current.getBoundingClientRect();
        const statsRect = statsRef.current.getBoundingClientRect();
        const overlap = !(
          stickerRect.right < statsRect.left ||
          stickerRect.left > statsRect.right ||
          stickerRect.bottom < statsRect.top ||
          stickerRect.top > statsRect.bottom
        );
        setIsOverlapping(overlap);
      }
    };

    checkOverlap();
    window.addEventListener("resize", checkOverlap);
    window.addEventListener("scroll", checkOverlap);
    return () => {
      window.removeEventListener("resize", checkOverlap);
      window.removeEventListener("scroll", checkOverlap);
    };
  }, []);

  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.style.position = "relative";
    }
  }, []);

  return (
    <div className="dashboard" ref={dashboardRef}>
      <BootstrapNavbar />
      <RatingSection />

      <div className="main-content">
        <div className="left-column">
          <img src={squareImage} alt="Preview" className="square-image" />
        </div>
        <div className="right-column" ref={statsRef} style={{ zIndex: 2 }}>
          <ScreenStats
            activeCount={activeCount}
            availableCount={availableCount}
          />
          <PenaltiesAndSales penalties={penalties} />
        </div>
      </div>

      <div
        className="sea-wave-sticker-container1"
        ref={stickerRef}
        style={{
          zIndex: 1,
          ...(window.innerWidth < 768 && {
            width: "300px",
            opacity: 0.4,
          }),
          ...(window.innerWidth >= 768 &&
            window.innerWidth < 992 && {
              width: "400px",
              opacity: 0.5,
            }),
        }}
      >
        <img
          src={seaWaveSticker}
          alt="Sea Wave Sticker"
          className="sea-wave-sticker1"
        />
      </div>
    </div>
  );
};

export default Dashboard;
