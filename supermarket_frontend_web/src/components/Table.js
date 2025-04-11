import React from 'react';
import './Table.css'; // Import the CSS file

const Table = ({ headers, data, renderRow }) => {
    return (
        <table className="custom-table">
            <thead>
                <tr>
                    {headers.map((header, idx) => (
                        <th key={idx} className="table-header">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((item, idx) => renderRow(item, idx))}
            </tbody>
        </table>
    );
};

export default Table;
