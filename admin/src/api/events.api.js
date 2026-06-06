import api from "./auth.api";

export const getEvents = async () => {
  return api.get("/events");
};

export const createEvent = async (data) => {
  return api.post("/events", data);
};

export const updateEvent = async (id, data) => {
  return api.put(`/events/${id}`, data);
};

export const deleteEvent = async (id) => {
  return api.delete(`/events/${id}`);
};
