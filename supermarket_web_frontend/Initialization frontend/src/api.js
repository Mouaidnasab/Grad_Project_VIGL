import axios from 'axios';

// Define your backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; // Ensure this is set in your .env file

// Create an Axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
});

// Flag to indicate if a token refresh is already in progress
let isRefreshing = false;

// Array to hold pending requests while token is being refreshed
let failedQueue = [];

// Function to process the queue after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to attach the access token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors and token refreshing
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('access_token');

      if (!refreshToken) {
        // No refresh token available, redirect to login
        window.location.href = '/login'; // Adjust the path as needed
        return Promise.reject(error);
      }

      // If a token refresh is already in progress, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Validate the access token before attempting refresh
        const validateResponse = await axios.post(`${BACKEND_URL}/user_auth/validate-token`, {
          token: accessToken,
        });

        if (validateResponse.data.valid) {
          // If the token is valid, resolve the original request without refreshing
        
          return api(originalRequest);
        }
      } catch (validationError) {
        console.warn('Token validation failed:', validationError);
      }

      // Refresh the token
      return new Promise((resolve, reject) => {
        axios
          .post(`${BACKEND_URL}/user_auth/refresh-token`, { refresh_token: refreshToken })
          .then(({ data }) => {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            api.defaults.headers['Authorization'] = `Bearer ${data.access_token}`;
            originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
            processQueue(null, data.access_token);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            // Redirect to login if token refresh fails
            window.location.href = '/login';
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
