import { apiClient } from "./apiClient";

export const applyLeave = async (leaveData) => {
  const { data } = await apiClient.post("/leave/apply", leaveData);
  return data;
};

export const getMyLeaves = async () => {
  const { data } = await apiClient.get("/leave/my-leaves");
  return data;
};
