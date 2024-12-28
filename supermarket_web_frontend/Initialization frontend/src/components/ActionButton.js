import React from 'react';
import './ActionButton.css'; 

const ActionButton = ({ label, onClick, style }) => {
    return (
        <button className="action-button" style={style} onClick={onClick}>
            {label}
        </button>
    );
};

export default ActionButton;
