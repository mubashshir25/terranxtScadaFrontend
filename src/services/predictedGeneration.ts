import api from "./api";
import {
  GenerationForecast,
  GenerationForecastCreate,
} from "../types/api";

export const predictedGenerationService = {
  list: async (plantId?: number): Promise<GenerationForecast[]> => {
    const params: Record<string, any> = {};
    if (plantId !== undefined) params.plant_id = plantId;

    const response = await api.get("/predicted-generation", { params });
    return response.data;
  },

  get: async (forecastId: number): Promise<GenerationForecast> => {
    const response = await api.get(`/predicted-generation/${forecastId}`);
    return response.data;
  },

  create: async (
    forecast: GenerationForecastCreate
  ): Promise<GenerationForecast> => {
    const response = await api.post("/predicted-generation", forecast);
    return response.data;
  },
};

