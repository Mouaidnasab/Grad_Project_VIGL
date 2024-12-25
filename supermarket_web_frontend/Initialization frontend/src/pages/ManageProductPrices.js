import React, { useState } from "react";
import "./ManageProductPrices.css";
import Footer from "../components/footerInit.js"; // Adjust the import path if necessary
import NavInit from "../components/NavInit"; // Adjust the import path if necessary

const ManageProductPrices = () => {
  const allProducts = [
    { id: 1, name: "Product 1", currentPrice: "$10.00", currentPromo: "10% Off" },
    { id: 2, name: "Product 2", currentPrice: "$15.00", currentPromo: "None" },
    { id: 3, name: "Product 3", currentPrice: "$20.00", currentPromo: "20% Off" },
    { id: 4, name: "Product 4", currentPrice: "$25.00", currentPromo: "15% Off" },
    { id: 5, name: "Product 5", currentPrice: "$30.00", currentPromo: "None" },
    { id: 6, name: "Product 6", currentPrice: "$35.00", currentPromo: "10% Off" },
    { id: 7, name: "Product 7", currentPrice: "$40.00", currentPromo: "5% Off" },
    { id: 8, name: "Product 8", currentPrice: "$45.00", currentPromo: "None" },
    { id: 9, name: "Product 9", currentPrice: "$50.00", currentPromo: "25% Off" },
    { id: 10, name: "Product 10", currentPrice: "$55.00", currentPromo: "None" },
    { id: 11, name: "Product 11", currentPrice: "$60.00", currentPromo: "20% Off" },
    { id: 12, name: "Product 12", currentPrice: "$65.00", currentPromo: "10% Off" },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState(allProducts); // Replace with actual data fetching
  const [errorMessages, setErrorMessages] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const productsPerPage = 10;

  // Calculate the index of the first product on the current page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  // Slice the products array to only show the products for the current page
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Validate new price and new promotion
  const validateInputs = (newPrice, newPromo) => {
    let errors = {};

    // Validate new price (should be a float)
    if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
      errors.newPrice = "New price must be a positive number.";
    }

    // Validate new promotion (should be between 0 and 100)
    if (!newPromo || isNaN(newPromo) || newPromo < 0 || newPromo > 100) {
      errors.newPromo = "New promotion must be between 0 and 100.";
    }

    return errors;
  };

  // Handle the Update action
  const handleUpdate = (id, newPrice, newPromo) => {
    const errors = validateInputs(newPrice, newPromo);
    if (Object.keys(errors).length > 0) {
      setErrorMessages(errors);
      setModalMessage("There was an error with your inputs.");
      setShowModal(true);
      return;
    }

    console.log(`Product ID: ${id}, New Price: ${newPrice}, New Promotion: ${newPromo}`);
    // Handle backend API call or state update here
    setErrorMessages({}); // Clear errors on successful update
  };

  // Calculate total pages
  const totalPages = Math.ceil(products.length / productsPerPage);

  return (
    <>
      <NavInit />

      <div className="outer-container">
        <div className="page-wrapper">
          {/* Product Table Section */}
          <div className="table-container">
            <h2>Manage Product Prices</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Current Price</th>
                    <th>New Price</th>
                    <th>Current Promotion</th>
                    <th>New Promotion</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.currentPrice}</td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter new price"
                          className="input-field"
                          onChange={(e) => {
                            const updatedProducts = [...products];
                            const productIndex = updatedProducts.findIndex(p => p.id === product.id);
                            updatedProducts[productIndex].newPrice = e.target.value;
                            setProducts(updatedProducts);
                          }}
                        />
                        {errorMessages.newPrice && <div className="error-message">{errorMessages.newPrice}</div>}
                      </td>
                      <td>{product.currentPromo}</td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter new promotion"
                          className="input-field"
                          onChange={(e) => {
                            const updatedProducts = [...products];
                            const productIndex = updatedProducts.findIndex(p => p.id === product.id);
                            updatedProducts[productIndex].newPromo = e.target.value;
                            setProducts(updatedProducts);
                          }}
                        />
                        {errorMessages.newPromo && <div className="error-message">{errorMessages.newPromo}</div>}
                      </td>
                      <td>
                        <button
                          className="update-button"
                          onClick={() => handleUpdate(product.id, product.newPrice, product.newPromo)}
                          disabled={!product.newPrice || !product.newPromo || errorMessages.newPrice || errorMessages.newPromo}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-controls">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>{`Page ${currentPage} of ${totalPages}`}</span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pop-up for Errors */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <h2>{modalMessage}</h2>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ManageProductPrices;
