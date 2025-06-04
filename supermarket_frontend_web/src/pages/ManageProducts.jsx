// src/pages/ManageProducts.jsx

import React, { useState, useEffect } from "react";
import BootstrapNavbar from '../component/BootstrapNavbar';
import Footer from '../component/footerInit.jsx';
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../Css/ManageProducts.css";
import api from "../Api.js"; 
import ManageProductPricesTable from "../component/ManageProductPricesTable.jsx";

const ManageProducts = () => {
  const [activeTab, setActiveTab] = useState("storeProducts");
  const [products, setProducts] = useState([]);
  const [relations, setRelations] = useState([]);
  const [displayShelves, setDisplayShelves] = useState([]);
  const [unshelvedProducts, setUnshelvedProducts] = useState([]);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    ProductName: "",
    CategoryID: 1,
    CategoryName: "Fruits",
    Description: "",
    SuggestedPrice: "",
    Suppermarket: "",
  });

  const categoryNameMap = {
    1: "Fruits",
    2: "Vegetables",
  };

  const [govProducts, setGovProducts] = useState([]);
  const [selectedGovProductIDs, setSelectedGovProductIDs] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState({});

  const openSuggestModal = () => setShowSuggestModal(true);
  const closeSuggestModal = () => {
    setShowSuggestModal(false);
    setSuggestForm({
      ProductName: "",
      CategoryID: 1,
      CategoryName: categoryNameMap[1],
      Description: "",
      SuggestedPrice: "",
      Suppermarket: "",
    });
  };

  const handleSuggestChange = (e) => {
    const { name, value } = e.target;
    if (name === "CategoryID") {
      const cid = Number(value);
      setSuggestForm((f) => ({
        ...f,
        CategoryID: cid,
        CategoryName: categoryNameMap[cid] || "Unknown Category",
      }));
    } else {
      setSuggestForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSuggestSubmit = async (e) => {
    e.preventDefault();
    if (!suggestForm.ProductName || !suggestForm.Description || !suggestForm.SuggestedPrice) {
      alert("Please fill in all required fields for the suggestion.");
      return;
    }
    const GOV_BACKEND_URL = process.env.REACT_APP_GOV_BACKEND_URL;
    if (!GOV_BACKEND_URL) {
      alert("Backend URL is not configured. Cannot submit suggestion.");
      console.error("REACT_APP_GOV_BACKEND_URL is not defined.");
      return;
    }
    try {
      await fetch(`${GOV_BACKEND_URL}/product/upload_suggested_product/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...suggestForm,
          SuggestedPrice: parseFloat(suggestForm.SuggestedPrice),
        }),
      });
      alert("Thank you! Your suggestion has been sent.");
      closeSuggestModal();
    } catch (err) {
      console.error(err);
      alert(`Error submitting suggestion: ${err.message}`);
    }
  };

  // Fetch store products from local API
  const fetchProducts = async () => {
    try {
      const response = await api.get("/product/get/");
      if (response.data && Array.isArray(response.data.Products)) {
        setProducts(response.data.Products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  // Fetch shelf-product relations from local API
  const fetchRelations = async () => {
    try {
      const response = await api.get("/shelf/get_relations");
      if (response.data && Array.isArray(response.data)) {
        setRelations(response.data);
      } else {
        setRelations([]);
      }
    } catch (error) {
      console.error("Error fetching relations:", error);
      setRelations([]);
    }
  };

  const fetchGovProducts = async () => {
    const GOV_BACKEND_URL = process.env.REACT_APP_GOV_BACKEND_URL;
    if (!GOV_BACKEND_URL) {
      console.error("REACT_APP_GOV_BACKEND_URL is not defined. Using empty GOV products.");
      setGovProducts([]);
      return;
    }
    try {
      const res = await fetch(`${GOV_BACKEND_URL}/product/get/`);
      if (!res.ok) throw new Error("Failed to fetch GOV products");
      const data = await res.json();
      setGovProducts(data);
    } catch (error) {
      console.error("Error fetching GOV products:", error);
      setGovProducts([]);
    }
  };

  useEffect(() => {
    const mappedShelves = relations.map((rel) => {
      const matchedProduct = products.find((p) => p.ProductID === rel.ProductID);
      const productName = matchedProduct ? matchedProduct.ProductName : "Empty";
      const lastEditDate = rel.ChangedAt
        ? new Date(rel.ChangedAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
        : "N/A";
      return {
        shelfId: rel.ShelfID,
        productId: rel.ProductID,
        productName,
        lastEditDate,
      };
    });
    setDisplayShelves(mappedShelves);

    // Compute unshelved products
    const shelvedProductIDs = new Set(
      relations.map((rel) => rel.ProductID).filter((id) => id && id !== 0)
    );
    const unlinked = products
      .filter((prod) => !shelvedProductIDs.has(prod.ProductID))
      .map((prod) => ({
        id: prod.ProductID,
        name: prod.ProductName,
      }));
    setUnshelvedProducts(unlinked);
  }, [products, relations]);

  // Compute GOV products not yet in store
  const availableGovProducts = govProducts.filter(
    (item) =>
      item.Product &&
      item.Product.ProductID &&
      !products.some((prod) => prod.ProductID === item.Product.ProductID)
  );

  const toggleGovProductSelection = (productIdStr) => {
    setSelectedGovProductIDs((prev) =>
      prev.includes(productIdStr)
        ? prev.filter((id) => id !== productIdStr)
        : [...prev, productIdStr]
    );
    if (selectedGovProductIDs.includes(productIdStr)) {
      setSelectedPrices((prev) => {
        const updated = { ...prev };
        delete updated[productIdStr];
        return updated;
      });
    }
  };

  const handleAddSelectedProducts = async () => {
    if (selectedGovProductIDs.length === 0) {
      alert("Please select at least one product to add.");
      return;
    }
    for (const productId of selectedGovProductIDs) {
      const price = selectedPrices[productId];
      if (!price || price.trim() === "" || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        alert(`Please enter a valid positive price for product ID ${productId}.`);
        return;
      }
    }
    try {
      // Batch-add each selected GOV product into local store
      await Promise.all(
        selectedGovProductIDs.map(async (productId) => {
          const govProductDetails = govProducts.find(
            (item) => String(item.Product?.ProductID) === productId
          );
          if (!govProductDetails || !govProductDetails.Product) {
            throw new Error(`Details for product ID ${productId} not found.`);
          }
          const categoryId = govProductDetails.Category?.CategoryID || 0;
          const categoryName = govProductDetails.Category?.CategoryName || categoryNameMap[categoryId] || "Uncategorized";
          await api.post("/product/add", {
            Barcode: String(productId, 10),
            Price: parseFloat(selectedPrices[productId]),
          });
        })
      );
      await fetchProducts();
      await fetchGovProducts();
      setSelectedGovProductIDs([]);
      setSelectedPrices({});
      alert("Selected products added successfully.");
    } catch (error) {
      console.error("Error adding selected products:", error);
      let msg = "An error occurred while adding products.";
      if (error.response?.data?.detail) msg = error.response.data.detail;
      else if (error.message) msg = error.message;
      alert(`${msg} Check console for details.`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/product/delete/${productId}`);
      await fetchProducts();
      alert("Product deleted successfully.");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Check console for details.");
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleConfirmChangeShelfProduct = async (shelfId, newProductName) => {
    const trimmedName = newProductName.trim();
    if (!trimmedName) {
      alert("Product name cannot be empty. To empty the shelf, use the 'Empty Shelf' button or assign a product.");
      await fetchRelations();
      return;
    }
    const matchedProduct = products.find(
      (p) => p.ProductName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (!matchedProduct) {
      alert(
        `Product "${trimmedName}" not found in your store. Please add it via 'Store Products' tab first or check spelling.`
      );
      await fetchRelations();
      return;
    }
    try {
      await api.put("/shelf/update_relation_product", {
        shelf_id: shelfId,
        product_id: matchedProduct.ProductID,
      });
      await fetchRelations();
    } catch (error) {
      console.error("Error updating relation product:", error);
      alert("Error updating shelf product. Check console for details.");
      await fetchRelations();
    }
  };

  const handleRemoveProductFromShelf = async (shelfId) => {
    if (!window.confirm("Are you sure you want to remove the product from this shelf? The shelf will be marked as empty.")) {
      return;
    }
    try {
      await api.put("/shelf/update_relation_product", {
        shelf_id: shelfId,
        product_id: 0,
      });
      await fetchRelations();
    } catch (error) {
      console.error("Error removing product from shelf:", error);
      alert("Error removing product from shelf. Check console for details.");
    }
  };

  const renderShelfRow = (shelf) => (
    <tr key={`${shelf.shelfId}-${shelf.productId || 'empty'}`}>
      <td>{shelf.shelfId}</td>
      <td>
        <input
          type="text"
          defaultValue={shelf.productName === "Empty" ? "" : shelf.productName}
          placeholder={shelf.productName === "Empty" ? "Type product name & blur" : ""}
          onBlur={(e) => handleConfirmChangeShelfProduct(shelf.shelfId, e.target.value)}
        />
      </td>
      <td>{shelf.lastEditDate}</td>
      <td style={{ textAlign: "center" }}>
        <button
          className="delete-button"
          onClick={() => handleRemoveProductFromShelf(shelf.shelfId)}
          disabled={shelf.productName === "Empty"}
        >
          Empty Shelf
        </button>
      </td>
    </tr>
  );

  const renderUnshelvedProductRow = (product, index) => (
    <tr key={`unshelved-${product.id || index}`}>
      <td>{product.name}</td>
    </tr>
  );

  useEffect(() => {
    fetchProducts();
    fetchRelations();
    fetchGovProducts();
  }, []);

  return (
    <>
      <BootstrapNavbar />
      <div className="manage-container">
        <header className="manage-header">
          <h1 className="borderh1">Products Management</h1>
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
            Products on Shelves
          </button>
          <button
            className={`tab ${activeTab === "productPrices" ? "active" : ""}`}
            onClick={() => handleTabClick("productPrices")}
          >
            Product Prices
          </button>
        </div>

        <main className="manage-content">
          {activeTab === "storeProducts" && (
            <div className="store-products-layout">
              <div className="store-products-left-col">
                <h2 className="table-title">Products In Store</h2>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Barcode / ID</th>
                        <th>Your Price</th>
                        <th>Gov Suggested</th>
                        <th>Gov Threshold</th>
                        <th>Discount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="placeholder-text">
                            No products in your store. Add from GOV DB.
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => (
                          <tr key={product.ProductID}>
                            <td>{product.ProductName}</td>
                            <td>{product.CategoryName || categoryNameMap[product.CategoryID] || "N/A"}</td>
                            <td>{product.ProductID}</td>
                            <td>
                              <div
                                style={{
                                  color:
                                    product.Threshold &&
                                    parseFloat(product.Price) > product.Threshold
                                      ? "red"
                                      : "inherit",
                                  fontWeight:
                                    product.Threshold &&
                                    parseFloat(product.Price) > product.Threshold
                                      ? "bold"
                                      : "normal",
                                }}
                              >
                                ₺{product.Price !== undefined ? product.Price.toFixed(2) : "N/A"}
                                {product.Threshold &&
                                  parseFloat(product.Price) > product.Threshold && (
                                    <div style={{ fontSize: "11px", marginTop: "4px", color: "red" }}>
                                      Exceeds Gov Threshold (₺{product.Threshold.toFixed(2)})
                                    </div>
                                  )}
                              </div>
                            </td>
                            <td>₺{product.SuggestedPrice?.toFixed(2) || "N/A"}</td>
                            <td>₺{product.Threshold?.toFixed(2) || "N/A"}</td>
                            <td>
                              {product.Discount && product.Discount > 0 && product.DiscountEndDate
                                ? `${product.Discount}% until ${new Date(product.DiscountEndDate).toLocaleDateString(
                                    "en-US",
                                    { year: "numeric", month: "2-digit", day: "2-digit" }
                                  )}`
                                : "No"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="delete-button"
                                onClick={() => handleDeleteProduct(product.ProductID)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="store-products-right-col">
                <div className="gov-add-container">
                  <h2>Add Products from GOV Database</h2>
                  <p>
                    Select products below to add to your store. Set a price for each.
                    If not listed,{" "}
                    <button onClick={openSuggestModal} className="link-button">
                      suggest it here
                    </button>.
                  </p>

                  <div className="gov-product-grid">
                    {availableGovProducts.length > 0 ? (
                      availableGovProducts.map((item) => {
                        const Product = item.Product || {};
                        const Category = item.Category || {};
                        const PriceInfo = item.Price || {};
                        const productIdStr = String(Product.ProductID);

                        if (!Product.ProductID) return null;

                        const isSelected = selectedGovProductIDs.includes(productIdStr);
                        const customPrice = selectedPrices[productIdStr] || "";
                        const isOverThreshold =
                          PriceInfo.Threshold && customPrice && parseFloat(customPrice) > PriceInfo.Threshold;

                        return (
                          <div
                            key={productIdStr}
                            className={`gov-product-card ${isSelected ? "selected" : ""}`}
                            onClick={() => toggleGovProductSelection(productIdStr)}
                          >
                            <h4>{Product.ProductName || "Unknown Product"}</h4>
                            <p>Category: {Category.CategoryName || categoryNameMap[Category.CategoryID] || "N/A"}</p>
                            <p className="price-info">
                              Gov Suggested: ₺{PriceInfo.SuggestedPrice?.toFixed(2) || "N/A"} |
                              Threshold: ₺{PriceInfo.Threshold?.toFixed(2) || "N/A"}
                            </p>
                            {isSelected && (
                              <div style={{ marginTop: "10px" }} onClick={(e) => e.stopPropagation()}>
                                <label
                                  htmlFor={`price-${productIdStr}`}
                                  style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}
                                >
                                  Your Price:
                                </label>
                                <input
                                  id={`price-${productIdStr}`}
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  placeholder="Set Your Price (₺)"
                                  value={customPrice}
                                  onChange={(e) =>
                                    setSelectedPrices((prev) => ({
                                      ...prev,
                                      [productIdStr]: e.target.value,
                                    }))
                                  }
                                  className={isOverThreshold ? "price-over-threshold" : ""}
                                />
                                {isOverThreshold && (
                                  <p className="warning-text">
                                    Warning: Price exceeds threshold!
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="placeholder-text" style={{ gridColumn: "1 / -1" }}>
                        All GOV products are in your store or none available.
                      </p>
                    )}
                            </div>
                  {availableGovProducts.length > 0 && selectedGovProductIDs.length > 0 && (
                    <button onClick={handleAddSelectedProducts} className="add-products-button">
                      Add {selectedGovProductIDs.length} Selected Product(s) to Store
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "shelfProducts" && (
            <div className="shelf-products-layout">
              <div className="shelf-products-left-col">
                <h2 className="table-title">Manage Products on Shelves</h2>
                {displayShelves.length === 0 ? (
                  <p className="placeholder-text">No shelves found or no products assigned to shelves.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Shelf ID</th>
                          <th>Product Name (Editable)</th>
                          <th>Last Edit Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>{displayShelves.map(renderShelfRow)}</tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="shelf-products-right-col">
                <h2 className="table-title">Products Not Currently on a Shelf</h2>
                {unshelvedProducts.length === 0 ? (
                  <p className="placeholder-text">All products are currently on a shelf or no products in store.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unshelvedProducts.map(renderUnshelvedProductRow)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "productPrices" && (
            <ManageProductPricesTable />
          )}
        </main>
      </div>
      <Footer />

      {showSuggestModal && (
        <div className="suggest-product-modal-overlay">
          <div className="suggest-product-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold text-gray-800 mb-10 text-center">Suggest a New Product</h2>
            <form onSubmit={handleSuggestSubmit}>
              <div className="suggest-product-form-group">
                <label htmlFor="suggestProductName" className="suggest-product-label">Product Name</label>
                <input
                  id="suggestProductName"
                  name="ProductName"
                  placeholder="Enter product name"
                  value={suggestForm.ProductName}
                  onChange={handleSuggestChange}
                  required
                  className="suggest-product-input"
                />
              </div>

              <div className="suggest-product-form-group">
                <label htmlFor="suggestCategoryID" className="suggest-product-label">Category</label>
                <select
                  id="suggestCategoryID"
                  name="CategoryID"
                  value={suggestForm.CategoryID}
                  onChange={handleSuggestChange}
                  required
                  className="suggest-product-select"
                >
                  {Object.entries(categoryNameMap).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="suggest-product-form-group">
                <label htmlFor="suggestDescription" className="suggest-product-label">Description</label>
                <textarea
                  id="suggestDescription"
                  name="Description"
                  placeholder="Brief description (e.g., brand, size, quantity)"
                  value={suggestForm.Description}
                  onChange={handleSuggestChange}
                  required
                  className="suggest-product-textarea"
                />
              </div>

              <div className="suggest-product-form-group">
                <label htmlFor="suggestSuggestedPrice" className="suggest-product-label">Your Suggested Price (₺)</label>
                <input
                  id="suggestSuggestedPrice"
                  name="SuggestedPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g., 15.99"
                  value={suggestForm.SuggestedPrice}
                  onChange={handleSuggestChange}
                  required
                  className="suggest-product-input"
                />
              </div>

              <div className="suggest-product-form-group">
                <label htmlFor="suggestSuppermarket" className="suggest-product-label">Supermarket Name (Optional)</label>
                <input
                  id="suggestSuppermarket"
                  name="Suppermarket"
                  placeholder="Your supermarket name"
                  value={suggestForm.Suppermarket}
                  onChange={handleSuggestChange}
                  className="suggest-product-input"
                />
              </div>

              <div className="suggest-product-modal-actions">
                <button type="button" onClick={closeSuggestModal} className="suggest-product-button-cancel">
                  Cancel
                </button>
                <button type="submit" className="suggest-product-button-submit">Send Suggestion</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageProducts;

