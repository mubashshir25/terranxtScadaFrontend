import api from "./api";
import { ShadowRun, ShadowRunCreate } from "../types/api";

export const shadowAnalysisService = {
  list: async (plantId?: number): Promise<ShadowRun[]> => {
    const params: Record<string, any> = {};
    if (plantId !== undefined) params.plant_id = plantId;

    const response = await api.get("/shadow-analysis", { params });
    return response.data;
  },

  create: async (run: ShadowRunCreate): Promise<ShadowRun> => {
    const response = await api.post("/shadow-analysis", run);
    return response.data;
  },

  markComplete: async (
    runId: number,
    resultSummary: Record<string, any>,
    assetUrl?: string
  ): Promise<ShadowRun> => {
    const params: Record<string, any> = { result_summary: resultSummary };
    if (assetUrl) params.asset_url = assetUrl;

    const response = await api.post(`/shadow-analysis/${runId}/complete`, null, {
      params,
    });
    return response.data;
  },
};

