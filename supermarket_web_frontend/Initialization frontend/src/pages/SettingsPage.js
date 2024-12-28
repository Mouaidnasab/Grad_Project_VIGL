import React from 'react';
import FooterWithTabs from '../components/FooterWithTabs';
import SettingsBlocks from '../components/SettingsBlocks';
import NavInit from '../components/NavInit.js';

const SettingsPage = () => {
    console.log("SettingsPage is rendering"); // Debug message
    return (
        <>
               <NavInit />
               <div>

                    <SettingsBlocks />
                    <FooterWithTabs />	

                </div>
      </>
    );
};

export default SettingsPage;
