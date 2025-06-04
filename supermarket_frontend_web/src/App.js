import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ViglDashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Manageproducts from "./pages/ManageProducts";
import ManageSS from "./pages/ManageSS";
import Settings from "./pages/Settings";
import AddStaff from "./pages/AddStaff";
import About from "./pages/About";
import Penalties from "./pages/Penalties";
import ScreenTemplate from "./pages/ScreenTemplate";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ViglDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/manage-products" element={<Manageproducts />} />
        <Route path="/manage-shelves-screens" element={<ManageSS />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/Add-Staff" element={<AddStaff />} />
        <Route path="/About" element={<About />} />
        <Route path="/penalties" element={<Penalties />} />
        <Route path="screen-template" element={<ScreenTemplate />} />
        <Route path="*" element={<ViglDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
