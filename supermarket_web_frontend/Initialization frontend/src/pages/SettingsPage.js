import React from 'react';
import FooterWithTabs from '../components/FooterWithTabs';

const SettingsPage = () => {
    console.log("SettingsPage is rendering"); // Debug message
    return (
        <div>
            <h1>Settings</h1>
            <p>This is the settings page.</p>
	    <FooterWithTabs />	
        </div>
    );
};

export default SettingsPage;
