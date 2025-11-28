import api from "./api";
import {
  DeviceSnapshot,
  PaginatedResponse,
  DeviceMetricsHistory,
} from "../types/api";

export const monitoringService = {
  listDevices: async (
    plantId?: number,
    deviceType?: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<PaginatedResponse<DeviceSnapshot>> => {
    const params: Record<string, any> = { skip, limit };
    if (plantId !== undefined) params.plant_id = plantId;
    if (deviceType) params.device_type = deviceType;

    const response = await api.get("/monitoring/devices", { params });
    return response.data;
  },

  getDeviceMetrics: async (
    deviceType: string,
    deviceId: number,
    hours: number = 6
  ): Promise<DeviceMetricsHistory> => {
    const response = await api.get(
      `/monitoring/metrics/${deviceType}/${deviceId}`,
      {
        params: { hours },
      }
    );
    return response.data;
  },
};

