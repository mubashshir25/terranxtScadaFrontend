import api from "./api";
import { Device } from "../types/api";

export type DeviceGroup = "inverters" | "wms" | "string-monitoring" | "abt-meters";

export const devicesService = {
  list: async (group: DeviceGroup): Promise<Device[]> => {
    const response = await api.get(`/devices/${group}`);
    return response.data;
  },

  get: async (group: DeviceGroup, deviceId: number): Promise<Device> => {
    const response = await api.get(`/devices/${group}/${deviceId}`);
    return response.data;
  },

  create: async (group: DeviceGroup, device: Partial<Device>): Promise<Device> => {
    const response = await api.post(`/devices/${group}`, device);
    return response.data;
  },

  update: async (
    group: DeviceGroup,
    deviceId: number,
    update: Partial<Device>
  ): Promise<Device> => {
    const response = await api.put(`/devices/${group}/${deviceId}`, update);
    return response.data;
  },

  delete: async (group: DeviceGroup, deviceId: number): Promise<void> => {
    await api.delete(`/devices/${group}/${deviceId}`);
  },
};

