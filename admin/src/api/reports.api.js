import api from "./auth.api";

export const getDailyReports = async () => {
  return api.get("/reports");
};
