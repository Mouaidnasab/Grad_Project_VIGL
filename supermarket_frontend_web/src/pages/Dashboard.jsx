import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
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
import api from "../Api.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

// ─── RATING SECTION ─────────────────────────────────────────────────────────────
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
        <a href="/manage-shelves-screens" className="rating-button">
          Manage Shelves &amp; Screens
        </a>
        <a href="/settings" className="rating-button">
          Settings
        </a>
      </div>
    </div>
  </div>
);

// ─── SCREEN STATS ───────────────────────────────────────────────────────────────
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

// ─── PENALTIES AND PRICE HISTORY ────────────────────────────────────────────────
const PenaltiesAndPriceHistory = ({ penalties }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.get("/product/get");
        if (res.data.Products && Array.isArray(res.data.Products)) {
          setProducts(res.data.Products);
          if (res.data.Products.length > 0) {
            setSelectedProductId(res.data.Products[0].ProductID);
          }
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch price history on product change
  useEffect(() => {
    if (!selectedProductId) return;

    const fetchPriceHistory = async () => {
      setLoadingPrices(true);
      try {
        const res = await api.get(
          `/product/price_history/${selectedProductId}`
        );
        setPriceHistory(res.data.PriceHistory || []);
      } catch (err) {
        console.error("Failed to fetch price history", err);
        setPriceHistory([]);
      } finally {
        setLoadingPrices(false);
      }
    };
    fetchPriceHistory();
  }, [selectedProductId]);

  const chartData = {
    labels: priceHistory.map((record) =>
      new Date(record.StartDate).toLocaleDateString("en-GB")
    ),
    datasets: [
      {
        label: "Price (₺)",
        data: priceHistory.map((record) => record.Price),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: "Price (₺)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Start Date",
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const selectedProductName =
    products.find((p) => p.ProductID === selectedProductId)?.ProductName || "";

  return (
    <div className="penalties-sales">
      {/* Penalties section */}
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

      {/* Price History Section styled like sales */}
      <div className="sales">
        <div className="sales-header">
          <h3 className="section-titlea">Product Price History</h3>
          <div>
            <select
              className="sales-select"
              value={selectedProductId || ""}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              disabled={loadingProducts}
            >
              {products.map((prod) => (
                <option key={prod.ProductID} value={prod.ProductID}>
                  {prod.ProductName} (ID: {prod.ProductID})
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="sales-amount">
          {selectedProductName
            ? `Price history for ${selectedProductName}`
            : "Select a product to view price history"}
        </p>

        <div className="sales-chart" style={{ height: "250px" }}>
          {loadingPrices ? (
            <p>Loading price history...</p>
          ) : priceHistory.length === 0 ? (
            <p>No price history available.</p>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [isOverlapping, setIsOverlapping] = useState(false);
  const [penalties, setPenalties] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);

  const stickerRef = useRef(null);
  const statsRef = useRef(null);
  const dashboardRef = useRef(null);

  // Fetch penalties on mount
  useEffect(() => {
    const fetchPenalties = async () => {
      try {
        const response = await api.get("/product/get_penalties");
        setPenalties(response.data);
      } catch (error) {
        console.error("Error fetching penalties:", error);
      }
    };
    fetchPenalties();
  }, []);

  // Fetch active and available screens on mount
  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const response = await api.get("/screen/active_screens");
        const { active, available } = response.data;
        setActiveCount(Array.isArray(active) ? active.length : 0);
        setAvailableCount(Array.isArray(available) ? available.length : 0);
      } catch (error) {
        console.error("Error fetching screens:", error);
      }
    };
    fetchScreens();
  }, []);

  // Overlap detection logic
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
          <PenaltiesAndPriceHistory penalties={penalties} />
        </div>
      </div>

      <div
        className="sea-wave-sticker-container1"
        ref={stickerRef}
        style={{
          zIndex: 1,
          ...(window.innerWidth < 768 && { width: "300px", opacity: 0.4 }),
          ...(window.innerWidth >= 768 &&
            window.innerWidth < 992 && { width: "400px", opacity: 0.5 }),
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
