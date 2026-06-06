import { api } from "./axios";

export const submitDailyReport = async (formData) => {
  return api.post("/reports", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
