import { api } from "./axios";

export const applyLeave = async (leaveData) => {
  const { data } = await api.post("/leave/apply", leaveData);
  return data;
};

export const getMyLeaves = async () => {
  const { data } = await api.get("/leave/my-leaves");
  return data;
};
