import React, { useState, useRef, useEffect } from "react";
import { Gavel, MoreHorizontal } from "lucide-react";
import api from "../Api.js";
import { CommonTopBar, UpdatePenaltyStatusModal } from "./CommonComponents";
import { createPortal } from "react-dom";

const PenaltyActionMenu = ({ penalty, onChangeStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const closeTimeout = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  // Clear any pending close
  const clearClose = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  // Schedule menu close with a small delay
  const scheduleClose = () => {
    clearClose();
    closeTimeout.current = setTimeout(() => setIsOpen(false), 150);
  };

  // Cleanup on unmount
  useEffect(() => () => clearClose(), []);

  // Recalculate portal position when opening
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let left = rect.left + window.scrollX;
    if (menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      left = rect.right + window.scrollX - menuWidth;
    }
    setMenuStyle({
      position: "absolute",
      top: rect.bottom + window.scrollY + 4,
      left,
      zIndex: 9999,
    });
  }, [isOpen]);

  return (
    <>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onMouseEnter={clearClose}
        onMouseLeave={scheduleClose}
        style={{ display: "inline-block" }}
      >
        <button
          className="action-menu-trigger"
          onClick={() => {
            clearClose();
            setIsOpen((o) => !o);
          }}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Portal’d dropdown */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="action-dropdown-menu"
            style={menuStyle}
            onMouseEnter={clearClose}
            onMouseLeave={scheduleClose}
          >
            <button
              className="action-dropdown-item"
              onClick={() => {
                onChangeStatus(penalty);
                setIsOpen(false);
              }}
            >
              Change Status
            </button>
          </div>,
          document.body
        )}
    </>
  );
};

export default function PenaltiesTab() {
  const [penalties, setPenalties] = useState([]);
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState(null);

  // Pagination state
  const [itemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch penalties on mount
  useEffect(() => {
    const fetchPenalties = async () => {
      try {
        const { data } = await api.get("/penalty/get");
        const mapped = data.map((p) => ({
          id: p.PenaltyID,
          supermarketId: p.SupermarketID,
          productId: p.ProductID,
          reason: p.Reason,
          amount: p.Amount,
          status: p.Status,
        }));
        setPenalties(mapped);
      } catch (err) {
        console.error("Failed to load penalties", err);
      }
    };
    fetchPenalties();
  }, []);

  const handleOpenModal = (penalty) => {
    setSelectedPenalty(penalty);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPenalty(null);
  };

  // Update status both server-side and in local state
  const handleUpdateStatus = async (penaltyId, newStatus) => {
    try {
      await api.put(`/penalty/update_status/${penaltyId}/${newStatus}`);
      setPenalties((p) =>
        p.map((x) => (x.id === penaltyId ? { ...x, status: newStatus } : x))
      );
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      handleCloseModal();
    }
  };

  // Apply filter and pagination
  const filtered = penalties.filter(
    (p) => filter === "All" || p.status === filter
  );
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <section className="penalties-page-content">
      <CommonTopBar title="Penalties Management" />

      <div className="page-actions-header">
        <h3 className="page-section-title">
          <Gavel size={28} className="title-icon" />
          All Penalties
        </h3>
        <div className="filter-container">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Late">Late</option>
          </select>
        </div>
      </div>

      <div className="content-panel">
        <div className="table-container">
          <table className="supermarket-table-v2">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supermarket ID</th>
                <th>Product ID</th>
                <th>Reason</th>
                <th>Amount (₺)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.supermarketId}</td>
                  <td>{p.productId}</td>
                  <td>{p.reason}</td>
                  <td style={{ textAlign: "start" }}>{p.amount.toFixed(2)}</td>
                  <td>
                    <span
                      className={`status-badge status-${p.status.toLowerCase()}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="cell-actions">
                    <PenaltyActionMenu
                      penalty={p}
                      onChangeStatus={() => handleOpenModal(p)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-container">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <UpdatePenaltyStatusModal
        isOpen={isModalOpen}
        penalty={selectedPenalty}
        onClose={handleCloseModal}
        onSubmit={({ id, status }) => handleUpdateStatus(id, status)}
      />
    </section>
  );
}
