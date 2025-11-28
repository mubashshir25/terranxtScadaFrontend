import api from "./api";
import {
  DashboardOverview,
  PowerSeriesPoint,
  DailyEnergyPoint,
} from "../types/api";

export const dashboardService = {
  getOverview: async (
    plantId: number,
    hours: number = 6
  ): Promise<DashboardOverview> => {
    const response = await api.get("/dashboard/overview", {
      params: { plant_id: plantId, hours },
    });
    return response.data;
  },

  getRealtimePower: async (
    plantId: number,
    hours: number = 6
  ): Promise<{ plant_id: number; series: PowerSeriesPoint[] }> => {
    const response = await api.get("/dashboard/realtime-power", {
      params: { plant_id: plantId, hours },
    });
    return response.data;
  },

  getDailyEnergy: async (
    plantId: number,
    days: number = 7
  ): Promise<{ plant_id: number; days: number; data: DailyEnergyPoint[] }> => {
    const response = await api.get("/dashboard/daily-energy", {
      params: { plant_id: plantId, days },
    });
    return response.data;
  },
};

