import { api } from "./axios";

export const applyLeave = async (leaveData) => {
  return await api.post("/leave/apply", leaveData);
};

export const getMyLeaves = async () => {
  return await api.get("/leave/my-leaves");
};
