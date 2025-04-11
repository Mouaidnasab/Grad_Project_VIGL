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
  const [newProduct, setNewProduct] = useState({
    Name: "",
    Barcode: "",
    CategoryID: "",
    Price: ""
  });

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
        lastEditDate
      };
    });

    setDisplayShelves(mappedShelves);

    const shelvedProductIDs = new Set(relations.map((rel) => rel.ProductID));
    const unlinked = products
      .filter((prod) => !shelvedProductIDs.has(prod.ProductID))
      .map((prod) => ({
        name: prod.ProductName
      }));

    setUnshelvedProducts(unlinked);
  }, [products, relations]);

  useEffect(() => {
    fetchProducts();
    fetchRelations();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const body = {
        Barcode: newProduct.Barcode,
        Name: newProduct.Name,
        CategoryID: newProduct.CategoryID,
        Price: parseFloat(newProduct.Price)
      };

      await api.post("/product/add", body);
      fetchProducts();
      setNewProduct({ Name: "", Barcode: "", CategoryID: "", Price: "" });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleConfirmChange = async (shelfId, newProductName) => {
    const matchedProduct = products.find(
      (p) => p.ProductName.toLowerCase() === newProductName.toLowerCase()
    );
    if (!matchedProduct) {
      alert("No matching product found. Please make sure the product name is correct.");
      return;
    }

    try {
      await api.put("/shelf/update_relation_product", {
        shelf_id: shelfId,
        product_id: matchedProduct.ProductID
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
        product_id: 0
      });
      fetchRelations();
    } catch (error) {
      console.error("Error removing product from shelf:", error);
      alert("Error removing product from shelf. Check console for details.");
    }
  };

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
            textAlign: "center"
          }}
          onBlur={(e) => handleConfirmChange(shelf.shelfId, e.target.value)}
        />
      </td>
      <td>{shelf.lastEditDate}</td>
      <td style={{  justifyContent: "center" }}>
        <button
          onClick={() => handleRemoveProduct(shelf.shelfId)}
          style={{
            backgroundColor: "#e75252",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "5px 10px",
            cursor: "pointer",
            fontSize: "14px"
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
          {activeTab === "storeProducts" && (
            <>
              {/* Store products table */}
              <table
                className="relations-table"
                style={{
                  marginLeft: "20px",
                  borderRadius: "10px",
                  overflow: "hidden"
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

              {/* Form to add a new product */}
              <div className="section" style={{ margin: "0 20px" }}>
                <h2>Add New Product</h2>
                <form onSubmit={handleAddProduct}>
                  <input
                    type="text"
                    placeholder="Enter Product Name"
                    value={newProduct.Name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, Name: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    placeholder="Enter Barcode"
                    value={newProduct.Barcode}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, Barcode: e.target.value })
                    }
                    required
                  />
                  <select
                    value={newProduct.CategoryID}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        CategoryID: e.target.value
                      })
                    }
                    required
                    style={{
                      border: "none",
                      borderRadius: "10px",
                      padding: "5px 10px",
                      fontSize: "14px",
                      background: "white",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Select Category</option>
                    <option value="1">Fruits</option>
                    <option value="2">Vegetables</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter Price"
                    value={newProduct.Price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        Price: e.target.value
                      })
                    }
                    required
                  />
                  <button type="submit">Add Product</button>
                </form>
              </div>
            </>
          )}

          {/* Manage shelves tab */}
          {activeTab === "shelfProducts" && (
            <div>
              <h3 className="table-title">Manage Products on shelves</h3>
              {displayShelves.length === 0 ? (
                <p className="placeholder">No shelf-product relations found.</p>
              ) : (
                <table
                  className="relations-table"
                  style={{
                    borderRadius: "10px",
                    overflow: "hidden"
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

              <h3 className="table-title">Products that are not on a shelf</h3>
              {unshelvedProducts.length === 0 ? (
                <p className="placeholder">No unshelved products available.</p>
              ) : (
                <table
                  className="relations-table"
                  style={{
                    borderRadius: "10px",
                    overflow: "hidden"
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
