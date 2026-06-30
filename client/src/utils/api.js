export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://air-invoice-pro-jd9l.vercel.app";

const backendPath = (path) =>
  path.startsWith("/auth") ? path.replace("/auth", "/api/auth") : path;

export const apiUrl = (path) => `${API_BASE_URL}${backendPath(path)}`;

export const authHeaders = (headers = {}) => {
  const token = localStorage.getItem("token");
  return {
    ...(token && token !== "cookie-authenticated" ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
};

export const authFetch = (path, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = authHeaders({
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  });

  return fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers,
  });
};

export const saveAuthData = (data) => {
  const token = data.token || "cookie-authenticated";

  if (token) {
    localStorage.setItem("token", token);
  }

  if (data.user) {
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: data.user._id || data.user.id,
        name: data.user.name || data.user.username,
        username: data.user.username,
        email: data.user.email,
        picture: data.user.picture,
        authProvider: data.user.authProvider,
        role: data.user.role,
      })
    );
  }

  const userId = data.userId || data.user?._id || data.user?.id;
  if (userId) {
    localStorage.setItem("userId", userId);
  }
};

export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  sessionStorage.clear();
};
