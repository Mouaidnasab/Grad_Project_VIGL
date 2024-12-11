import React, { useState } from 'react';
import './AdminRegistrationPage.css'; 
import welcomeImage from '../images/welcome.png';
import LogoCarousel from '../components/LogoCarousel.js';
import Footer from '../components/footerInit.js'; 
import { useNavigate } from 'react-router-dom';

const SupermarketAddPage = () => {
  const [formData, setFormData] = useState({
    supermarketName: '',
    address: '',
    phone: '',
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

  const handleNext = () => {
    navigate('/staff-add'); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Supermarket Form Submitted', formData);
  };

  const handleBack = () => {
    navigate('/admin-registration'); 
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
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Registered ID"
                required
              />
              <label htmlFor="firstName">Registered ID</label>
            </div>
            <div className="input-group">
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Registered Date"
                required
              />
              <label htmlFor="lastName">Registered Date</label>
            </div>
          </div>

          <div className="input-group input-group-username">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Registered Name"
              required
            />
            <label htmlFor="username">Registered Name</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Address"
              required
            />
            <label htmlFor="email">Address</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contact Person Full name"
              required
            />
            <label htmlFor="password">Contact Person Full name</label>
          </div>

          <div className="button-wrapper">
            <button type="button" className="back-btn" onClick={handleBack}>
              Back
            </button>
            <button type="button" onClick={handleNext} className="next-btn">
              Next
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
