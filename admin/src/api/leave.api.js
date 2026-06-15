import api from "./auth.api";

export const getAllLeaves = async () => {
  // api interceptor doesn't unwrap payload here! Wait!
  const res = await api.get("/leave/all");
  return res.data;
};

export const updateLeaveStatus = async (id, statusData) => {
  const res = await api.patch(`/leave/${id}/status`, statusData);
  return res.data;
};
