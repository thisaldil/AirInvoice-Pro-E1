export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://air-invoice-pro-jd9l.vercel.app";

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export const authFetch = (path, options = {}) => {
  const token = localStorage.getItem("token");

  return fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
};

export const saveAuthData = (data) => {
  if (data.token) {
    localStorage.setItem("token", data.token);
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
