import React, { useState } from 'react';
import './Navbar.css';
import { useNavigate } from 'react-router-dom'; 


const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate(); 

  return (
    <nav className="navbarfull">
      <ul className="logo">
        <li><a
              href="#"
              onClick={(e) => {
                e.preventDefault(); 
                navigate('/');
              }}
            >VIGL</a></li>    
      </ul>  
        <div className="navbar-center">
        <ul className={isMobile ? "nav-links-mobile" : "nav-links"} onClick={() => setIsMobile(false)}>
          <li><a
              href="#"
              onClick={(e) => {
                e.preventDefault(); 
                navigate('/');
              }}
            >Overview</a></li>
          <li><a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/manage-products-prices');
              }}
            >Manage Product Prices</a></li>
          {/* <div className="search-container">
            <input type="text" className="search-bar" placeholder="Search..." />
          </div> */}
          <li><a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/manage-shelves'); 
              }}
            >Manage Shelves and Screens</a></li>
          <li><a
              href="#"
              onClick={(e) => {
                e.preventDefault(); 
                navigate('/manage-products'); 
              }}
            >Manage Products</a></li>
            <li><a
            href="#"
            onClick={(e) => {
              e.preventDefault(); 
              navigate('/settings'); 
            }}
          >Settings</a></li>
        </ul>
      </div>
      <button className="mobile-menu-icon" onClick={() => setIsMobile(!isMobile)}>
        {isMobile ? <>&#10005;</> : <>&#9776;</>}
      </button>
    </nav>
  );
};

export default Navbar;