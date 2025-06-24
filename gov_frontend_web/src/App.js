import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GovDashboard from "../src/pages/Dashboard";
import Login from "../src/pages/Login";

function App() {
  const accessToken = localStorage.getItem("access_token");

  if (!accessToken && window.location.pathname !== "/Login") {
    window.location.replace("/Login");
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<GovDashboard />} />
        <Route path="/Login" element={<Login />} />
        <Route path="*" element={<GovDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
