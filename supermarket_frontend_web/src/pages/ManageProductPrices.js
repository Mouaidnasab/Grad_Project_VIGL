import React, { useState, useEffect } from "react";
import api from "../api.js";
import "./ManageProductPrices.css";
import Footer from "../components/footerInit.js";
import Navbar from "../components/Navbar.js";

const ManageProductPrices = () => {
  const [productList, setProductList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProductList();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredProducts(
        productList.filter((product) =>
          product.ProductName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(productList);
    }
  }, [searchTerm, productList]);

  const fetchProductList = async () => {
    try {
      const response = await api.get("/product/get");
      console.log("Fetched Product List:", response.data.Products);
      setProductList(response.data.Products);
    } catch (error) {
      console.error("Error fetching product list:", error);
    }
  };

  const handleInputChange = (productId, field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [productId]: {
        ...prevData[productId],
        [field]: value,
      },
    }));
  };

  const handleUpdatePrice = async (productId) => {
    const newPrice = formData[productId]?.newPrice;
    if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
      alert("Please enter a valid price!");
      return;
    }

    try {
      await api.put(
        `/product/update_price/${parseInt(productId)}?new_price=${newPrice}`
      );
      fetchProductList();
      clearFormData();
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Failed to update price");
    }
  };

  const handleUpdatePromotion = async (productId) => {
    const newPromotion = formData[productId]?.newDiscount;
    const discountEndDate = formData[productId]?.discountEndDate;

    if (!newPromotion || isNaN(newPromotion) || newPromotion < 0) {
      alert("Please enter a valid discount!");
      return;
    }
    if (!discountEndDate || new Date(discountEndDate) <= new Date()) {
      alert("Please select a valid future discount end date!");
      return;
    }

    try {
      await api.put(`/product/update_discount/${productId}`, {
        Discount: newPromotion,
        EndDate: discountEndDate,
      });
      fetchProductList();
      clearFormData();
    } catch (error) {
      console.error("Error updating promotion:", error);
      alert("Failed to update promotion");
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredProducts.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const clearFormData = () => {
    setFormData({});
  };

  return (
    <>
      <Navbar />
      <div className="outer-container">
        <div className="page-wrapper">
          <h1>Manage Product Prices</h1>

          <div className="table-container">
            <h2>Product List</h2>

            {/* Product Search Bar */}
            <input
              type="text"
              placeholder="Search Product Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar"
            />

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Current Price</th>
                    <th>Suggested Price</th>
                    <th>Threshold</th>
                    <th>Discount</th>
                    <th>Discount End Date</th>
                    <th>New Price</th>
                    <th>New Promotion Discount</th>
                    <th>Promotion End Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((product) => {
                    // Compute if the current price or new price exceeds the threshold
                    const newPriceValue = parseFloat(
                      formData[product.ProductID]?.newPrice
                    );
                    const exceedsNewPriceThreshold =
                      !isNaN(newPriceValue) &&
                      newPriceValue > product.Threshold;
                    return (
                      <tr key={product.ProductID}>
                        <td>{product.ProductName}</td>
                        <td>{product.CategoryName}</td>
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
                        <td>₺{product.SuggestedPrice}</td>
                        <td>₺{product.Threshold}</td>
                        <td>{product.Discount}</td>
                        <td>{product.DiscountEndDate}</td>
                        <td>
                          <input
                            type="number"
                            className="price-input"
                            placeholder="New Price"
                            value={formData[product.ProductID]?.newPrice || ""}
                            onChange={(e) =>
                              handleInputChange(
                                product.ProductID,
                                "newPrice",
                                e.target.value
                              )
                            }
                          />
                          {formData[product.ProductID]?.newPrice &&
                            exceedsNewPriceThreshold && (
                              <div style={{ color: "red", fontSize: "12px" }}>
                                Warning: The entered price exceeds the allowed
                                threshold and may incur a penalty.
                              </div>
                            )}
                        </td>
                        <td>
                          <input
                            type="number"
                            className="price-input"
                            placeholder="New Discount"
                            value={
                              formData[product.ProductID]?.newDiscount || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                product.ProductID,
                                "newDiscount",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="price-input"
                            placeholder="End Date"
                            value={
                              formData[product.ProductID]?.discountEndDate || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                product.ProductID,
                                "discountEndDate",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            className="update-button"
                            onClick={() => handleUpdatePrice(product.ProductID)}
                          >
                            Update Price
                          </button>
                          <button
                            className="update-button"
                            onClick={() =>
                              handleUpdatePromotion(product.ProductID)
                            }
                          >
                            Update Promotion
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan="11" style={{ textAlign: "center" }}>
                        No products available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button onClick={handlePreviousPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of{" "}
              {Math.ceil(filteredProducts.length / itemsPerPage)}
            </span>
            <button
              onClick={handleNextPage}
              disabled={
                currentPage ===
                Math.ceil(filteredProducts.length / itemsPerPage)
              }
            >
              Next
            </button>
          </div>

          {/* Displaying items range */}
          <p>
            Displaying {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ManageProductPrices;
