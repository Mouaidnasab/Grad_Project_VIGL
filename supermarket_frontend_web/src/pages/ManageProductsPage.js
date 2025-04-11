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
      // Data schema: [{ Product: { ProductID, ProductName, ... }, Category: { CategoryID, CategoryName, ... }}, ...]
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
  // Derived array: Selected GOV Products details
  // ------------------------------------------------
  const selectedGovProducts = availableGovProducts.filter((item) =>
    selectedGovProductIDs.includes(String(item.Product.ProductID))
  );

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
      <div className="manage-container">
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
                    <th>Price</th>
                    <th>Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>
                        No products available
                      </td>
                    </tr>
                  ) : (
                    products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.ProductName}</td>
                        <td>{product.CategoryName || product.CategoryID}</td>
                        <td>{product.ProductID}</td>
                        <td>{product.Price ?? "N/A"}</td>
                        <td>
                          {product.Discount && product.Discount > 0
                            ? `${product.Discount}% until ${product.DiscountEndDate}`
                            : "No discount"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* ------------------------------------------------------- */}
              {/*   Section to add GOV products with checkbox selection    */}
              {/* ------------------------------------------------------- */}

              <div
                className="gov-add-wrapper"
                style={{
                  maxHeight: "500px", // adjust as needed
                  overflowY: "auto",
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fafafa",
                  margin: "0 20px 40px", // bottom margin for spacing
                }}
              >
                <h2>Add Products from GOV Backend</h2>
                <p>
                  Select one or more products below to add them to your store.
                  The <strong>ProductID</strong> will be sent as the barcode and
                  you can assign a custom price to each.
                </p>

                {/* Scrollable checkbox list */}
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "10px",
                    backgroundColor: "#fff",
                    marginBottom: "20px",
                  }}
                >
                  {availableGovProducts.length > 0 ? (
                    availableGovProducts.map((item) => {
                      const { Product, Category } = item;
                      const idStr = String(Product.ProductID);
                      return (
                        <div
                          key={idStr}
                          style={{
                            display: "flex",
                            cursor: "pointer",
                            padding: "8px 0",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGovProductIDs.includes(idStr)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGovProductIDs((prev) => [
                                  ...prev,
                                  idStr,
                                ]);
                              } else {
                                setSelectedGovProductIDs((prev) =>
                                  prev.filter((id) => id !== idStr)
                                );
                                setSelectedPrices((prev) => {
                                  const upd = { ...prev };
                                  delete upd[idStr];
                                  return upd;
                                });
                              }
                            }}
                            style={{
                              marginLeft: "20px",
                              width: "30%",
                              textAlign: "left",
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {Product.ProductName}
                            </div>
                            <div style={{ fontSize: "13px", color: "#666" }}>
                              {Category?.CategoryName || "No Category"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ textAlign: "center", color: "#888" }}>
                      No GOV products available.
                    </p>
                  )}
                </div>

                {/* Selected items display */}
                {selectedGovProductIDs.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h3>Selected Products</h3>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}
                    >
                      {selectedGovProducts.map((item) => {
                        const { Product } = item;
                        const idStr = String(Product.ProductID);
                        return (
                          <div
                            key={idStr}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              border: "1px solid #ddd",
                              borderRadius: "8px",
                              padding: "10px",
                              minWidth: "220px",
                              backgroundColor: "#fff",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#007bff",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "600",
                                marginRight: "12px",
                              }}
                            >
                              {Product.ProductName.charAt(0)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{ marginBottom: "6px", fontWeight: 500 }}
                              >
                                {Product.ProductName}
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Enter Price"
                                value={selectedPrices[idStr] || ""}
                                onChange={(e) =>
                                  setSelectedPrices((prev) => ({
                                    ...prev,
                                    [idStr]: e.target.value,
                                  }))
                                }
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                  fontSize: "14px",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddSelectedProducts}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 0",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: 500,
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
    </>
  );
};

export default ManageProducts;
