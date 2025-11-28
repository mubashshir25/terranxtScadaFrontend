import api from "./api";
import { Plant, PlantCreate, PlantUpdate } from "../types/api";

export const plantsService = {
  list: async (): Promise<Plant[]> => {
    const response = await api.get("/plants");
    return response.data;
  },

  get: async (plantId: number): Promise<Plant> => {
    const response = await api.get(`/plants/${plantId}`);
    return response.data;
  },

  create: async (plant: PlantCreate): Promise<Plant> => {
    const response = await api.post("/plants", plant);
    return response.data;
  },

  update: async (plantId: number, update: PlantUpdate): Promise<Plant> => {
    const response = await api.put(`/plants/${plantId}`, update);
    return response.data;
  },

  delete: async (plantId: number): Promise<void> => {
    await api.delete(`/plants/${plantId}`);
  },
};

