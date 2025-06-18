import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
} from "lucide-react";

// Shared Top Bar Component
export const CommonTopBar = ({ title }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const toggleProfileDropdown = () =>
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  const handleLogout = () => {
    console.log("Logout");
    setIsProfileDropdownOpen(false);
  };
  const currentUser = {
    name: "Admin User",
    email: "admin@example.com",
    avatarUrl: "https://placehold.co/40x40/E2E8F0/7F9CF5?text=U",
    role: "Administrator",
    profileLink: "/profile",
    settingsLink: "/settings",
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen]);

  return (
    <div className="top-bar">
      <h2 className="top-bar-title">{title}</h2>
      <div className="top-bar-search-wrapper">
        <div className="search-input-container">
          <Search size={20} className="search-input-icon" />
          <input type="text" placeholder="Search..." className="search-input" />
        </div>
      </div>
      <div className="top-bar-actions">
        <button className="notification-button" aria-label="View notifications">
          <Bell size={22} className="notification-button-icon" />
        </button>
        <div className="user-profile-container" ref={dropdownRef}>
          <button
            className="user-profile-button"
            onClick={toggleProfileDropdown}
          >
            <img
              src={currentUser.avatarUrl}
              alt="User Avatar"
              className="user-avatar"
            />
            <div className="user-info-text-wrapper">
              <p className="user-info-name">{currentUser.name}</p>
              <p className="user-info-email">{currentUser.email}</p>
            </div>
            <ChevronDown
              size={18}
              className={`user-profile-chevron ${
                isProfileDropdownOpen ? "rotate-chevron" : ""
              }`}
            />
          </button>
          {isProfileDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="dropdown-user-avatar"
                />
                <p className="dropdown-user-name">{currentUser.name}</p>
                <p className="dropdown-user-role">{currentUser.role}</p>
              </div>
              <hr className="dropdown-divider" />
              <a href={currentUser.profileLink} className="dropdown-item">
                <User size={16} className="dropdown-item-icon" /> View Profile
              </a>
              <a href={currentUser.settingsLink} className="dropdown-item">
                <Settings size={16} className="dropdown-item-icon" /> Settings
              </a>
              <hr className="dropdown-divider" />
              <button
                className="dropdown-item logout-button"
                onClick={handleLogout}
              >
                <LogOut size={16} className="dropdown-item-icon" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ========== Supermarket Tab ========= */

// Add Supermarket Modal
export const AddSupermarketModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [ownerUsername, setOwnerUsername] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactId, setContactId] = useState("");

  useEffect(() => {
    if (isOpen) {
      // reset all fields when modal opens
      setName("");
      setLocation("");
      setOwnerUsername("");
      setOwnerPassword("");
      setContactPerson("");
      setContactId("");
      setContactEmail("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (contactEmail && !emailRegex.test(contactEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    // required fields check
    if (
      !name.trim() ||
      !location.trim() ||
      !ownerUsername.trim() ||
      !ownerPassword
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    onSubmit({
      name: name.trim(),
      location: location.trim(),
      ownerUsername: ownerUsername.trim(),
      ownerPassword,
      contactPerson: contactPerson.trim() || null,
      contactEmail: contactEmail.trim() || null,
      contactId: contactId.trim() || null,
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Add New Supermarket</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Supermarket Name*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Supermarket A"
              required
            />
          </div>

          <div className="form-group">
            <label>Location / Address*</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., 123 St, City"
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Person*</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              required
              placeholder="e.g., Jane Doe"
            />
          </div>

          <div className="form-group">
            <label>Contact Person ID*</label>
            <input
              type="text"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              required
              placeholder="e.g., 123456789"
            />
          </div>

          <div className="form-group">
            <label>Owner Username*</label>
            <input
              type="text"
              value={ownerUsername}
              onChange={(e) => setOwnerUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Owner Password*</label>
            <input
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g., user@example.com"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              Add Supermarket
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Supermarket Modal
export const EditSupermarketModal = ({
  isOpen,
  onClose,
  onSubmit,
  supermarketData,
}) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactId, setContactId] = useState("");

  // Whenever we open with new data, seed the form
  useEffect(() => {
    if (isOpen && supermarketData) {
      setName(supermarketData.RegisteredName || "");
      setAddress(supermarketData.Address || "");
      setContactName(supermarketData.ContactPersonFullName || "");
      // store as string so the input stays happy
      setContactId(
        supermarketData.ContactPersonUserID != null
          ? String(supermarketData.ContactPersonUserID)
          : ""
      );
    }
  }, [isOpen, supermarketData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // basic validation
    if (!name.trim() || !address.trim()) {
      alert("Name and address are required.");
      return;
    }
    onSubmit({
      SupermarketID: supermarketData.SupermarketID,
      RegisteredName: name.trim(),
      Address: address.trim(),
      ContactPersonFullName: contactName.trim(),
      ContactPersonUserID: contactId ? parseInt(contactId, 10) : null,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Edit Supermarket</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Supermarket Name*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Address*</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Contact Person</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Contact Person User ID</label>
            <input
              type="number"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              placeholder="e.g. 12345"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              Save Changes
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========== Supermarket Tab ========= */

/* ========== Penalties Tab ========= */

// View Penalties Modal
export const ViewPenaltiesModal = ({
  isOpen,
  onClose,
  supermarketName,
  penalties,
}) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Penalties for {supermarketName}</h2>
        {!penalties || penalties.length === 0 ? (
          <p className="no-data-message">No penalties recorded.</p>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="info-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Amount (₺)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {penalties.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.issuedDate}</td>
                    <td>{p.reason}</td>
                    <td>{p.amount.toFixed(2)}</td>
                    <td>
                      <span
                        className={`status-badge status-${p.status?.toLowerCase()}`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="form-actions" style={{ marginTop: "20px" }}>
          <button type="button" className="cancel-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Update Penalty Status Modal
export const UpdatePenaltyStatusModal = ({
  isOpen,
  onClose,
  onSubmit,
  penalty,
}) => {
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (penalty) {
      setStatus(penalty.status);
    }
  }, [penalty]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...penalty, status });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Update Penalty Status</h2>
        <p className="ppenalty">
          <strong>Supermarket:</strong> {penalty?.supermarket}
        </p>
        <p className="ppenalty">
          <strong>Product:</strong> {penalty?.product}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Late">Late</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              Update Status
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========== Products Tab ========= */

// View Products Modal
export const ViewProductsModal = ({
  isOpen,
  onClose,
  supermarketName,
  products,
}) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Products at {supermarketName}</h2>
        {!products || products.length === 0 ? (
          <p className="no-data-message">No products listed.</p>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="info-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price (₺)</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="form-actions" style={{ marginTop: "20px" }}>
          <button type="button" className="cancel-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Product Modal
export const AddProductModal = ({ isOpen, onClose, onSubmit }) => {
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [threshold, setThreshold] = useState("");

  useEffect(() => {
    if (isOpen) {
      setBarcode("");
      setCategoryId(1);
      setName("");
      setDescription("");
      setPrice("");
      setThreshold("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const priceValue = parseFloat(price);
    const thresholdValue = parseInt(threshold, 10);
    if (isNaN(priceValue) || isNaN(thresholdValue)) {
      alert("Please enter valid numbers for Price and Threshold.");
      return;
    }

    if (!barcode.trim() || !name.trim()) {
      alert("Barcode and Product Name are required");
      return;
    }

    onSubmit({
      barcode,
      categoryId,
      name,
      description,
      price: priceValue,
      threshold: thresholdValue,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Add New Product</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Barcode*</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Product Name*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Category*</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              ScreenUpdateRequest
              <option value={1}>Fruits</option>
              <option value={2}>Vegetables</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="form-group">
            <label>Price (₺)*</label>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Threshold (%)*</label>
            <input
              type="number"
              min="0"
              max="200"
              value={threshold}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 200) {
                  setThreshold(value);
                }
              }}
              required
              onKeyUp={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              Add Product
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Product Modal
export const EditProductModal = ({ isOpen, onClose, onSubmit, product }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [threshold, setThreshold] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setDescription(product.description);
      setThreshold(Math.round((product.threshold / product.price - 1) * 100));
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const thresholdValue = parseInt(threshold, 10);
    if (isNaN(thresholdValue)) {
      alert("Please enter a valid number for Threshold.");
      return;
    }

    onSubmit({
      ...product,
      name,
      description,
      threshold: thresholdValue,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Edit Product Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: "vertical" }}
            ></textarea>
          </div>

          <div className="form-group">
            <label>Threshold (%)*</label>
            <input
              type="number"
              min="0"
              max="200"
              value={threshold}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 200) {
                  setThreshold(value);
                }
              }}
              required
              onKeyUp={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              Save Changes
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Price Modal
export const EditPriceModal = ({ isOpen, onClose, onSubmit, product }) => {
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (product) {
      setPrice(product.price);
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const priceValue = parseFloat(price);
    if (isNaN(priceValue)) {
      alert("Please enter a valid number for Price.");
      return;
    }

    onSubmit({ ...product, price: priceValue });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Edit Price for {product?.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Price (₺)</label>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              Save Price
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SuggestedProductsModal = ({
  isOpen,
  suggestions,
  onClose,
  onFieldChange,
  onAccept,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-xlg"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Suggested Products</h2>

        <div
          className="table-responsive-wrapper-sug"
          style={{ overflowX: "auto" }}
        >
          <table className="info-table" style={{ minWidth: "900px" }}>
            <thead>
              <tr>
                <th style={{ minWidth: "50px" }}>ID</th>
                <th style={{ minWidth: "100px" }}>Suppermarket</th>
                <th style={{ minWidth: "120px" }}>Category</th>
                <th style={{ minWidth: "150px" }}>Name</th>
                <th style={{ minWidth: "200px" }}>Description</th>
                <th style={{ minWidth: "120px" }}>Barcode</th>
                <th style={{ minWidth: "100px" }}>Price (₺)</th>
                <th style={{ minWidth: "100px" }}>Threshold (%)</th>
                <th style={{ minWidth: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    No suggestions available.
                  </td>
                </tr>
              )}
              {suggestions.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.Suppermarket}</td>
                  <td>{s.CategoryName}</td>
                  <td>{s.ProductName}</td>
                  <td style={{ wordBreak: "break-word" }}>{s.Description}</td>

                  <td>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        type="text"
                        value={s.barcode}
                        onChange={(e) =>
                          onFieldChange(s.id, "barcode", e.target.value)
                        }
                      />
                    </div>
                  </td>

                  <td>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        type="number"
                        value={s.price}
                        onChange={(e) =>
                          onFieldChange(s.id, "price", e.target.value)
                        }
                      />
                    </div>
                  </td>

                  <td>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={s.threshold}
                        onChange={(e) =>
                          // clamp just in case
                          onFieldChange(
                            s.id,
                            "threshold",
                            Math.max(0, Math.min(200, Number(e.target.value)))
                          )
                        }
                      />
                    </div>
                  </td>

                  <td>
                    <div className="form-actions" style={{ margin: 0 }}>
                      <button
                        type="button"
                        className="submit-button"
                        onClick={() => onAccept(s.id)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => onReject(s.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========== Products Tab ========= */

/* ========== Staff Tab ========= */

// Add Staff Modal
export const AddStaffModal = ({ isOpen, onClose, onSubmit }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !username || !email || !password) {
      alert("Please fill out all required fields.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email.");
      return;
    }
    onSubmit({
      Username: username,
      Email: email,
      FirstName: firstName,
      LastName: lastName,
      Password: password,
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Add New Staff Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name*</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name*</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Username*</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email*</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password*</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              Add Staff
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Staff Modal
export const EditStaffModal = ({ isOpen, onClose, onSubmit, staffMember }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (staffMember) {
      const [first, ...rest] = staffMember.name.split(" ");
      setFirstName(first);
      setLastName(rest.join(" "));
      setEmail(staffMember.email);
    }
  }, [staffMember]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      alert("Please enter a valid email.");
      return;
    }
    onSubmit({
      UserID: staffMember.id,
      Email: email,
      FirstName: firstName,
      LastName: lastName,
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Edit Staff Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <p style={{ fontSize: 12, color: "#6b7280" }}>
            Note: Password changes aren’t supported here.
          </p>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              Save Changes
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
/* ========== Staff Tab ========= */
