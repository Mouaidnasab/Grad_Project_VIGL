// src/component/footerInit.jsx
import React from 'react';
import '../Css/Admintry.css'; // Ensure your CSS is imported here or globally

const Footer = () => {
  return (
    <div className="fixed-footer"> {/* Apply the new fixed-footer class */}
      <p>&copy; {new Date().getFullYear()} VIGL. All rights reserved.</p>
      {/* Add any other footer content here */}
    </div>
  );
};

export default Footer;