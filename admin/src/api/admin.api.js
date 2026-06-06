import api from "./auth.api";

export const getAdminMetrics = async () => {
  return api.get("/admin/metrics");
};

export const getAdminUsers = async (params) => {
  return api.get("/admin/users", { params });
};

export const deleteAdminUser = async (id) => {
  return api.delete(`/admin/users/${id}`);
};
