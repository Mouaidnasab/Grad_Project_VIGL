import React, { useState, useEffect, useRef } from "react";
import { Users, PlusCircle, MoreHorizontal, Edit3 } from "lucide-react";
import {
  CommonTopBar,
  AddStaffModal,
  EditStaffModal,
} from "./CommonComponents";
import { createPortal } from "react-dom";
import api from "../Api.js";

function StaffActionMenu({ staffMember, onEdit }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const closeTimeout = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  const clearClose = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };
  const scheduleClose = () => {
    clearClose();
    closeTimeout.current = setTimeout(() => setIsOpen(false), 150);
  };

  useEffect(() => () => clearClose(), []);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let left = rect.left + window.scrollX;
    if (menuRef.current) {
      const w = menuRef.current.offsetWidth;
      left = rect.right + window.scrollX - w;
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
      <div
        ref={triggerRef}
        onMouseEnter={clearClose}
        onMouseLeave={scheduleClose}
        style={{ display: "inline-block" }}
      >
        <button
          className="action-menu-trigger"
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={() => {
            clearClose();
            setIsOpen((o) => !o);
          }}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="action-dropdown-menu"
            style={menuStyle}
            role="menu"
            onMouseEnter={clearClose}
            onMouseLeave={scheduleClose}
          >
            <button
              className="action-dropdown-item"
              role="menuitem"
              onClick={() => {
                onEdit(staffMember);
                setIsOpen(false);
              }}
            >
              <Edit3 size={16} /> <span>Edit Staff</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

export default function StaffTab() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemsPerPage] = useState(5);
  const [roleFilter, setRoleFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/users/list");
      const mapped = res.data.map((u) => ({
        id: u.UserID,
        name: `${u.FirstName} ${u.LastName}`,
        username: u.Username,
        email: u.Email,
        role: u.Role,
        status: u.Disabled ? "Inactive" : "Active",
      }));
      setStaff(mapped);
    } catch (e) {
      setError(e.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async ({
    FirstName,
    LastName,
    Username,
    Email,
    Password,
  }) => {
    try {
      await api.post("/users/create", {
        Username,
        Email,
        FirstName,
        LastName,
        Password,
        Role: "Staff",
        Disabled: false,
      });
      fetchStaff();
    } catch (e) {
      console.error("Add failed", e);
    }
  };

  const handleUpdateStaff = async ({ UserID, FirstName, LastName, Email }) => {
    try {
      const payload = {
        Email,
        FirstName,
        LastName,
      };
      await api.put(`/users/edit/${encodeURIComponent(UserID)}`, payload);
      fetchStaff();
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const openEditModal = (member) => {
    setSelectedStaff(member);
    setIsEditModalOpen(true);
  };
  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedStaff(null);
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const filtered = staff.filter((u) =>
    roleFilter === "All" ? true : u.role === roleFilter
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <section className="staff-page-content">
      <CommonTopBar title="Staff & Customer Management" />
      <div className="page-actions-header">
        <h3 className="page-section-title">
          <Users size={28} className="title-icon" /> All Users
        </h3>
        <div className="filter-container">
          <label htmlFor="role-filter">Filter by Role: </label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="Customer">Customer</option>
          </select>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="add-new-button page-main-action-button"
        >
          <PlusCircle size={18} /> Add New Staff
        </button>
      </div>

      <div className="content-panel">
        <div className="table-container">
          <table className="supermarket-table-v2">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((staffMember) => (
                <tr key={staffMember.id}>
                  <td>{staffMember.id}</td>
                  <td>{staffMember.name}</td>
                  <td>{staffMember.username}</td>
                  <td>{staffMember.email}</td>
                  <td>{staffMember.role}</td>
                  <td>
                    <span
                      className={`status-badge status-${staffMember.status.toLowerCase()}`}
                    >
                      {staffMember.status}
                    </span>
                  </td>
                  <td className="cell-actions">
                    <StaffActionMenu
                      staffMember={staffMember}
                      onEdit={openEditModal}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination-container">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={closeModals}
        onSubmit={handleAddStaff}
      />
      <EditStaffModal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        onSubmit={handleUpdateStaff}
        staffMember={selectedStaff}
      />
    </section>
  );
}
