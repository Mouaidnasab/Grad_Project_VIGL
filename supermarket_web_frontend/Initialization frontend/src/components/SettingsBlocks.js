import React from 'react';
import './SettingsBlock.css';
import settingsLogo from '../images/SettingsLogo.png'; // Adjust the path based on your folder structure

const SettingsBlocks = () => {
    return (
        <div className="settings-container">
            <h1 className="settings-title">
                <span
                    className="settings-icon"
                    style={{ backgroundImage: `url(${settingsLogo})` }}
                ></span>
                Settings
            </h1>
            <div className="settings-main">
                <div className="settings-block">
                    <h2 className="block-title">MANAGE USERS</h2>
                    <a href="/owner">
                        <button className="block-button">Owner</button>
                    </a>
                    <button className="block-button">Staff</button>
                </div>
                <div className="settings-block">
                    <h2 className="block-title">MANAGE STORE</h2>
                    <button className="block-button">Products</button>
                    <button className="block-button">Shelves and Screens</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsBlocks;
