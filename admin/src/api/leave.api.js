import { apiClient } from "./auth.api";

export const getAllLeaves = async () => {
  const { data } = await apiClient.get("/leave/all");
  return data;
};

export const updateLeaveStatus = async (id, statusData) => {
  const { data } = await apiClient.patch(`/leave/${id}/status`, statusData);
  return data;
};
