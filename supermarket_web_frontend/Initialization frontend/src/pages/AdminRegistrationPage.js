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

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Admin Form Submitted', formData);
    navigate('/supermarket-registration'); 
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

          <div className="button-wrapper">
            <button type="submit" className="submit-btn">Next</button>
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
