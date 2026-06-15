import api from "./auth.api";

export const getAllLeaves = async () => {
  const { data } = await api.get("/leave/all");
  return data;
};

export const updateLeaveStatus = async (id, statusData) => {
  const { data } = await api.patch(`/leave/${id}/status`, statusData);
  return data;
};
