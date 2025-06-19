// src/components/ManageProductPricesTable.jsx
import React, { useState, useEffect } from "react";
import api from "../Api.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@fortawesome/fontawesome-free/css/all.min.css"; // For icons

const ManageProductPricesTable = () => {
  const [productList, setProductList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const initializeFormData = (productsToInit) => {
    const initialData = {};
    (productsToInit || []).forEach((product) => {
      initialData[product.ProductID] = {
        newPrice: "",
        newDiscount: "",
        discountEndDate: product.DiscountEndDate
          ? new Date(product.DiscountEndDate)
          : null,
      };
    });
    setFormData(initialData);
  };

  const fetchProductList = async () => {
    try {
      const response = await api.get("/product/get");
      const fetchedProducts = response.data.Products || [];
      setProductList(fetchedProducts);
      initializeFormData(fetchedProducts);
    } catch (error) {
      console.error("Error fetching product list:", error);
      setProductList([]);
      initializeFormData([]);
    }
  };

  useEffect(() => {
    fetchProductList();
  }, []);

  useEffect(() => {
    let current = productList;
    if (searchTerm) {
      current = productList.filter((product) => {
        return (
          product.ProductName.toLowerCase().includes(
            searchTerm.toLowerCase()
          ) ||
          String(product.ProductID).includes(searchTerm) ||
          (product.CategoryName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      });
    }
    setFilteredProducts(current);
    setCurrentPage(1);
  }, [searchTerm, productList]);

  const handleInputChange = (productId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: value,
      },
    }));
  };

  const handleUpdatePrice = async (productId) => {
    const productData = formData[productId];
    const newPriceStr = productData?.newPrice;

    if (!newPriceStr || newPriceStr.trim() === "") {
      alert("New price field cannot be empty.");
      return;
    }
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("Please enter a valid positive price!");
      return;
    }

    try {
      await api.put(
        `/product/update_price/${parseInt(productId)}?new_price=${newPrice}`
      );
      await fetchProductList();
      alert("Price updated successfully!");
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Failed to update price");
    }
  };

  const handleUpdatePromotion = async (productId) => {
    const productData = formData[productId];
    const newDiscountStr = productData?.newDiscount;
    const discountEndDate = productData?.discountEndDate;

    if (newDiscountStr === undefined || newDiscountStr.trim() === "") {
      alert("New discount field cannot be empty. Enter 0 for no discount.");
      return;
    }
    const newDiscount = parseFloat(newDiscountStr);
    if (isNaN(newDiscount) || newDiscount < 0 || newDiscount > 100) {
      alert("Please enter a valid discount percentage (0-100)!");
      return;
    }
    if (!discountEndDate) {
      alert("Please select a discount end date!");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(discountEndDate) < today && newDiscount > 0) {
      alert("Discount end date must be today or a future date!");
      return;
    }

    try {
      await api.put(`/product/update_discount/${productId}`, {
        Discount: newDiscount,
        EndDate: discountEndDate.toISOString().split("T")[0],
      });
      await fetchProductList();
      alert("Promotion updated successfully!");
    } catch (error) {
      console.error("Error updating promotion:", error);
      alert("Failed to update promotion");
    }
  };

  const handleRemovePromotion = async (productId) => {
    if (!window.confirm("Are you sure you want to remove the discount?")) {
      return;
    }
    try {
      await api.put(`/product/update_discount/${productId}`, {
        Discount: 0,
        EndDate: null,
      });
      await fetchProductList();
      alert("Discount removed successfully!");
    } catch (error) {
      console.error("Error removing promotion:", error);
      alert("Failed to remove promotion");
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handlePreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) =>
      Math.min(prev + 1, Math.ceil(filteredProducts.length / itemsPerPage))
    );

  return (
    <div className="manage-product-prices-content">
      <input
        type="text"
        placeholder="Search by Product Name, ID, or Category..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />
      <div className="prices-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Current Price</th>
              <th>Gov Suggested</th>
              <th>Gov Threshold</th>
              <th>Discount (%)</th>
              <th>Discount End</th>
              <th style={{ minWidth: "120px" }}>Set New Price</th>
              <th style={{ minWidth: "160px" }}>Set New Discount (%)</th>
              <th style={{ minWidth: "160px" }}>Set Discount End Date</th>
              <th style={{ minWidth: "220px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((product) => {
                const overThreshold =
                  product.Threshold && product.Price > product.Threshold;
                return (
                  <tr key={product.ProductID}>
                    <td>{product.ProductName}</td>
                    <td>{product.CategoryName || "N/A"}</td>
                    <td>
                      <span
                        className={overThreshold ? "price-over-threshold" : ""}
                      >
                        ₺
                        {product.Price !== undefined
                          ? product.Price.toFixed(2)
                          : "N/A"}
                      </span>
                      {overThreshold && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          Warning: Current price exceeds threshold.
                        </div>
                      )}
                    </td>
                    <td>
                      ₺
                      {product.SuggestedPrice !== undefined
                        ? product.SuggestedPrice.toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      ₺
                      {product.Threshold !== undefined
                        ? product.Threshold.toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      {product.Discount ? `${product.Discount}%` : "None"}
                    </td>
                    <td>
                      {product.DiscountEndDate
                        ? new Date(product.DiscountEndDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                        : "N/A"}
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
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
                    </td>
                    <td>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder="%"
                        value={formData[product.ProductID]?.newDiscount || ""}
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
                      <DatePicker
                        selected={
                          formData[product.ProductID]?.discountEndDate
                            ? new Date(
                                formData[product.ProductID].discountEndDate
                              )
                            : null
                        }
                        onChange={(date) =>
                          handleInputChange(
                            product.ProductID,
                            "discountEndDate",
                            date
                          )
                        }
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select Date"
                        className="date-picker-input"
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="update-button"
                        onClick={() => handleUpdatePrice(product.ProductID)}
                        disabled={!formData[product.ProductID]?.newPrice}
                      >
                        Update Price
                      </button>
                      <button
                        className="update-button"
                        onClick={() => handleUpdatePromotion(product.ProductID)}
                        disabled={
                          !(
                            formData[product.ProductID]?.newDiscount !== "" &&
                            formData[product.ProductID]?.discountEndDate
                          )
                        }
                      >
                        Set Promo
                      </button>
                      {product.Discount > 0 && (
                        <button
                          className="delete-button"
                          onClick={() =>
                            handleRemovePromotion(product.ProductID)
                          }
                        >
                          Remove Promo
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" className="placeholder-text">
                  {searchTerm
                    ? "No products match your search."
                    : "No products available to manage prices."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredProducts.length > itemsPerPage && (
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
              currentPage === Math.ceil(filteredProducts.length / itemsPerPage)
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageProductPricesTable;
