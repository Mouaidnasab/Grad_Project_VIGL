import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';
import { Boxes, Store, Gavel, Users } from 'lucide-react';
import { CommonTopBar } from './CommonComponents'; 

const StatCard = ({ title, value, icon: Icon, iconBgClass, iconTextClass }) => (
    <div className="stat-card">
        <div className={`stat-card-icon-wrapper ${iconBgClass}`}>
            <Icon size={28} className={`stat-card-icon ${iconTextClass}`} />
        </div>
        <div>
            <p className="stat-card-info-title">{title}</p>
            <p className="stat-card-info-value">{value}</p>
        </div>
    </div>
);

const PenaltiesStatusChart = () => {
    const data = [
        { name: 'Paid', value: 70, color: '#1E3A8A' },
        { name: 'Pending', value: 30, color: '#FACC15' },
    ];
    return (
        <div className="chart-card">
            <h3 className="chart-title">Penalties Status</h3>
            <div className="chart-container-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value">
                            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                            <Label value="Status" position="center" fontSize="16px" fontWeight="bold" />
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="chart-legend">
                {data.map(item => (<div key={item.name} className="chart-legend-item"><span className="chart-legend-color-box" style={{ backgroundColor: item.color }}></span><span>{item.name}: {item.value}%</span></div>))}
            </div>
            <button className="view-more-button">View more</button>
        </div>
    );
};

const ProductsDistributionChart = () => {
    const data = [
        { name: 'Fruits', value: 40, fill: '#FACC15' },
        { name: 'Vegetables', value: 25, fill: '#3B82F6' },
    ];
    return (
        <div className="chart-card">
            <h3 className="chart-title">Products Distribution</h3>
            <div className="chart-container-wrapper-flex-grow">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'rgba(200,200,200,0.2)' }} />
                        <Bar dataKey="value" barSize={60} radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="chart-legend">
                {data.map(item => (<div key={item.name} className="chart-legend-item"><span className="chart-legend-color-box" style={{ backgroundColor: item.fill }}></span><span>{item.name}</span></div>))}
            </div>
            <button className="view-more-button">View more</button>
        </div>
    );
};

export default function DashboardOverview({ supermarketsCount }) {
    const stats = [
        { title: 'Total Products', value: 65, icon: Boxes, iconBgClass: 'bg-red', iconTextClass: 'text-red' },
        { title: 'Total Supermarkets', value: supermarketsCount, icon: Store, iconBgClass: 'bg-sky', iconTextClass: 'text-sky' },
        { title: 'Total Penalties', value: 7, icon: Gavel, iconBgClass: 'bg-amber', iconTextClass: 'text-amber' },
        { title: 'Total Staff', value: 13, icon: Users, iconBgClass: 'bg-green', iconTextClass: 'text-green' },
    ];
    return (
        <section className="dashboard-overview">
            <CommonTopBar title="Dashboard Overview" />
            <div className="stats-grid">{stats.map((stat, index) => (<StatCard key={index} {...stat} />))}</div>
            <div className="charts-grid"><PenaltiesStatusChart /><ProductsDistributionChart /></div>
        </section>
    );
};