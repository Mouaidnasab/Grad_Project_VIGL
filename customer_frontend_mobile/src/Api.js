// src/Api.js
import axios from "axios";

const GOV = (
  process.env.REACT_APP_GOV_BACKEND_URL || "https://gov_back.vigl.store"
).replace(/\/+$/, ""); // strip all trailing slashes

const api = axios.create({
  baseURL: GOV, // e.g. "https://gov_back.vigl.store"
  headers: { "Content-Type": "application/json" },
});

// this interceptor lives on YOUR instance, not on the global axios
api.interceptors.request.use((config) => {
  if (config.url && !config.url.endsWith("/")) {
    config.url = `${config.url}/`;
  }
  return config;
});

export default api;
