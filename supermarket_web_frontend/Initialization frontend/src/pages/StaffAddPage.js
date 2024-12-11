import React, { useState } from 'react';
import './StaffAddPage.css';
import Footer from '../components/footerInit.js'; 
import NavInit from '../components/NavInit.js';
import { useNavigate } from 'react-router-dom';

const StaffAddPage = () => {
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: '',
  });

  const [staffList, setStaffList] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Staff Form Submitted', formData);
    setStaffList([...staffList, formData]);
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      role: '',
    });
  };

  const handleDelete = (index) => {
    const updatedStaffList = staffList.filter((_, i) => i !== index);
    setStaffList(updatedStaffList);
  };

  const handleBack = () => {
    navigate('/supermarket-registration'); 
  };

  return (
    <>
      <NavInit />

      <div className="outer-container">
        <div className="page-wrapper1">
          <div className="form-container2">
            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="h1-container">
                <h1 className="h1form">Add New Staff</h1>
              </div>
              <div className="input1-group-name">
                <div className="input-group1">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                    className='input1'
                  />
                  <label htmlFor="firstName">First Name</label>
                </div>
                <div className="input-group1">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                    className='input1'
                  />
                  <label htmlFor="lastName">Last Name</label>
                </div>
              </div>

              <div className="input-group1 input-group-username">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                  className='input1'
                />
                <label htmlFor="username">Username</label>
              </div>

              <div className="input-group1">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className='input1'
                />
                <label htmlFor="email">Email</label>
              </div>

              <div className="input-group1">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  className='input1'
                />
                <label htmlFor="password">Password</label>
              </div>

              <div className="input-group1 custom-dropdown">
                <select
                  className="custom-select"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div className="button-wrapper">
                <button type="submit" className="submit-btn">Add</button>
              </div>
            </form>
          </div>

          <div className="table-container1">
            <h2>Staff List</h2>
            <div className="table-wrapper" style={{ overflowX: 'auto', margin: '0 15px' }}>
              <table>
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff, index) => (
                    <tr key={index}>
                      <td>{staff.firstName}</td>
                      <td>{staff.lastName}</td>
                      <td>{staff.username}</td>
                      <td>{staff.email}</td>
                      <td>{staff.role}</td>
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(index)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(11 - staffList.length, 0) }).map((_, index) => (
                    <tr key={`empty-${index}`} className="empty-row">
                      <td colSpan="6"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-buttons">
              <button type="button" onClick={handleBack} className="backk-btn">Back</button>
              <button type="button" className="finish-btn">Finish</button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default StaffAddPage;
