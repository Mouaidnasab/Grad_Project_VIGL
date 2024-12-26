// AdminRegistrationPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminRegistrationPage.css';
import welcomeImage from '../images/welcome.png';
import LogoCarousel from '../components/LogoCarousel.js';
import Footer from '../components/footerInit.js';

const AdminRegistrationPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Retrieve environment variables
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const INITIALIZE_OWNER_API_KEY = process.env.REACT_APP_INITIALIZE_OWNER_API_KEY;

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Step 1: Initialize Owner
      const initResponse = await fetch(`${BACKEND_URL}/users/initialize_owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Initialize-Owner-Token': INITIALIZE_OWNER_API_KEY,
        },
        body: JSON.stringify({
          Username: formData.username,
          Email: formData.email,
          FirstName: formData.firstName,
          LastName: formData.lastName,
          Password: formData.password,
          Disabled: false, // Default value
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.detail || 'Failed to initialize owner');
      }

      const initData = await initResponse.json();
      console.log('Owner initialized successfully:', initData);
      setSuccess('Owner account created successfully! Logging in...');

      // Step 2: Login to obtain tokens
      const loginResponse = await fetch(`${BACKEND_URL}/user_auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.detail || 'Failed to login after registration');
      }

      const tokenData = await loginResponse.json();
      console.log('Login successful:', tokenData);

      // Save tokens to localStorage (consider more secure storage in production)
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);

      setSuccess('Owner account created and logged in successfully!');
      navigate('/supermarket-registration'); // Navigate to the next page
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="image-container">
        <img src={welcomeImage} alt="Logo" className="header-image" />
      </div>

      <div className="form-container">
        <h1>Admin Registration</h1>
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="input-group-name">
            <div className="input-group">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                required
              />
              <label htmlFor="firstName">First Name</label>
            </div>
            <div className="input-group">
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                required
              />
              <label htmlFor="lastName">Last Name</label>
            </div>
          </div>

          <div className="input-group input-group-username">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              required
            />
            <label htmlFor="username">Username</label>
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
            <label htmlFor="email">Email</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
            <label htmlFor="password">Password</label>
          </div>
          {/* 
            <div className="login-section">
              <span>Already have an account? </span>
              <button type="button" onClick={handleLogin} className="login-link1">Login</button>
            </div> 
          */}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="button-wrapper">
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Next'}
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

export default AdminRegistrationPage;
