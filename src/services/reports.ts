import api from "./api";
import { ReportJob, ReportJobCreate } from "../types/api";

export const reportsService = {
  list: async (plantId?: number): Promise<ReportJob[]> => {
    const params: Record<string, any> = {};
    if (plantId !== undefined) params.plant_id = plantId;

    const response = await api.get("/reports", { params });
    return response.data;
  },

  get: async (jobId: number): Promise<ReportJob> => {
    const response = await api.get(`/reports/${jobId}`);
    return response.data;
  },

  create: async (job: ReportJobCreate): Promise<ReportJob> => {
    const response = await api.post("/reports", job);
    return response.data;
  },

  markComplete: async (
    jobId: number,
    artifactUrl: string
  ): Promise<ReportJob> => {
    const response = await api.post(`/reports/${jobId}/complete`, null, {
      params: { artifact_url: artifactUrl },
    });
    return response.data;
  },
};

