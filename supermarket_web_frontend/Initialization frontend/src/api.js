import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; 

const api = axios.create({
  baseURL: BACKEND_URL,
});

let isRefreshing = false;

let failedQueue = [];

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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const isLoginPage = window.location.pathname === '/login'; 

    if (!error.response) {
      console.error('Network error or server is down:', error);

      if (!isLoginPage) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);



api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('access_token');

      if (!refreshToken) {
        window.location.href = '/login'; 
        return Promise.reject(error);
      }

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
        const validateResponse = await axios.post(`${BACKEND_URL}/user_auth/validate-token`, {
          token: accessToken,
        });

        if (validateResponse.data.valid) {
        
          return api(originalRequest);
        }
      } catch (validationError) {
        console.warn('Token validation failed:', validationError);
      }

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
