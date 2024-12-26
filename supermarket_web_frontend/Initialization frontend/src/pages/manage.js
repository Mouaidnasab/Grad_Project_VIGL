import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar"; // Import the Navbar component
import "./Manage.css";
import Footer from "../components/footerInit";
import '@fortawesome/fontawesome-free/css/all.min.css';
import api from '../api'; // Assuming api is set up in ../api

const Manage = () => {
  const [shelfQRCode, setShelfQRCode] = useState(null);
  const [screenQRCode, setScreenQRCode] = useState(null);
  const [activeTab, setActiveTab] = useState("shelves");
  const [selectedShelf, setSelectedShelf] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false);
  const [isScreenDropdownOpen, setIsScreenDropdownOpen] = useState(false);
  const [relations, setRelations] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [screens, setScreens] = useState([]);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);
  const [relationToDelete, setRelationToDelete] = useState(null);
  const [editingRelationId, setEditingRelationId] = useState(null);
  const [editedScreenId, setEditedScreenId] = useState("");

  useEffect(() => {
    fetchShelves();
    fetchScreens();
    fetchRelations();
  }, []);

  const fetchShelves = async () => {
    try {
      const response = await api.get('/shelf/get');
      setShelves(response.data);
    } catch (error) {
      console.error('Error fetching shelves:', error);
    }
  };

  const fetchScreens = async () => {
    try {
      const response = await api.get('/screen/get');
      setScreens(response.data);
    } catch (error) {
      console.error('Error fetching screens:', error);
    }
  };

  const fetchRelations = async () => {
    try {
      const response = await api.get('/shelf/get_relations');
      setRelations(response.data);
    } catch (error) {
      console.error('Error fetching relations:', error);
    }
  };

  const handleAddShelf = async (e) => {
    e.preventDefault();
    const form = e.target;
    const barcode = form.barcode.value;
    const isle = form.isle.value;
    const floor = form.floor.value;
    const section = form.section.value;
    const description = form.description.value;
    try {
      const response = await api.post('/shelf/add', {
        ShelfID: parseInt(barcode),
        Isle: isle,
        Floor: floor,
        Section: section,
        Description: description
      });
      console.log('Shelf added:', response.data);
      fetchShelves();
      form.reset();
      setShelfQRCode(null);
    } catch (error) {
      console.error('Error adding shelf:', error);
    }
  };

  const handleAddScreen = async (e) => {
    e.preventDefault();
    const form = e.target;
    const barcode = form.barcode.value;
    const ip = form.ip.value;
    const description = form.description.value;
    try {
      const response = await api.post('/screen/add', {
        ScreenID: parseInt(barcode),
        IP: ip,
        Description: description
      });
      console.log('Screen added:', response.data);
      fetchScreens();
      form.reset();
      setScreenQRCode(null);
    } catch (error) {
      console.error('Error adding screen:', error);
    }
  };

  const handleCreateRelation = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/shelf/create_relation_screen', {
        shelf_id: parseInt(selectedShelf),
        screen_id: parseInt(selectedScreen)
      });
      console.log('Relation created:', response.data);
      fetchRelations();
      fetchShelves();
      fetchScreens();
      setSelectedShelf("");
      setSelectedScreen("");
    } catch (error) {
      console.error('Error creating relation:', error);
    }
  };

  const handleEditRelation = (id, currentScreenId) => {
    setEditingRelationId(id);
    setEditedScreenId(currentScreenId);
  };

  const handleUpdateRelation = async (id) => {
    try {
      const response = await api.put('/shelf/update_relation_screen', {
        shelf_id: parseInt(relations.find(rel => rel.ProductScreenID === id).ShelfID),
        screen_id: parseInt(editedScreenId)
      });
      console.log('Relation updated:', response.data);
      fetchRelations();
      fetchScreens();
      setEditingRelationId(null);
      setEditedScreenId("");
    } catch (error) {
      console.error('Error updating relation:', error);
    }
  };

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

  const handleSelectShelf = (shelf) => {
    setSelectedShelf(shelf);
    setIsShelfDropdownOpen(false);
  };

  const handleSelectScreen = (screen) => {
    setSelectedScreen(screen);
    setIsScreenDropdownOpen(false);
  };

  const toggleShelfDropdown = () => {
    setIsShelfDropdownOpen((prev) => !prev);
  };

  const toggleScreenDropdown = () => {
    setIsScreenDropdownOpen((prev) => !prev);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleShowDeleteConfirmation = (id) => {
    setRelationToDelete(id);
    setIsDeleteConfirmationVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/shelf/delete_relation/${relationToDelete}`);
      setRelations((prevRelations) => prevRelations.filter((rel) => rel.ProductScreenID !== relationToDelete));
      setIsDeleteConfirmationVisible(false);
      setRelationToDelete(null);
    } catch (error) {
      console.error('Error deleting relation:', error);
    }
  };

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
                <form onSubmit={handleAddShelf}>
                  <input type="text" name="barcode" placeholder="Enter Shelf Barcode" required />
                  <input type="text" name="isle" placeholder="Enter Shelf Isle" required />
                  <input type="text" name="floor" placeholder="Enter Shelf Floor" required />
                  <input type="text" name="section" placeholder="Enter Shelf Section" required />
                  <textarea className="custom-textarea" name="description" placeholder="Enter Description"></textarea>
                  <button type="submit">Add Shelf</button>
                </form>
              </div>

              <div className="section">
                <h2>Add New Screen</h2>
                <form onSubmit={handleAddScreen}>
                  <input type="text" name="barcode" placeholder="Enter Screen Barcode" required />
                  <input type="text" name="ip" placeholder="Enter Screen IP" required />
                  <textarea className="custom-textarea" name="description" placeholder="Enter Description"></textarea>
                  <button type="submit">Add Screen</button>
                </form>
              </div>
            </>
          )}

          {/* Content for Create Relations tab */}
          {activeTab === "relations" && (
            <div className="section">
              <h2>Create Relations</h2>
              <form onSubmit={handleCreateRelation}>
                <div className="dropdown-container">
                  <label htmlFor="shelf-select">Select Shelf</label>
                  <div className="custom-dropdown" id="shelf-select">
                    <div className="dropdown-selected" onClick={toggleShelfDropdown}>
                      {selectedShelf || "Select Shelf"}
                    </div>
                    {isShelfDropdownOpen && (
                      <div className="dropdown-options">
                        {shelves.map((shelf) => (
                          <div
                            key={shelf.ShelfID}
                            className="dropdown-option"
                            onClick={() => handleSelectShelf(shelf.ShelfID)}
                          >
                            {shelf.ShelfID}
                          </div>
                        ))}
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
                        {screens.map((screen) => (
                          <div
                            key={screen.ScreenID}
                            className="dropdown-option"
                            onClick={() => handleSelectScreen(screen.ScreenID)}
                          >
                            {screen.ScreenID}
                          </div>
                        ))}
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
                      <th>Shelf Barcode</th>
                      <th>Screen Barcode</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {relations.map((relation) => (
                    <tr key={relation.ProductScreenID}>
                      <td>{relation.ShelfID}</td>
                      <td>
                        {editingRelationId === relation.ProductScreenID ? (
                          <div className="dropdown-container">
                            <select
                              value={editedScreenId}
                              onChange={(e) => setEditedScreenId(e.target.value)}
                            >
                              <option value="">Select Screen</option>
                              {screens.map((screen) => (
                                <option key={screen.ScreenID} value={screen.ScreenID}>
                                  {screen.ScreenID}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          relation.ScreenID
                        )}
                      </td>
                      <td>
                        {editingRelationId === relation.ProductScreenID ? (
                          <button
                            className="save-button"
                            onClick={() => handleUpdateRelation(relation.ProductScreenID)}
                          >
                            <i className="fas fa-save"></i>
                          </button>
                        ) : (
                          <button
                            className="edit-button"
                            onClick={() => handleEditRelation(relation.ProductScreenID, relation.ScreenID)}
                          >
                            <i className="fas fa-pen"></i>
                          </button>
                        )}
                        {/* <button
                            className="delete-button"
                            onClick={() => handleShowDeleteConfirmation(relation.ProductScreenID)}
                          >
                            <i className="fas fa-trash"></i>
                          </button> */}
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
