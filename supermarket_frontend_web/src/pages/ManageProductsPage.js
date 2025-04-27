import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/footerInit";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./Manage.css";
import api from "../api";

const ManageProducts = () => {
  const [activeTab, setActiveTab] = useState("storeProducts");
  const [products, setProducts] = useState([]);
  const [relations, setRelations] = useState([]);
  const [displayShelves, setDisplayShelves] = useState([]);
  const [unshelvedProducts, setUnshelvedProducts] = useState([]);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // form state for the suggestion
  const [suggestForm, setSuggestForm] = useState({
    ProductName: "",
    CategoryID: 1,
    CategoryName: "Fruits",
    Description: "",
    SuggestedPrice: "",
    Suppermarket: "",
  });

  const openSuggestModal = () => setShowSuggestModal(true);
  const closeSuggestModal = () => setShowSuggestModal(false);

  const handleSuggestChange = (e) => {
    const { name, value } = e.target;
    if (name === "CategoryID") {
      const nameMap = { 1: "Fruits", 2: "Vegetables" };
      setSuggestForm((f) => ({
        ...f,
        CategoryID: Number(value),
        CategoryName: nameMap[value],
      }));
    } else {
      setSuggestForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSuggestSubmit = async (e) => {
    e.preventDefault();
    const GOV_BACKEND_URL = process.env.REACT_APP_GOV_BACKEND_URL;
    try {
      const res = await fetch(
        `${GOV_BACKEND_URL}/product/upload_suggested_product/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...suggestForm,
            SuggestedPrice: parseFloat(suggestForm.SuggestedPrice),
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to submit suggestion");
      alert("Thank you! Your suggestion has been sent.");
      closeSuggestModal();
      setSuggestForm({
        ProductName: "",
        CategoryID: 1,
        CategoryName: "",
        Description: "",
        SuggestedPrice: "",
        Suppermarket: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error submitting suggestion. See console for details.");
    }
  };

  // ------------------------------
  // States for GOV products and selection
  // ------------------------------
  const [govProducts, setGovProducts] = useState([]);
  // Store selected product IDs as strings
  const [selectedGovProductIDs, setSelectedGovProductIDs] = useState([]);
  // Custom price for each selected product (key: product id, value: price)
  const [selectedPrices, setSelectedPrices] = useState({});

  // ------------------------------------------------
  //                FETCH LOCAL PRODUCTS
  // ------------------------------------------------
  const fetchProducts = async () => {
    try {
      const response = await api.get("/product/get");
      if (response.data && response.data.Products) {
        setProducts(response.data.Products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // ------------------------------------------------
  //                FETCH RELATIONS
  // ------------------------------------------------
  const fetchRelations = async () => {
    try {
      const response = await api.get("/shelf/get_relations");
      if (response.data) {
        setRelations(response.data);
      }
    } catch (error) {
      console.error("Error fetching relations:", error);
    }
  };

  // ------------------------------------------------
  //                FETCH GOV PRODUCTS (WITHOUT AUTH)
  // ------------------------------------------------
  const fetchGovProducts = async () => {
    const GOV_BACKEND_URL = process.env.REACT_APP_GOV_BACKEND_URL;
    try {
      const res = await fetch(`${GOV_BACKEND_URL}/product/get`);
      if (!res.ok) {
        throw new Error("Failed to fetch GOV products");
      }
      const data = await res.json();
      // Expected schema includes SuggestedPrice and Threshold.
      setGovProducts(data);
    } catch (error) {
      console.error("Error fetching GOV products:", error);
    }
  };

  // ------------------------------------------------
  //    Update displayed shelves and unshelved products
  // ------------------------------------------------
  useEffect(() => {
    const mappedShelves = relations.map((rel) => {
      const matchedProduct = products.find(
        (p) => p.ProductID === rel.ProductID
      );
      const productName = matchedProduct ? matchedProduct.ProductName : "Empty";
      const lastEditDate = rel.ChangedAt
        ? new Date(rel.ChangedAt).toLocaleDateString()
        : "N/A";
      return {
        shelfId: rel.ShelfID,
        productId: rel.ProductID,
        productName,
        lastEditDate,
      };
    });
    setDisplayShelves(mappedShelves);

    const shelvedProductIDs = new Set(relations.map((rel) => rel.ProductID));
    const unlinked = products
      .filter((prod) => !shelvedProductIDs.has(prod.ProductID))
      .map((prod) => ({
        name: prod.ProductName,
      }));
    setUnshelvedProducts(unlinked);
  }, [products, relations]);

  // ------------------------------------------------
  //    Fetch local products, relations, & GOV products on mount
  // ------------------------------------------------
  useEffect(() => {
    fetchProducts();
    fetchRelations();
    fetchGovProducts();
  }, []);

  // ------------------------------------------------
  // COMPUTED: Only display GOV products not already in store
  // ------------------------------------------------
  const availableGovProducts = govProducts.filter(
    (item) =>
      !products.some((prod) => prod.ProductID === item.Product.ProductID)
  );

  // ------------------------------------------------
  //    Toggle selected GOV product
  // ------------------------------------------------
  const toggleGovProductSelection = (productIdStr) => {
    if (selectedGovProductIDs.includes(productIdStr)) {
      // Deselect: Remove product ID and price
      setSelectedGovProductIDs((prev) =>
        prev.filter((id) => id !== productIdStr)
      );
      setSelectedPrices((prev) => {
        const updated = { ...prev };
        delete updated[productIdStr];
        return updated;
      });
    } else {
      // Select: Add product ID
      setSelectedGovProductIDs((prev) => [...prev, productIdStr]);
    }
  };

  // ------------------------------------------------
  //    Handle adding selected GOV products locally (with custom price)
  // ------------------------------------------------
  const handleAddSelectedProducts = async () => {
    if (selectedGovProductIDs.length === 0) {
      alert("Please select at least one product to add.");
      return;
    }
    // Ensure that a price is provided for each selected product.
    for (const productId of selectedGovProductIDs) {
      if (!selectedPrices[productId] || selectedPrices[productId] === "") {
        alert("Please enter a price for each selected product.");
        return;
      }
    }
    try {
      for (const productId of selectedGovProductIDs) {
        await api.post("/product/add", {
          Barcode: productId, // ProductID is sent as the barcode
          Price: parseFloat(selectedPrices[productId]),
        });
      }
      // Refresh local products then clear the selections.
      fetchProducts();
      setSelectedGovProductIDs([]);
      setSelectedPrices({});
      alert("Selected products added successfully.");
    } catch (error) {
      console.error("Error adding selected products:", error);
      alert(
        "An error occurred while adding products. Check the console for details."
      );
    }
  };

  // ------------------------------------------------
  //          HANDLE PRODUCT DELETE
  // ------------------------------------------------
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await api.delete(`/product/delete/${productId}`);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Check console for details.");
    }
  };

  // ------------------------------------------------
  //             SHELF RELATION HANDLERS
  // ------------------------------------------------
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleConfirmChange = async (shelfId, newProductName) => {
    const matchedProduct = products.find(
      (p) => p.ProductName.toLowerCase() === newProductName.toLowerCase()
    );
    if (!matchedProduct) {
      alert(
        "No matching product found. Please make sure the product name is correct."
      );
      return;
    }
    try {
      await api.put("/shelf/update_relation_product", {
        shelf_id: shelfId,
        product_id: matchedProduct.ProductID,
      });
      fetchRelations();
    } catch (error) {
      console.error("Error updating relation product:", error);
      alert("Error updating shelf product. Check console for details.");
    }
  };

  const handleRemoveProduct = async (shelfId) => {
    try {
      await api.put("/shelf/update_relation_product", {
        shelf_id: shelfId,
        product_id: 0,
      });
      fetchRelations();
    } catch (error) {
      console.error("Error removing product from shelf:", error);
      alert("Error removing product from shelf. Check console for details.");
    }
  };

  // ------------------------------------------------
  //          RENDER HELPERS FOR TABLE ROWS
  // ------------------------------------------------
  const renderShelfRow = (shelf) => (
    <tr key={`${shelf.shelfId}-${shelf.productId}`}>
      <td>{shelf.shelfId}</td>
      <td>
        <input
          type="text"
          defaultValue={shelf.productName}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            textAlign: "center",
          }}
          onBlur={(e) => handleConfirmChange(shelf.shelfId, e.target.value)}
        />
      </td>
      <td>{shelf.lastEditDate}</td>
      <td style={{ justifyContent: "center" }}>
        <button
          onClick={() => handleRemoveProduct(shelf.shelfId)}
          style={{
            backgroundColor: "#e75252",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "5px 10px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Empty the Shelf
        </button>
      </td>
    </tr>
  );

  const renderUnshelvedProductRow = (product, index) => (
    <tr key={`unshelved-${index}`}>
      <td>{product.name}</td>
    </tr>
  );

  // ------------------------------------------------
  //               MAIN COMPONENT RENDER
  // ------------------------------------------------
  return (
    <>
      <Navbar />
      <div
        className="manage-container"
        style={{ overflowY: "auto", maxHeight: "100vh" }}
      >
        <header className="manage-header">
          <h1 className="borderh1">Manage Products</h1>
        </header>

        <div className="manage-tabs">
          <button
            className={`tab ${activeTab === "storeProducts" ? "active" : ""}`}
            onClick={() => handleTabClick("storeProducts")}
          >
            Store Products
          </button>
          <button
            className={`tab ${activeTab === "shelfProducts" ? "active" : ""}`}
            onClick={() => handleTabClick("shelfProducts")}
          >
            Manage Products on Shelves
          </button>
        </div>

        <div className="manage-content">
          {/* ------------------------ */}
          {/*      STORE PRODUCTS      */}
          {/* ------------------------ */}
          {activeTab === "storeProducts" && (
            <>
              <table
                className="relations-table"
                style={{
                  marginLeft: "20px",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Barcode / ProductID</th>
                    <th>Current Price</th>
                    <th>Suggested Price</th>
                    <th>Threshold</th>
                    <th>Discount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center" }}>
                        No products available
                      </td>
                    </tr>
                  ) : (
                    products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.ProductName}</td>
                        <td>{product.CategoryName}</td>
                        <td>{product.ProductID}</td>
                        <td>
                          {product.Price !== undefined &&
                          product.Price !== null ? (
                            <div
                              style={{
                                color:
                                  product.Threshold &&
                                  parseFloat(product.Price) > product.Threshold
                                    ? "red"
                                    : "inherit",
                              }}
                            >
                              ₺{product.Price}
                              {product.Threshold &&
                                parseFloat(product.Price) >
                                  product.Threshold && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      marginTop: "4px",
                                    }}
                                  >
                                    Warning: The current price exceeds the
                                    allowed threshold and may incur a penalty.
                                  </div>
                                )}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>₺{product.SuggestedPrice ?? "N/A"}</td>
                        <td>₺{product.Threshold ?? "N/A"}</td>
                        <td>
                          {product.Discount && product.Discount > 0
                            ? `${product.Discount}% until ${product.DiscountEndDate}`
                            : "No discount"}
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              handleDeleteProduct(product.ProductID)
                            }
                            style={{
                              backgroundColor: "#e75252",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* ------------------------------------------------------- */}
              {/*          GOV PRODUCTS ADDING SECTION (SCROLLABLE)      */}
              {/* ------------------------------------------------------- */}
              <div
                className="gov-add-container"
                style={{
                  margin: "20px",
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                  maxHeight: "500px",
                  overflowY: "auto",
                }}
              >
                <h2>Add Products from GOV Backend</h2>
                <p>
                  Click on products to select them. Selected products will turn
                  blue and display an input field to enter a custom price.
                </p>
                <p>
                  If product not available, please fill this{" "}
                  <button
                    onClick={openSuggestModal}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0066cc",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                      font: "inherit",
                    }}
                  >
                    form
                  </button>
                </p>

                <div
                  className="gov-product-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {availableGovProducts.length > 0 ? (
                    availableGovProducts.map((item) => {
                      const { Product, Category, Price } = item;
                      const productIdStr = String(Product.ProductID);
                      const isSelected =
                        selectedGovProductIDs.includes(productIdStr);
                      const customPrice = selectedPrices[productIdStr] || "";
                      const isOverThreshold =
                        customPrice &&
                        parseFloat(customPrice) > Price?.Threshold;
                      return (
                        <div
                          key={productIdStr}
                          className="gov-product-card"
                          style={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            padding: "16px",
                            backgroundColor: isSelected ? "#b3d4fc" : "#fff",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            toggleGovProductSelection(productIdStr)
                          }
                        >
                          <h4 style={{ margin: "0 0 8px" }}>
                            {Product.ProductName}
                          </h4>
                          <p
                            style={{
                              margin: "0 0 4px",
                              fontSize: "14px",
                              color: "#555",
                            }}
                          >
                            {Category?.CategoryName || "No Category"}
                          </p>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "12px",
                              color: "#777",
                            }}
                          >
                            Suggested Price: ₺{Price?.SuggestedPrice} |
                            Threshold: ₺{Price?.Threshold}
                          </p>
                          {isSelected && (
                            <div style={{ marginTop: "8px" }}>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Enter Price"
                                value={customPrice}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setSelectedPrices((prev) => ({
                                    ...prev,
                                    [productIdStr]: e.target.value,
                                  }))
                                }
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  borderRadius: "4px",
                                  border: isOverThreshold
                                    ? "1px solid red"
                                    : "1px solid #ccc",
                                }}
                              />
                              {isOverThreshold && (
                                <p
                                  style={{
                                    color: "red",
                                    fontSize: "12px",
                                    marginTop: "4px",
                                  }}
                                >
                                  Penalty may be applied. Price exceeds
                                  threshold!
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p
                      style={{
                        gridColumn: "1 / -1",
                        textAlign: "center",
                        color: "#888",
                      }}
                    >
                      No GOV products available.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleAddSelectedProducts}
                  style={{
                    marginTop: "20px",
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#738844",
                    color: "#fff",
                    fontSize: "16px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Add Selected Products
                </button>
              </div>
            </>
          )}

          {/* ------------------------ */}
          {/*      MANAGE SHELVES      */}
          {/* ------------------------ */}
          {activeTab === "shelfProducts" && (
            <div>
              <h3 className="table-title">Manage Products on Shelves</h3>
              {displayShelves.length === 0 ? (
                <p className="placeholder">No shelf-product relations found.</p>
              ) : (
                <table
                  className="relations-table"
                  style={{
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <thead>
                    <tr>
                      <th>Shelf ID</th>
                      <th>Product Name</th>
                      <th>Last Edit Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>{displayShelves.map(renderShelfRow)}</tbody>
                </table>
              )}

              <h3 className="table-title">Products that are not on a Shelf</h3>
              {unshelvedProducts.length === 0 ? (
                <p className="placeholder">No unshelved products available.</p>
              ) : (
                <table
                  className="relations-table"
                  style={{
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <thead>
                    <tr>
                      <th>Product Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unshelvedProducts.map(renderUnshelvedProductRow)}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
      {showSuggestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Suggest a New Product</h2>
            <form onSubmit={handleSuggestSubmit}>
              <div className="form-group">
                <label htmlFor="ProductName">Product Name</label>
                <input
                  id="ProductName"
                  name="ProductName"
                  placeholder="Enter product name"
                  value={suggestForm.ProductName}
                  onChange={handleSuggestChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="CategoryID">Category</label>
                <select
                  id="CategoryID"
                  name="CategoryID"
                  value={suggestForm.CategoryID}
                  onChange={handleSuggestChange}
                >
                  <option value={1}>Fruits</option>
                  <option value={2}>Vegetables</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="Description">Description</label>
                <textarea
                  id="Description"
                  name="Description"
                  placeholder="Brief description"
                  value={suggestForm.Description}
                  onChange={handleSuggestChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="SuggestedPrice">Suggested Price</label>
                <input
                  id="SuggestedPrice"
                  name="SuggestedPrice"
                  type="number"
                  step="0.01"
                  placeholder="₺0.00"
                  value={suggestForm.SuggestedPrice}
                  onChange={handleSuggestChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="Suppermarket">Supermarket</label>
                <input
                  id="Suppermarket"
                  name="Suppermarket"
                  placeholder="Your supermarket name"
                  value={suggestForm.Suppermarket}
                  onChange={handleSuggestChange}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeSuggestModal}>
                  Cancel
                </button>
                <button type="submit">Send Suggestion</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageProducts;
