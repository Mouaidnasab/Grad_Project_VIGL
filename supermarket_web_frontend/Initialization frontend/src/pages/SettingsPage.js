import React from 'react';
import Footer from '../components/footerInit';
import SettingsBlocks from '../components/SettingsBlocks';
import Navbar from "../components/Navbar";

const SettingsPage = () => {
    console.log("SettingsPage is rendering"); // Debug message
    return (
        <>
               <Navbar />
               <div>

                    <SettingsBlocks />
                    <Footer />	

                </div>
      </>
    );
};

export default SettingsPage;
