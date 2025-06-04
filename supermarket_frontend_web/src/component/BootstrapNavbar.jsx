import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../componentcss/BootstrapNavbar.css';

const BootstrapNavbar = () => (
  <nav className="navbar navbar-expand-lg navbar-light custom-navbar">
    <div className="container-fluid">
      <Link className="navbar-brand navbar-logo" to="/">VIGL</Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse navbar-links-wrapper" id="navbarNav">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0 navbar-links">
          <li className="nav-item"><Link className="nav-link" to="/about">About</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/manage-products">Products Mng</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/manage-shelves-screens">Shelf-Screen Mng</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/penalties">Penalties</Link></li>

          <li className="nav-item"><Link className="nav-link" to="/settings">Settings</Link></li>
        </ul>
        <Link to="/login" >
        <div className="d-flex navbar-profile align-items-center" >
            <i className="fas fa-user" style={{ fontSize: '20px', color: 'white' }}></i>
        </div>
          </Link>
      </div>
    </div>
  </nav>
);

export default BootstrapNavbar;
