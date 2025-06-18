// src/component/footerInit.jsx
import React from "react";
import "../Css/Admintry.css";

const Footer = () => {
  return (
    <div className="fixed-footer">
      <p>&copy; {new Date().getFullYear()} VIGL. All rights reserved.</p>
    </div>
  );
};

export default Footer;
