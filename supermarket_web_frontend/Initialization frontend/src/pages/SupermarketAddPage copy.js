import React, { useState } from 'react';
import './AdminRegistrationPage.css'; 
import welcomeImage from '../images/welcome.png';
import LogoCarousel from '../components/LogoCarousel.js';
import Footer from '../components/footerInit.js'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Ensure axios is installed: npm install axios

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; // Using environment variable

const SupermarketAddPage = () => {
  // Corrected formData keys to match input names
  const [formData, setFormData] = useState({
    registeredID: '', 
    registeredDate: '',
    registeredName: '',
    address: '',
    contactPersonFullName: '',
  });

  // State to manage form submission status
  const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [error, setError] = useState(null); // To store error messages

  const navigate = useNavigate(); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    // Prepare the payload
    const payload = {
      RegisteredID: formData.registeredID, // Set to 0; backend should handle actual ID
      RegisteredDate: new Date(formData.registeredDate).toISOString(), // Ensure ISO format
      RegisteredName: formData.registeredName,
      Address: formData.address,
      ContactPersonFullName: formData.contactPersonFullName,
    };

    try {
      // Retrieve the access token from localStorage
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      // Make the POST request to the backend
      const response = await axios.post(
        `${BACKEND_URL}/supermarket/create`, // Using environment variable
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Include token for authentication
          },
        }
      );

      console.log('Supermarket created successfully:', response.data);
      setStatus('success');

      // Optionally, you can pass some data to the next page
      navigate('/staff-add'); 
    } catch (err) {
      console.error('Error creating supermarket:', err);
      setStatus('error');
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    }
  };

  // Determine the button label based on status
  const getButtonLabel = () => {
    switch(status) {
      case 'submitting':
        return 'Submitting...';
      case 'error':
        return 'Retry';
      case 'success':
        return 'Next';
      default:
        return 'Submit';
    }
  };

  return (
    <div className="page-container">
      <div className="image-container">
        <img src={welcomeImage} alt="Logo" className="header-image" />
      </div>

      <div className="form-container">
        <h1>Supermarket Registration</h1>
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="input-group-name">
            <div className="input-group">
              <input
                type="text"
                name="registeredID"
                value={formData.registeredID}
                onChange={handleChange}
                placeholder="Registered ID"
                required
                //use 'disabled' for later to disable input
              />
              <label htmlFor="registeredID">Registered ID</label>
            </div>
            <div className="input-group">
              <input
                type="date" // Changed to date input for user to select date
                name="registeredDate"
                value={formData.registeredDate}
                onChange={handleChange}
                placeholder="Registered Date"
                required
              />
              <label htmlFor="registeredDate">Registered Date</label>
            </div>
          </div>

          <div className="input-group input-group-username">
            <input
              type="text"
              name="registeredName"
              value={formData.registeredName}
              onChange={handleChange}
              placeholder="Registered Name"
              required
            />
            <label htmlFor="registeredName">Registered Name</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              required
            />
            <label htmlFor="address">Address</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              name="contactPersonFullName"
              value={formData.contactPersonFullName}
              onChange={handleChange}
              placeholder="Contact Person Full Name"
              required
            />
            <label htmlFor="contactPersonFullName">Contact Person Full Name</label>
          </div>

          {/* Display error message if any */}
          {status === 'error' && error && (
            <div className="error-message">{error}</div>
          )}

          <div className="button-wrapper">
            {/* <button type="button" className="back-btn" onClick={handleBack}>
              Back
            </button> */}
            <button
              type="submit" // Changed to submit the form
              className="next-btn"
              disabled={status === 'submitting'}
            >
              {getButtonLabel()}
            </button>
          </div>
        </form>
      </div>

      <div className="carousel-container">
        <LogoCarousel />
      </div>
      <Footer />
    </div>
  );
};

export default SupermarketAddPage;
