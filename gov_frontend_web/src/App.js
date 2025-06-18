import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GovDashboard from '../src/pages/Dashboard';
import Login from '../src/pages/Login';





function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GovDashboard />} />
        <Route path="/Login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;