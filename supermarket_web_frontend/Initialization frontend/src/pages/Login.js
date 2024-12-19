import React, { useState } from 'react';
import './AdminRegistrationPage.css';
import welcomeImage from '../images/welcomewithoutbg.png';
import Footer from '../components/footerInit';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login Data:', formData);
  };

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

          <div className="button-wrapper">
            <button type="submit" className="submit-btn">Login</button>
          </div>
        </form>
      </div>
        

      <Footer />
    </div>
  );
};

export default LoginPage;
