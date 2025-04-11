import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminRegistrationPage from './pages/AdminRegistrationPage';
import SupermarketAddPage from './pages/SupermarketAddPage';
import StaffAddPage from './pages/StaffAddPage';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import ManageShelf from './pages/ManageShelf';
import OverviewDashboard from './pages/Dashboard';
import ManageProductsPage from './pages/ManageProductsPage';
import ManageProductPrices from './pages/ManageProductPrices'; 
import OwnerPage from './pages/OwnerPage';



function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Navigate to="/overview-dashboard" />} />
          <Route path="/overview-dashboard" element={<OverviewDashboard />} />
          <Route path="/admin-registration" element={<AdminRegistrationPage />} />
          <Route path="/supermarket-registration" element={<SupermarketAddPage />} />
          <Route path="/staff-registration" element={<StaffAddPage />} />
          <Route path="/staff-add" element={<StaffAddPage />} /> 
          <Route path="/login" element={<LoginPage />} />
          <Route path="/manage-shelves" element={<ManageShelf />} /> 
          <Route path="/settings" element={<SettingsPage />} /> 
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/manage-products" element={<ManageProductsPage />} />
          <Route path="/manage-products-prices" element={<ManageProductPrices />} />
          <Route path="/owner-settings" element={<OwnerPage />} />

        </Routes>
        </BrowserRouter>
    );
}

export default App;
