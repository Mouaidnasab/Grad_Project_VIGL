import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
} from 'recharts';
import { Boxes, Store, Gavel, Users } from 'lucide-react';
import { CommonTopBar } from './CommonComponents';
import api from '../Api'; // adjust if your path differs

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
  const [penalties, setPenalties] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchPenalties = async () => {
      try {
        const res = await api.get("/penalty/get");
        setPenalties(res.data || []);
      } catch (err) {
        console.error("Failed to fetch penalties", err);
      }
    };
    fetchPenalties();
  }, []);

  useEffect(() => {
    const counts = penalties.reduce((acc, p) => {
      const status = p.Status?.toLowerCase() || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const result = Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
    setData(result);
  }, [penalties]);

  const COLORS = ['#1E3A8A', '#FACC15', '#10B981', '#EF4444', '#6366F1'];

  return (
    <div className="chart-card">
      <h3 className="chart-title">Penalties Status</h3>
      <div className="chart-container-wrapper">
        {data.length === 0 ? (
          <p>No penalties found.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label value="Status" position="center" fontSize="16px" fontWeight="bold" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="chart-legend">
        {data.map((item, index) => {
          const total = data.reduce((sum, entry) => sum + entry.value, 0);
          const percent = ((item.value / total) * 100).toFixed(0);
          return (
            <div key={item.name} className="chart-legend-item">
              <span
                className="chart-legend-color-box"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></span>
              <span>{item.name}: {item.value} ({percent}%)</span>
            </div>
          );
        })}
      </div>
      <button className="view-more-button">View more</button>
    </div>
  );
};

const ProductsDistributionChart = () => {
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/product/get");
        const rawProducts = res.data || [];

        const categoryCounts = {};
        rawProducts.forEach(item => {
          const category = item.Category?.CategoryName || "Unknown";
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const COLORS = ['#FACC15', '#3B82F6', '#10B981', '#EF4444', '#6366F1', '#A855F7'];
        const formattedData = Object.entries(categoryCounts).map(([name, value], index) => ({
          name,
          value,
          fill: COLORS[index % COLORS.length],
        }));

        setCategoryData(formattedData);
      } catch (err) {
        console.error("Failed to fetch product distribution:", err);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="chart-card">
      <h3 className="chart-title">Products Distribution</h3>
      <div className="chart-container-wrapper-flex-grow">
        {categoryData.length === 0 ? (
          <p>No data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(200,200,200,0.2)' }} />
              <Bar dataKey="value" barSize={60} radius={[8, 8, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="chart-legend">
        {categoryData.map(item => (
          <div key={item.name} className="chart-legend-item">
            <span
              className="chart-legend-color-box"
              style={{ backgroundColor: item.fill }}
            ></span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      <button className="view-more-button">View more</button>
    </div>
  );
}

export default function DashboardOverview({ supermarketsCount }) {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPenalties, setTotalPenalties] = useState(0);

  useEffect(() => {
    // Fetch total products count
    async function fetchProducts() {
      try {
        const res = await api.get('/product/get');
        const products = res.data || [];
        setTotalProducts(products.length);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    }

    // Fetch total penalties count
    async function fetchPenalties() {
      try {
        const res = await api.get('/penalty/get');
        const penalties = res.data || [];
        setTotalPenalties(penalties.length);
      } catch (error) {
        console.error('Failed to fetch penalties:', error);
      }
    }

    fetchProducts();
    fetchPenalties();
  }, []);

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: Boxes,
      iconBgClass: 'bg-red',
      iconTextClass: 'text-red',
    },
    {
      title: 'Total Supermarkets',
      value: supermarketsCount,
      icon: Store,
      iconBgClass: 'bg-sky',
      iconTextClass: 'text-sky',
    },
    {
      title: 'Total Penalties',
      value: totalPenalties,
      icon: Gavel,
      iconBgClass: 'bg-amber',
      iconTextClass: 'text-amber',
    },
    {
      title: 'Total Staff',
      value: 13,
      icon: Users,
      iconBgClass: 'bg-green',
      iconTextClass: 'text-green',
    },
  ];

  return (
    <section className="dashboard-overview">
      <CommonTopBar title="Dashboard Overview" />
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      <div className="charts-grid">
        <PenaltiesStatusChart />
        <ProductsDistributionChart />
      </div>
    </section>
  );
}

