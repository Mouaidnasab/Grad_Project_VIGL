import React, { useState, useEffect } from 'react';
import api from '../api'; 
import './StaffAddPage.css';
import Footer from '../components/footerInit.js'; 
import NavInit from '../components/NavInit.js';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; 

const StaffAddPage = () => {
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    Username: '',
    Email: '',
    Password: '',
    Role: '',
  });

  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const response = await api.get('/users/list');

      setStaffList(response.data);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/users/create', {
        Username: formData.Username,
        Email: formData.Email,
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        Password: formData.Password,
        Role: formData.Role,
        Disabled: false,
      });
      console.log('User created:', response.data);
      fetchStaffList(); 
      setFormData({
        FirstName: '',
        LastName: '',
        Username: '',
        Email: '',
        Password: '',
        Role: '',
      });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleFinish = () => {
    navigate('/'); 
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
                    name="FirstName"
                    value={formData.FirstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                    className='input1'
                  />
                  <label htmlFor="FirstName">First Name</label>
                </div>
                <div className="input-group1">
                  <input
                    type="text"
                    name="LastName"
                    value={formData.LastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                    className='input1'
                  />
                  <label htmlFor="LastName">Last Name</label>
                </div>
              </div>
              <div className="input-group1 input-group-username">
                <input
                  type="text"
                  name="Username"
                  value={formData.Username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                  className='input1'
                />
                <label htmlFor="Username">Username</label>
              </div>

              <div className="input-group1">
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className='input1'
                />
                <label htmlFor="Email">Email</label>
              </div>

              <div className="input-group1">
                <input
                  type="password"
                  name="Password"
                  value={formData.Password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  className='input1'
                />
                <label htmlFor="Password">Password</label>
              </div>

              <div className="input-group1 custom-dropdown">
                <select
                  className="custom-select"
                  name="Role"
                  value={formData.Role}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  {/* <option value="admin">Admin</option> */}
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
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
                    {/* <th>Actions</th> */}
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.UserID}>
                      <td>{staff.FirstName}</td>
                      <td>{staff.LastName}</td>
                      <td>{staff.Username}</td>
                      <td>{staff.Email}</td>
                      <td>{staff.Role}</td>
                      {/* <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(index)}
                        >
                          Delete
                        </button>
                      </td> */}
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(11 - staffList.length, 0) }).map((_, index) => (
                    <tr key={`empty-${index}`} className="empty-row">
                      <td colSpan="5"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-buttons">
              {/* <button type="button" onClick={handleBack} className="backk-btn">Back</button> */}
              <button type="button" onClick={handleFinish} className="finish-btn">Finish</button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default StaffAddPage;
