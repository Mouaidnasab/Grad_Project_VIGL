// src/components/Penalties.jsx
import React, { useState, useEffect } from "react";
import "../Css/ManageProducts.css";
import BootstrapNavbar from "../component/BootstrapNavbar";
import Footer from "../component/footerInit.jsx";
import "@fortawesome/fontawesome-free/css/all.min.css";
import api from "../Api.js";

const Penalties = () => {
  const [penalties, setPenalties] = useState([]);
  const [filteredPenalties, setFilteredPenalties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch penalties from the backend
  const fetchPenalties = async () => {
    try {
      const response = await api.get("/product/get_penalties");
      const fetched = response.data || [];
      setPenalties(fetched);
      setFilteredPenalties(fetched);
    } catch (error) {
      console.error("Error fetching penalties:", error);
      setPenalties([]);
      setFilteredPenalties([]);
    }
  };

  useEffect(() => {
    fetchPenalties();
  }, []);

  // Filter by PenaltyID, Reason, or Status
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPenalties(penalties);
      setCurrentPage(1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = penalties.filter((p) => {
      return (
        String(p.PenaltyID).includes(term) ||
        (p.Reason || "").toLowerCase().includes(term) ||
        (p.Status || "").toLowerCase().includes(term)
      );
    });

    setFilteredPenalties(filtered);
    setCurrentPage(1);
  }, [searchTerm, penalties]);

  // Pagination calculations
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredPenalties.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPenalties.length / itemsPerPage);

  const goToPrev = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <>
      <BootstrapNavbar />

      <div className="manage-container">
        <header className="manage-header">
          <h1 className="borderh1">
            <i className="fas fa-exclamation-circle header-icon"></i> Manage Penalties
          </h1>
        </header>

        <div className="manage-content">
          <div className="section1">
            <input
              type="text"
              placeholder="Search by ID, Reason, or Status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar"
            />
          </div>

          <div className="section3">
            <div className="relations-table-container3">
              <table className="relations-table3">
                <thead>
                  <tr>
                    <th>Penalty ID</th>
                    <th>Issued Date</th>
                    <th>Last Payment Date</th>
                    <th>Amount (₺)</th>
                    <th>Reason</th>
                    <th>Product ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((penalty) => {
                      const issuedDate = penalty.IssuedDate
                        ? new Date(penalty.IssuedDate).toLocaleDateString("en-GB")
                        : "N/A";
                      const lastPayment = penalty.LastPaymentDate
                        ? new Date(penalty.LastPaymentDate).toLocaleDateString("en-GB")
                        : "N/A";

                      return (
                        <tr key={penalty.PenaltyID}>
                          <td data-label="Penalty ID">{penalty.PenaltyID}</td>
                          <td data-label="Issued Date">{issuedDate}</td>
                          <td data-label="Last Payment Date">{lastPayment}</td>
                          <td data-label="Amount (₺)">
                            ₺
                            {typeof penalty.Amount === "number"
                              ? penalty.Amount.toFixed(2)
                              : penalty.Amount}
                          </td>
                          <td data-label="Reason">{penalty.Reason || "N/A"}</td>
                          <td data-label="Product ID">{penalty.ProductID || "N/A"}</td>

                          <td data-label="Status">{penalty.Status || "N/A"}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="placeholder-text">
                        {searchTerm
                          ? "No penalties match your search."
                          : "No penalties available."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {filteredPenalties.length > itemsPerPage && (
            <div className="pagination-controls">
              <button onClick={goToPrev} disabled={currentPage === 1}>
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={goToNext} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          )}
        </div>
          <div className="section4 m-5">
            <div className="alert alert-warning d-flex align-items-center shadow-sm rounded">
              <i className="fas fa-info-circle fa-2x me-3"></i>
              <div>
                <p className="mb-0 fw-medium">
                  Please contact responsible government staff to pay the penalties.
                </p>
              </div>
            </div>
          </div>
        </div>

      <Footer />
    </>
  );
};

export default Penalties;
