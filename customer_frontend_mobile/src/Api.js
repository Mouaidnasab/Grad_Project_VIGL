import axios from "axios";

const GOVERNMENT_IP =
  process.env.REACT_APP_GOV_BACKEND_URL || "http://192.168.0.102:8001";

export default axios.create({
  baseURL: GOVERNMENT_IP,
  headers: { "Content-Type": "application/json" },
});
