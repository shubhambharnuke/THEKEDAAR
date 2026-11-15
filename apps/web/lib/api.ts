import { getToken } from "./auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: any, data?: any) {
    let strMsg = "API request failed";
    if (typeof message === "string") {
      strMsg = message;
    } else if (Array.isArray(message)) {
      strMsg = message
        .map((m: any) => {
          if (typeof m === "string") return m;
          const loc = Array.isArray(m?.loc) ? m.loc.filter((x: any) => x !== "body").join(".") : "";
          const msg = m?.msg || m?.message || JSON.stringify(m);
          return loc ? `${loc}: ${msg}` : msg;
        })
        .join("; ");
    } else if (message && typeof message === "object") {
      strMsg = message.msg || message.message || message.detail || JSON.stringify(message);
    }
    super(strMsg);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, ...rest } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const token = typeof window !== "undefined" ? getToken() : null;
  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (token) {
    mergedHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: mergedHeaders,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `API request failed with status ${response.status}`;
      throw new ApiError(response.status, errorMsg, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, err?.message || "Network request failed");
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

// Domain endpoints
export const thekedarApi = {
  // Authentication
  getProfile: () => api.get<any>("/api/v1/auth/me"),

  // Resources & Departments
  getDepartments: () => api.get<any[]>("/api/v1/departments"),
  getResources: (params?: { department_id?: number; capacity?: number; type?: string }) =>
    api.get<any[]>("/api/v1/resources", { params }),
  getResource: (id: number) => api.get<any>(`/api/v1/resources/${id}`),
  checkAvailability: (id: number, startTime: string, endTime: string) =>
    api.get<any>(`/api/v1/resources/${id}/availability`, {
      params: { start_time: startTime, end_time: endTime },
    }),

  // Events & Bookings
  getEvents: () => api.get<any[]>("/api/v1/events"),
  getEvent: (id: number) => api.get<any>(`/api/v1/events/${id}`),
  createEvent: (payload: {
    title: string;
    description?: string;
    expected_attendance: number;
    requested_resources?: Array<{
      resource_id: number;
      start_time: string;
      end_time: string;
    }>;
    resource_bookings?: Array<{
      resource_id: number;
      start_time: string;
      end_time: string;
    }>;
  }) => {
    const list = payload.requested_resources || payload.resource_bookings || [];
    const body = {
      title: payload.title,
      description: payload.description,
      expected_attendance: payload.expected_attendance,
      requested_resources: list,
    };
    return api.post<any>("/api/v1/events", body);
  },
  cancelEvent: (id: number) => api.post<any>(`/api/v1/events/${id}/cancel`, {}),
  deleteEvent: (id: number) => api.delete<void>(`/api/v1/events/${id}`),
  resubmitRequest: (
    requestId: number,
    payload: {
      resource_bookings: Array<{
        resource_id: number;
        start_time: string;
        end_time: string;
      }>;
      remarks?: string;
    }
  ) => api.post<any>(`/api/v1/department-requests/${requestId}/resubmit`, payload),

  // Authority Queues & Decisions
  getPendingDepartmentRequests: () => api.get<any[]>("/api/v1/approvals/pending"),
  getDepartmentRequest: (id: number) => api.get<any>(`/api/v1/approvals/requests/${id}`),
  getAuthorityDecisions: () => api.get<any[]>("/api/v1/approvals/decisions"),
  submitDecision: (
    requestId: number,
    action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION",
    remarks?: string
  ) =>
    api.post<any>(`/api/v1/approvals/requests/${requestId}/decision`, {
      action,
      remarks,
    }),

  // Document Verification
  verifyDocumentHash: (hash: string) =>
    api.get<any>(`/api/v1/blockchain/verify/${hash}`),
  getBlockchainStatus: () => api.get<any>("/api/v1/blockchain/status"),

  // Audit Logs
  getAuditLogs: (params?: { entity?: string; action?: string; limit?: number }) =>
    api.get<any[]>("/api/v1/audit/logs", { params }),
};
