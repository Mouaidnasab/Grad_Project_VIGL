import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';
import DashboardOverview from '../Components/DashboardOverview';
import SupermarketsTab from '../Components/SupermarketsTab';
import StaffTab from '../Components/StaffTab';
import ProductsTab from '../Components/ProductsTab';
import PenaltiesTab from '../Components/PenaltiesTab';
import { AddSupermarketModal } from '../Components/CommonComponents';
import '../css/Dashboard.css';

const initialMockSupermarketsData = [
];

export default function DashboardPage() {
    const [activePage, setActivePage] = useState('dashboard');
    const [supermarketsList, setSupermarketsList] = useState(initialMockSupermarketsData);
    const [isAddSupermarketModalOpen, setIsAddSupermarketModalOpen] = useState(false);

    const handleAddSupermarket = (formData) => {
        const newSupermarket = { ...formData, id: `sm${Date.now().toString().slice(-4)}` };
        setSupermarketsList(prevList => [newSupermarket, ...prevList]);
    };

    const handleUpdateSupermarket = (updatedData) => {
        setSupermarketsList(prevList => prevList.map(s => s.id === updatedData.id ? updatedData : s));
    };

    const renderActivePage = () => {
        switch (activePage) {
            case 'dashboard':
                return <DashboardOverview supermarketsCount={supermarketsList.length} />;
            case 'supermarkets':
                return <SupermarketsTab 
                            supermarkets={supermarketsList} 
                            onAdd={() => setIsAddSupermarketModalOpen(true)} 
                            onUpdate={handleUpdateSupermarket} 
                        />;
            case 'staff':
                return <StaffTab />;
            case 'products':
                return <ProductsTab />;
            case 'penalties':
                return <PenaltiesTab />;
            default:
                return <DashboardOverview supermarketsCount={supermarketsList.length} />;
        }
    };

    return (
        <div className="app-container">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <main className="main-content2">
                {renderActivePage()}
            </main>
            <AddSupermarketModal 
                isOpen={isAddSupermarketModalOpen} 
                onClose={() => setIsAddSupermarketModalOpen(false)} 
                onSubmit={handleAddSupermarket} 
            />
        </div>
    );
}