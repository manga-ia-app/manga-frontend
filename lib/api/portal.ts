import axios from "axios";
import type { PortalProposal } from "@/lib/types";

const portalClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getPortalProposal(accessToken: string): Promise<PortalProposal> {
  const response = await portalClient.get<PortalProposal>(`/portal/proposal/${accessToken}`);
  return response.data;
}

export async function approveProposal(accessToken: string): Promise<{ approved: boolean }> {
  const response = await portalClient.post<{ approved: boolean }>(`/portal/proposal/${accessToken}/approve`);
  return response.data;
}

export async function rejectProposal(accessToken: string, reason?: string): Promise<{ rejected: boolean }> {
  const response = await portalClient.post<{ rejected: boolean }>(`/portal/proposal/${accessToken}/reject`, { reason });
  return response.data;
}

export async function addPortalComment(
  accessToken: string,
  data: { content: string; authorName: string; authorEmail?: string }
): Promise<{ id: string }> {
  const response = await portalClient.post<{ id: string }>(`/portal/proposal/${accessToken}/comment`, data);
  return response.data;
}

export function getPortalPdfDownloadUrl(accessToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
  return `${baseUrl}/portal/proposal/${accessToken}/download-pdf`;
}
