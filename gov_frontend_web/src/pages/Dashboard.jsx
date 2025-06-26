import React, { useState } from "react";
import Sidebar from "../Components/Sidebar";
import DashboardOverview from "../Components/DashboardOverview";
import SupermarketsTab from "../Components/SupermarketsTab";
import StaffTab from "../Components/StaffTab";
import ProductsTab from "../Components/ProductsTab";
import PenaltiesTab from "../Components/PenaltiesTab";
import { AddSupermarketModal } from "../Components/CommonComponents";
import "../css/Dashboard.css";

const initialMockSupermarketsData = [];

export default function DashboardPage() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isAddSupermarketModalOpen, setIsAddSupermarketModalOpen] =
    useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardOverview />;
      case "supermarkets":
        return <SupermarketsTab />;
      case "staff":
        return <StaffTab />;
      case "products":
        return <ProductsTab />;
      case "penalties":
        return <PenaltiesTab />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content2">{renderActivePage()}</main>
    </div>
  );
}
