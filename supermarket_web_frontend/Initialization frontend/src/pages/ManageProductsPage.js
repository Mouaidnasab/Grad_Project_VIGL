import React, { useState } from 'react';
import Table from '../components/Table';
import ActionButton from '../components/ActionButton';
import NavInit from '../components/NavInit';
import FooterWithTabs from '../components/FooterWithTabs';
import './ManageProductsPage.css';

// Mock Data
const shelves = [
    { shelfName: "Shelf 1", productName: "lemon", lastEditDate: "2024-10-19", isEmpty: true },
    { shelfName: "Shelf 2", productName: "orange", lastEditDate: "Unknown", isEmpty: true },
    { shelfName: "Shelf 3", productName: "mango", lastEditDate: "2024-08-19", isEmpty: true },
    { shelfName: "Shelf 4", productName: "berry", lastEditDate: "Unknown", isEmpty: true },
];

const unshelvedProducts = [
    { productName: "Olive oil", lastDisplayDate: "2024-03-19" },
    { productName: "Cheese", lastDisplayDate: "2024-09-19" },
];

const ManageProductsPage = () => {
    const [activeTab, setActiveTab] = useState('ManageProducts');

    // Helper functions for rendering rows
    const renderShelfRow = (row, idx) => (
        <tr key={idx}>
            <td className="table-cell clickable">{row.shelfName}</td>
            <td className="table-cell">{row.productName}</td>
            <td className="table-cell">{row.lastEditDate}</td>
            <td className="table-cell">
                <ActionButton
                    label={'Shelf is empty'}
                    
                    onClick={!row.isEmpty ? () => handleRemoveProduct(row.shelfName) : null}
                />
            </td>
        </tr>
    );

    const renderUnshelvedProductRow = (row, idx) => (
        <tr key={idx}>
            <td className="table-cell">{row.productName}</td>
            <td className="table-cell">{row.lastDisplayDate}</td>
            <td className="table-cell">
                <ActionButton label="Delete" onClick={() => handleDeleteProduct(row.productName)} />
            </td>
        </tr>
    );

    // Placeholder actions
    const handleRemoveProduct = (shelfName) => {
        console.log(`Removing product from ${shelfName}`);
    };

    const handleDeleteProduct = (productName) => {
        console.log(`Deleting ${productName}`);
    };

    return (
        <div className="container">
            <NavInit />

            <h2></h2>
            

            {/* Shelves Table */}
            <h3 className="table-title">Manage Products on shelves</h3>
            {shelves.length === 0 ? (
                <p className="placeholder">No shelves available.</p>
            ) : (
                <Table
                    headers={['Shelf Name', 'Product Name', 'Last Edit Date', 'Actions']}
                    data={shelves}
                    renderRow={renderShelfRow}
                />
            )}

            {/* Unshelved Products Table */}
            <h3 className="table-title">Products that are not on a shelf</h3>
            {unshelvedProducts.length === 0 ? (
                <p className="placeholder">No unshelved products available.</p>
            ) : (
                <Table
                    headers={['Product Name', 'Last Display Date', 'Actions']}
                    data={unshelvedProducts}
                    renderRow={renderUnshelvedProductRow}
                />
            )}

            <FooterWithTabs />
        </div>
    );
};

export default ManageProductsPage;
