import { api } from "./axios";

const withPrefix = (url = "") => {
  const u = String(url || "");

  // absolute URL -> as-is
  if (/^https?:\/\//i.test(u)) return u;

  // already prefixed
  if (u.startsWith("/educator")) return u;

  // normalize
  if (!u.startsWith("/")) return `/educator/${u}`;
  return `/educator${u}`;
};

const educatorApi = {
  get: (url, config) => api.get(withPrefix(url), config),
  post: (url, data, config) => api.post(withPrefix(url), data, config),
  patch: (url, data, config) => api.patch(withPrefix(url), data, config),
  put: (url, data, config) => api.put(withPrefix(url), data, config),
  delete: (url, config) => api.delete(withPrefix(url), config),
};

export default educatorApi;
export { educatorApi };
