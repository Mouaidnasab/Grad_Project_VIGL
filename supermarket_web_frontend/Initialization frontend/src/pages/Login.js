// LoginPage.js

import React, { useState, useEffect } from 'react';
import { redirect, useNavigate } from 'react-router-dom';
import api from '../api'; // Import the Axios instance
import './AdminRegistrationPage.css';
import welcomeImage from '../images/welcome.png';
import Footer from '../components/footerInit';



const LoginPage = () => {


// Temp solution to redirect this will be replaced
useEffect(() => {
  fetchProductList();
}, []);

const fetchProductList = async () => {
  try {
    const response = await api.get('/product/get');
    navigate('/overview-dashboard');
  } catch (error) {
    console.error('Error fetching product list:', error);
  }
};



  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [status, setStatus] = useState(null); 
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    const loginPayload = new URLSearchParams({
      username: formData.username,
      password: formData.password,
    });

    try {
      const response = await api.post('/user_auth/token', loginPayload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('Login successful:', response.data);

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);

      setStatus('success');

      navigate('/overview-dashboard'); 
    } catch (err) {
      console.error('Error during login:', err);
      setStatus('error');
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    }
  };

  useEffect(() => {
    const checkOwnerAndAuthentication = async () => {
      try {
        const response = await api.get('/users/is_owner');
        if (!response.data) {
          navigate('/admin-registration');
        }
      } catch (err) {
        if (!err.response) {
          console.error('Server is down or unreachable:', err);
          setError('The server is currently down. Please try again later.');
        } else {
          console.error('Error checking owner existence:', err);
          setError('An unexpected error occurred while checking owner status.');
        }
      }
    };

    checkOwnerAndAuthentication();
  }, [navigate]);

  return (
    <div className="page-container login-page">
      <div className="image-container">
        <img src={welcomeImage} alt="Logo" className="header-image" />
      </div>

      <div className="form-container">
        <h1>Login</h1>
        <form className="registration-form" onSubmit={handleSubmit}>
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
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
            <label htmlFor="password">Password</label>
          </div>

          {error && <div className="error-message">{error}</div>}
          {status === 'success' && <div className="success-message">Login successful! Redirecting...</div>}

          <div className="button-wrapper">
            <button type="submit" className="submit-btn" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default LoginPage;
