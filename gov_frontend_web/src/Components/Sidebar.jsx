import React from 'react';
import { LayoutDashboard, Gavel, ShoppingBasket, Store, Users } from 'lucide-react';
import '../Components/Sidebar.css'; 
import Governmentlogo from '../images/Governmentlogo.png';

const Logo = () => (
  <div className="sidebar-logo-container">

    <img src={Governmentlogo} alt="VIGL Government System Logo" className="sidebar-logo-image" />
    <p className="sidebar-logo-header-text">Government System</p>

  </div>
);

const SidebarLink = ({ icon: Icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`sidebar-link ${active ? 'active' : ''}`}
    aria-current={active ? 'page' : undefined}
  >
    <Icon size={20} className="sidebar-link-icon" />
    {text}
  </button>
);

const Sidebar = ({ activePage, setActivePage }) => {
  const navItems = [
    { id: 'dashboard', text: 'Dashboard', icon: LayoutDashboard },
    { id: 'penalties', text: 'Penalties', icon: Gavel },
    { id: 'products', text: 'Products', icon: ShoppingBasket },
    { id: 'supermarkets', text: 'Supermarkets', icon: Store },
    { id: 'staff', text: 'Staff', icon: Users },
  ];

  return (
    <aside className="sidebar">
      <Logo />
      <nav className="sidebar-nav" aria-label="Main navigation"> 
        {navItems.map((item) => (
          <SidebarLink
            key={item.id}
            icon={item.icon}
            text={item.text}
            active={activePage === item.id}
            onClick={() => setActivePage(item.id)}
          />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;