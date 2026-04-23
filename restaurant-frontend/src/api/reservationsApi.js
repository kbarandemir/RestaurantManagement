import { api } from "./client";

export const getReservations = async () => {
  const { data } = await api.get("/api/Reservations");
  return data;
};

export const createReservation = async (reservationData) => {
  const { data } = await api.post("/api/Reservations", reservationData);
  return data;
};

export const updateReservation = async (id, reservationData) => {
  const { data } = await api.put(`/api/Reservations/${id}`, reservationData);
  return data;
};

export const deleteReservation = async (id) => {
  const { data } = await api.delete(`/api/Reservations/${id}`);
  return data;
};
