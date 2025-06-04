import React from 'react';
import "../Css/Settings.css";
import BootstrapNavbar from '../component/BootstrapNavbar';
import Footer from '../component/footerInit.jsx';
import '@fortawesome/fontawesome-free/css/all.min.css';
import leftPhoneIllustration from '../images/user_management_illustration.jpg'; 
import curvedBottomRightGraphic from '../images/curved-bottom-right-graphic.png'; 

const SettingsPage = () => {
    return (
        <div className="page-wrapper">
            <BootstrapNavbar />

            <div className="main-content-layout-two-columns">
                <div className="settings-image-column">
                    <img
                        src={leftPhoneIllustration} 
                        alt="User Management Illustration"
                        className="settings-column-image"
                    />
                </div>

                <div className="settings-right-column-content">
                    <div className="buttons-container">
                        <h2 className="buttons-container-title">
                            MANAGE
                        </h2>

                        <a href="/add-staff">
                            <button className="block-button">
                                <i className="fas fa-user-plus"></i> Add User
                            </button>
                        </a>
                    </div>
                    <img
                        src={curvedBottomRightGraphic} 
                        alt="Decorative graphic"
                        className="curved-bottom-right-graphic"
                    />
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default SettingsPage;