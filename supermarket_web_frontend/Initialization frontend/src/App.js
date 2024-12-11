import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminRegistrationPage from './pages/AdminRegistrationPage';
import SupermarketAddPage from './pages/SupermarketAddPage';
import StaffAddPage from './pages/StaffAddPage';
import LoginPage from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route to redirect to admin registration */}
        <Route path="/" element={<Navigate to="/admin-registration" />} />
        <Route path="/admin-registration" element={<AdminRegistrationPage />} />
        <Route path="/supermarket-registration" element={<SupermarketAddPage />} />
        <Route path="/staff-registration" element={<StaffAddPage />} />
        <Route path="/staff-add" element={<StaffAddPage />} /> 
        <Route path="/login" element={<LoginPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
