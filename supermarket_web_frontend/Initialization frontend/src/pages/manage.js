import React, { useState } from "react";
import Navbar from "../components/Navbar"; // Import the Navbar component
import "./Manage.css";
import Footer from "../components/footerInit";
import '@fortawesome/fontawesome-free/css/all.min.css';

const Manage = () => {
  // State to store the QR codes for shelf and screen
  const [shelfQRCode, setShelfQRCode] = useState(null);
  const [screenQRCode, setScreenQRCode] = useState(null);

  // State to track the active tab
  const [activeTab, setActiveTab] = useState("shelves");

  // State to store the selected shelf and screen
  const [selectedShelf, setSelectedShelf] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");

  // State to control the visibility of the dropdowns
  const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false);
  const [isScreenDropdownOpen, setIsScreenDropdownOpen] = useState(false);

  // Sample data for the table in Manage Relations tab
  const [relations, setRelations] = useState([
    {
      id: 1,
      shelfName: "Shelf 1",
      screenName: "Screen 1",
      registerDate: "2024-12-01",
    },
    {
      id: 2,
      shelfName: "Shelf 2",
      screenName: "Screen 2",
      registerDate: "2024-12-02",
    },
  ]);

  // State for delete confirmation
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);
  const [relationToDelete, setRelationToDelete] = useState(null);

  // Handle QR code upload for shelf or screen
  const handleQRCodeUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (type === "shelf") {
          setShelfQRCode(reader.result);
        } else {
          setScreenQRCode(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle shelf selection
  const handleSelectShelf = (shelf) => {
    setSelectedShelf(shelf); // Update selected shelf
    setIsShelfDropdownOpen(false); // Close dropdown after selection
  };

  // Handle screen selection
  const handleSelectScreen = (screen) => {
    setSelectedScreen(screen); // Update selected screen
    setIsScreenDropdownOpen(false); // Close dropdown after selection
  };

  // Toggle shelf dropdown visibility
  const toggleShelfDropdown = () => {
    setIsShelfDropdownOpen((prev) => !prev);
  };

  // Toggle screen dropdown visibility
  const toggleScreenDropdown = () => {
    setIsScreenDropdownOpen((prev) => !prev);
  };

  // Handle tab click to switch between tabs
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handle editing of a relation
  const handleEditRelation = (id) => {
    alert(`Edit relation with ID: ${id}`);
    // Add logic to edit the relation
  };

  // Handle showing the delete confirmation modal
  const handleShowDeleteConfirmation = (id) => {
    setRelationToDelete(id);
    setIsDeleteConfirmationVisible(true);
  };

  // Handle confirming deletion of a relation
  const handleConfirmDelete = () => {
    setRelations((prevRelations) => prevRelations.filter((rel) => rel.id !== relationToDelete));
    setIsDeleteConfirmationVisible(false);
    setRelationToDelete(null);
  };

  // Handle canceling deletion
  const handleCancelDelete = () => {
    setIsDeleteConfirmationVisible(false);
    setRelationToDelete(null);
  };

  return (
    <>
      <Navbar />
      <div className="manage-container">
        <header className="manage-header">
          <h1 className="borderh1">Manage Shelves and Screens</h1>
        </header>

        {/* Tab buttons for navigation */}
        <div className="manage-tabs">
          <button
            className={`tab ${activeTab === "shelves" ? "active" : ""}`}
            onClick={() => handleTabClick("shelves")}
          >
            Add Shelves/Screens
          </button>
          <button
            className={`tab ${activeTab === "relations" ? "active" : ""}`}
            onClick={() => handleTabClick("relations")}
          >
            Create Relations
          </button>
          <button
            className={`tab ${activeTab === "manageRelations" ? "active" : ""}`}
            onClick={() => handleTabClick("manageRelations")}
          >
            Manage Relations
          </button>
        </div>

        {/* Content for Add Shelves/Screens tab */}
        <div className="manage-content">
          {activeTab === "shelves" && (
            <>
              <div className="section">
                <h2>Add New Shelf</h2>
                <form>
                  <input type="text" placeholder="Enter Shelf Name" />
                  <input type="text" placeholder="Enter Serial Number" />
                  <div className="qr-code-container">
                    <div className="qr-code-preview">
                      {shelfQRCode ? (
                        <img src={shelfQRCode} alt="Shelf QR Code" />
                      ) : (
                        <span>Preview will appear here</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleQRCodeUpload(e, "shelf")}
                    />
                  </div>
                  <textarea className="custom-textarea" placeholder="Enter Description"></textarea>
                  <button type="submit">Add Shelf</button>
                </form>
              </div>

              <div className="section">
                <h2>Add New Screen</h2>
                <form>
                  <input type="text" placeholder="Enter Screen Name" />
                  <input type="text" placeholder="Enter Serial Number" />
                  <div className="qr-code-container">
                    <div className="qr-code-preview">
                      {screenQRCode ? (
                        <img src={screenQRCode} alt="Screen QR Code" />
                      ) : (
                        <span>Preview will appear here</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleQRCodeUpload(e, "screen")}
                    />
                  </div>
                  <textarea className="custom-textarea" placeholder="Enter Description"></textarea>
                  <button type="submit">Add Screen</button>
                </form>
              </div>
            </>
          )}

          {/* Content for Create Relations tab */}
          {activeTab === "relations" && (
            <div className="section">
              <h2>Create Relations</h2>
              <form>
                <div className="dropdown-container">
                  <label htmlFor="shelf-select">Select Shelf</label>
                  <div className="custom-dropdown" id="shelf-select">
                    <div className="dropdown-selected" onClick={toggleShelfDropdown}>
                      {selectedShelf || "Select Shelf"}
                    </div>
                    {isShelfDropdownOpen && (
                      <div className="dropdown-options">
                        <div
                          className="dropdown-option"
                          onClick={() => handleSelectShelf("shelf1")}
                        >
                          Shelf 1
                        </div>
                        <div
                          className="dropdown-option"
                          onClick={() => handleSelectShelf("shelf2")}
                        >
                          Shelf 2
                        </div>
                        <div
                          className="dropdown-option"
                          onClick={() => handleSelectShelf("shelf3")}
                        >
                          Shelf 3
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="dropdown-container">
                  <label htmlFor="screen-select">Select Screen</label>
                  <div className="custom-dropdown" id="screen-select">
                    <div className="dropdown-selected" onClick={toggleScreenDropdown}>
                      {selectedScreen || "Select Screen"}
                    </div>
                    {isScreenDropdownOpen && (
                      <div className="dropdown-options">
                        <div
                          className="dropdown-option"
                          onClick={() => handleSelectScreen("screen1")}
                        >
                          Screen 1
                        </div>
                        <div
                          className="dropdown-option"
                          onClick={() => handleSelectScreen("screen2")}
                        >
                          Screen 2
                        </div>
                        <div
                          className="dropdown-option"
                          onClick={() => handleSelectScreen("screen3")}
                        >
                          Screen 3
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit">Create Relation</button>
              </form>
            </div>
          )}

          {/* Content for Manage Relations tab */}
          {activeTab === "manageRelations" && (
            <div className="section">
              <h2>Manage Relations</h2>
              <div className="relations-table-container">
                <table className="relations-table">
                  <thead>
                    <tr>
                      <th>Shelf Name</th>
                      <th>Screen Name</th>
                      <th>Register Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relations.map((relation) => (
                      <tr key={relation.id}>
                        <td>{relation.shelfName}</td>
                        <td>{relation.screenName}</td>
                        <td>{relation.registerDate}</td>
                        <td>
                          <button
                            className="edit-button"
                            onClick={() => handleEditRelation(relation.id)}
                          >
                            <i className="fas fa-pen"></i>
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleShowDeleteConfirmation(relation.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

         {/* Delete Confirmation Modal */}
         {isDeleteConfirmationVisible && (
          <div className="delete-confirmation-modal">
            <div className="modal-content">
              <h3>Are you sure you want to delete this relation?</h3>
              <div className="modal-actions">
                <button className="cancel-button" onClick={handleCancelDelete}>
                  Cancel
                </button>
                <button className="confirm-button" onClick={handleConfirmDelete}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
};

export default Manage;
