import api from "./api";
import {
  DigitalTwin,
  DigitalTwinCreate,
  DigitalTwinUpdate,
  ThreeJSScriptResponse,
} from "../types/api";

export const digitalTwinsService = {
  list: async (
    plantId?: number,
    skip: number = 0,
    limit: number = 100
  ): Promise<DigitalTwin[]> => {
    const params: Record<string, any> = { skip, limit };
    if (plantId !== undefined) params.plant_id = plantId;

    const response = await api.get("/digital-twins", { params });
    return response.data;
  },

  get: async (twinId: number): Promise<DigitalTwin> => {
    const response = await api.get(`/digital-twins/${twinId}`);
    return response.data;
  },

  create: async (twin: DigitalTwinCreate): Promise<DigitalTwin> => {
    const response = await api.post("/digital-twins", twin);
    return response.data;
  },

  update: async (
    twinId: number,
    update: DigitalTwinUpdate
  ): Promise<DigitalTwin> => {
    const response = await api.put(`/digital-twins/${twinId}`, update);
    return response.data;
  },

  delete: async (twinId: number): Promise<void> => {
    await api.delete(`/digital-twins/${twinId}`);
  },

  getThreeJSScript: async (twinId: number): Promise<ThreeJSScriptResponse> => {
    const response = await api.get(`/digital-twins/${twinId}/threejs`);
    return response.data;
  },

  getByPlant: async (plantId: number): Promise<DigitalTwin[]> => {
    const response = await api.get(`/digital-twins/plants/${plantId}/digital-twins`);
    return response.data;
  },
};

