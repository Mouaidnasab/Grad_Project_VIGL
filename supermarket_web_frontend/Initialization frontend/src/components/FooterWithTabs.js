import React from 'react';
import './FooterWithTabs.css';  // New CSS file for the updated styling

const FooterWithTabs = () => {
  return (
    <footer className="footer-tabs">
      <div className="nav-links">
        <a href="/staff-add">add staff</a>
        <span>|</span>
        <a href="/settings">Settings</a>
        <span>|</span>
        <a href="/settings">Settings</a>
      </div>
      <p>&copy; All rights reserved, developed by VIGL Team</p>
    </footer>
  );
};

export default FooterWithTabs;
