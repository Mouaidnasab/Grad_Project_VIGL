import React, { useState, useEffect } from "react";
import "../Css/ManageProducts.css";
import BootstrapNavbar from "../component/BootstrapNavbar";
import Footer from "../component/footerInit.jsx";
import "@fortawesome/fontawesome-free/css/all.min.css";
import api from "../Api.js";
import { Link } from "react-router-dom";

const Manage = () => {
  const [activeTab, setActiveTab] = useState("shelves");
  const [selectedShelf, setSelectedShelf] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false);
  const [isScreenDropdownOpen, setIsScreenDropdownOpen] = useState(false);
  const [relations, setRelations] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [screens, setScreens] = useState([]);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
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
      const response = await api.get("/shelf/get");
      setShelves(response.data);
    } catch (error) {
      console.error("Error fetching shelves:", error);
    }
  };

  const fetchScreens = async () => {
    try {
      const response = await api.get("/screen/get");
      setScreens(response.data);
    } catch (error) {
      console.error("Error fetching screens:", error);
    }
  };

  const fetchRelations = async () => {
    try {
      const response = await api.get("/shelf/get_relations");
      setRelations(response.data);
    } catch (error) {
      console.error("Error fetching relations:", error);
    }
  };

  const handleAddShelf = async (e) => {
    e.preventDefault();
    const form = e.target;
    const barcode = parseInt(form.barcode.value.trim());
    const isle = form.isle.value.trim();
    const floor = form.floor.value.trim();
    const section = form.section.value.trim();
    const description = form.description.value.trim();

    if (isNaN(barcode) || !barcode) {
      alert("Shelf Barcode must be a valid number.");
      return;
    }
    if (shelves.some((s) => s.ShelfID === barcode)) {
      alert(`Shelf with Barcode ${barcode} already exists.`);
      return;
    }

    try {
      await api.post("/shelf/add", {
        ShelfID: barcode,
        Isle: isle,
        Floor: floor,
        Section: section,
        Description: description,
      });
      await fetchShelves();
      form.reset();
      alert("Shelf added successfully!");
    } catch (error) {
      console.error("Error adding shelf:", error);
      alert("Failed to add shelf.");
    }
  };

  const handleAddScreen = async (e) => {
    e.preventDefault();
    const form = e.target;
    const barcode = parseInt(form.barcode.value.trim());
    const ip = form.ip.value.trim();
    const description = form.description.value.trim();

    if (isNaN(barcode) || !barcode) {
      alert("Screen Barcode must be a valid number.");
      return;
    }
    if (screens.some((s) => s.ScreenID === barcode)) {
      alert(`Screen with Barcode ${barcode} already exists.`);
      return;
    }
    if (
      !/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ip
      )
    ) {
      alert("Please enter a valid IP address.");
      return;
    }

    try {
      await api.post("/screen/add", {
        ScreenID: barcode,
        IP: ip,
        Description: description,
      });
      await fetchScreens();
      form.reset();
      alert("Screen added successfully!");
    } catch (error) {
      console.error("Error adding screen:", error);
      alert("Failed to add screen.");
    }
  };

  const handleCreateRelation = async (e) => {
    e.preventDefault();

    if (!selectedShelf || selectedShelf === "") {
      alert("Please select a shelf.");
      return;
    }
    if (!selectedScreen || selectedScreen === "") {
      alert("Please select a screen (or Unassigned).");
      return;
    }

    const shelfIdInt = parseInt(selectedShelf);
    const screenIdInt = parseInt(selectedScreen);

    if (
      relations.some(
        (rel) => rel.ShelfID === shelfIdInt && rel.ScreenID === screenIdInt
      )
    ) {
      alert("This shelf is already related to this screen status.");
      return;
    }

    try {
      await api.post("/shelf/create_relation_screen", {
        shelf_id: shelfIdInt,
        screen_id: screenIdInt,
      });
      await fetchRelations();
      setSelectedShelf("");
      setSelectedScreen("");
      alert("Relation created successfully!");
    } catch (error) {
      console.error("Error creating relation:", error);
      alert("Failed to create relation.");
    }
  };

  const handleEditRelation = (id, currentScreenId) => {
    setEditingRelationId(id);
    setEditedScreenId(String(currentScreenId));
  };

  const handleUpdateRelation = async (id) => {
    const relationToUpdate = relations.find(
      (rel) => rel.ProductScreenID === id
    );
    if (!relationToUpdate) return;

    if (
      editedScreenId === null ||
      editedScreenId === undefined ||
      editedScreenId === ""
    ) {
      alert(
        "A screen selection (including 'Unassigned') is required to update the relation."
      );
      return;
    }

    const newScreenIdInt = parseInt(editedScreenId);
    if (isNaN(newScreenIdInt)) {
      alert(
        "Invalid Screen ID format. Please select a valid screen or 'Unassigned'."
      );
      return;
    }

    if (
      relations.some(
        (rel) =>
          rel.ShelfID === relationToUpdate.ShelfID &&
          rel.ScreenID === newScreenIdInt &&
          rel.ProductScreenID !== id
      )
    ) {
      alert(
        `Shelf ${
          relationToUpdate.ShelfID
        } is already actively related to Screen ${
          newScreenIdInt === 0 ? "Unassigned" : newScreenIdInt
        } via a different record.`
      );
      return;
    }

    try {
      await api.put("/shelf/update_relation_screen", {
        shelf_id: relationToUpdate.ShelfID,
        screen_id: newScreenIdInt,
      });
      await fetchRelations();
      setEditingRelationId(null);
      setEditedScreenId("");
      alert("Relation updated successfully!");
    } catch (error) {
      console.error("Error updating relation:", error);
      alert("Failed to update relation.");
    }
  };

  const handleShowDeleteConfirmation = (id) => {
    setRelationToDelete(id);
    setIsDeleteConfirmationVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!relationToDelete) return;
    try {
      await api.delete(`/shelf/delete_relation/${relationToDelete}`);
      setRelations((prev) =>
        prev.filter((rel) => rel.ProductScreenID !== relationToDelete)
      );
      setIsDeleteConfirmationVisible(false);
      setRelationToDelete(null);
      alert("Relation deleted successfully!");
    } catch (error) {
      console.error("Error deleting relation:", error);
      alert("Failed to delete relation.");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmationVisible(false);
    setRelationToDelete(null);
  };

  const handleSelectShelf = (shelfId) => {
    setSelectedShelf(String(shelfId));
    setIsShelfDropdownOpen(false);
  };

  const handleSelectScreen = (screenId) => {
    setSelectedScreen(String(screenId));
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

  return (
    <>
      <BootstrapNavbar />
      <div className="manage-container">
        <header className="manage-header">
          <h1 className="borderh1">Manage Shelves and Screens</h1>
        </header>

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

        <div className="manage-content1">
          {activeTab === "shelves" && (
            <>
              <div className="section1">
                <h2>
                  <i className="fas fa-boxes-stacked header-icon"></i> Add New
                  Shelf
                </h2>
                <form onSubmit={handleAddShelf}>
                  <input
                    type="text"
                    name="barcode"
                    placeholder="Enter Shelf Barcode"
                    required
                  />
                  <input
                    type="text"
                    name="isle"
                    placeholder="Enter Shelf Isle"
                    required
                  />
                  <input
                    type="text"
                    name="floor"
                    placeholder="Enter Shelf Floor"
                    required
                  />
                  <input
                    type="text"
                    name="section"
                    placeholder="Enter Shelf Section"
                    required
                  />
                  <textarea
                    className="custom-textarea1"
                    name="description"
                    placeholder="Enter Description"
                  ></textarea>
                  <button type="submit">Add Shelf</button>
                </form>
              </div>

              <div className="section1">
                <h2>
                  <i className="fas fa-display header-icon"></i> Add New Screen
                </h2>
                <form onSubmit={handleAddScreen}>
                  <input
                    type="text"
                    name="barcode"
                    placeholder="Enter Screen Barcode"
                    required
                  />
                  <input
                    type="text"
                    name="ip"
                    placeholder="Enter Screen IP"
                    required
                  />
                  <textarea
                    className="custom-textarea-screen"
                    name="description"
                    placeholder="Enter Description"
                  ></textarea>
                  <button type="submit">Add Screen</button>
                  <Link
                    to="/screen-template"
                    style={{ textDecoration: "none" }}
                  >
                    <button
                      style={{
                        width: "100%",
                        color: "black",
                        backgroundColor: "white",
                      }}
                    >
                      Create Screen Template
                    </button>
                  </Link>
                </form>
              </div>
            </>
          )}

          {activeTab === "relations" && (
            <div className="section2">
              <h2>
                <i className="fas fa-link header-icon2"></i> Create Relations
              </h2>
              <form onSubmit={handleCreateRelation}>
                <div className="dropdown-container2">
                  <label htmlFor="shelf-select">Select Shelf</label>
                  <div
                    className={`custom-dropdown2 ${
                      isShelfDropdownOpen ? "open2" : ""
                    }`}
                    id="shelf-select"
                  >
                    <div
                      className="dropdown-selected2"
                      onClick={toggleShelfDropdown}
                    >
                      {selectedShelf
                        ? shelves.find(
                            (s) => s.ShelfID === parseInt(selectedShelf)
                          )?.ShelfID || selectedShelf
                        : "Select Shelf"}
                    </div>
                    {isShelfDropdownOpen && (
                      <div className="dropdown-options2">
                        {shelves.map((shelf) => (
                          <div
                            key={shelf.ShelfID}
                            className="dropdown-option2"
                            onClick={() => handleSelectShelf(shelf.ShelfID)}
                          >
                            {shelf.ShelfID} - Isle:{shelf.Isle} - Floor:
                            {shelf.Floor} - Section:{shelf.Section}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="dropdown-container2">
                  <label htmlFor="screen-select">Select Screen</label>
                  <div
                    className={`custom-dropdown2 ${
                      isScreenDropdownOpen ? "open2" : ""
                    }`}
                    id="screen-select"
                  >
                    <div
                      className="dropdown-selected2"
                      onClick={toggleScreenDropdown}
                    >
                      {selectedScreen
                        ? selectedScreen === "0"
                          ? "Unassigned"
                          : screens.find(
                              (s) => s.ScreenID === parseInt(selectedScreen)
                            )?.ScreenID || selectedScreen
                        : "Select Screen"}
                    </div>
                    {isScreenDropdownOpen && (
                      <div className="dropdown-options2">
                        <div
                          className="dropdown-option2"
                          onClick={() => handleSelectScreen("0")}
                        >
                          Unassigned
                        </div>
                        {screens.map((screen) => (
                          <div
                            key={screen.ScreenID}
                            className="dropdown-option2"
                            onClick={() => handleSelectScreen(screen.ScreenID)}
                          >
                            {screen.ScreenID} - {screen.IP}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="create-relation-button2">
                  Create Relation
                </button>
              </form>
            </div>
          )}

          {activeTab === "manageRelations" && (
            <div className="section3">
              <h2>
                <i className="fas fa-sitemap header-icon3"></i> Manage Relations
              </h2>
              <div className="relations-table-container3">
                <table className="relations-table3">
                  <thead>
                    <tr>
                      <th>Relation ID</th>
                      <th>Shelf ID</th>
                      <th>Screen ID</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relations.map((relation) => (
                      <tr key={relation.ProductScreenID}>
                        <td data-label="Relation ID">
                          {relation.ProductScreenID}
                        </td>
                        <td data-label="Shelf ID">{relation.ShelfID}</td>
                        <td data-label="Screen ID">
                          {editingRelationId === relation.ProductScreenID ? (
                            <div className="dropdown-container3">
                              <select
                                value={editedScreenId}
                                onChange={(e) =>
                                  setEditedScreenId(e.target.value)
                                }
                              >
                                <option value="0">Unassigned</option>
                                {screens.map((screen) => (
                                  <option
                                    key={screen.ScreenID}
                                    value={String(screen.ScreenID)}
                                  >
                                    {screen.ScreenID} - {screen.IP}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : relation.ScreenID === 0 ? (
                            "Unassigned"
                          ) : (
                            `${relation.ScreenID}`
                          )}
                        </td>
                        <td data-label="Last Updated">
                          {new Date(relation.ChangedAt).toLocaleString()}
                        </td>
                        <td data-label="Actions">
                          {editingRelationId === relation.ProductScreenID ? (
                            <>
                              <button
                                className="save-button3"
                                onClick={() =>
                                  handleUpdateRelation(relation.ProductScreenID)
                                }
                                disabled={
                                  editedScreenId === String(relation.ScreenID)
                                }
                              >
                                <i className="fas fa-save"></i> Save
                              </button>
                              <button
                                className="delete-button"
                                onClick={() => {
                                  setEditingRelationId(null);
                                  setEditedScreenId("");
                                }}
                              >
                                <i className="fas fa-times"></i> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="edit-button3"
                                onClick={() =>
                                  handleEditRelation(
                                    relation.ProductScreenID,
                                    relation.ScreenID
                                  )
                                }
                              >
                                <i className="fas fa-pen"></i> Edit
                              </button>
                              <button
                                className="delete-button"
                                onClick={() =>
                                  handleShowDeleteConfirmation(
                                    relation.ProductScreenID
                                  )
                                }
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {isDeleteConfirmationVisible && (
          <div className="delete-confirmation-modal modal-overlay">
            <div className="modal-content">
              <h3>Are you sure you want to delete this relation?</h3>
              <div className="modal-actions">
                <button className="button-cancel" onClick={handleCancelDelete}>
                  Cancel
                </button>
                <button className="button-submit" onClick={handleConfirmDelete}>
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
