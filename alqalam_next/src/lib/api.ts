export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type APIResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, cache: "no-store" });
  const data = (await res.json()) as APIResponse<T>;
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Request failed: ${path}`);
  }
  if (data.data === undefined) {
    throw new Error(`Empty data for ${path}`);
  }
  return data.data;
}

export type LoginPayload = {
  token: string;
  user: {
    id: number;
    full_name: string;
    username: string;
    role: string;
    branch_id?: number;
  };
};

export async function login(username: string, password: string) {
  return request<LoginPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function me(token: string) {
  return request<any>("/auth/me", {}, token);
}

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
  return res.json();
}

export async function getStudents(token: string, params?: URLSearchParams) {
  const q = params ? `?${params.toString()}` : "";
  return request<any>(`/students${q}`, {}, token);
}

export async function createStudent(token: string, body: any) {
  return request<any>("/students", { method: "POST", body: JSON.stringify(body) }, token);
}

export async function getStaff(token: string, params?: URLSearchParams) {
  const q = params ? `?${params.toString()}` : "";
  return request<any>(`/staff${q}`, {}, token);
}

export async function createStaff(token: string, body: any) {
  return request<any>("/staff", { method: "POST", body: JSON.stringify(body) }, token);
}

export async function updateStaff(token: string, id: number, body: any) {
  return request<any>(`/staff/${id}`, { method: "PUT", body: JSON.stringify(body) }, token);
}

export async function getAttendanceToday(token: string, class_id?: string) {
  return request<any>(`/attendance/today${class_id ? `?class_id=${class_id}` : ""}`, {}, token);
}

export async function markAttendance(token: string, body: any) {
  return request<any>("/attendance/bulk", { method: "POST", body: JSON.stringify(body) }, token);
}

export async function getChallans(token: string, params?: URLSearchParams) {
  const q = params ? `?${params.toString()}` : "";
  return request<any>(`/fee/challans${q}`, {}, token);
}

export async function generateChallans(token: string, body: any) {
  return request<any>("/fee/challans/generate", { method: "POST", body: JSON.stringify(body) }, token);
}

export async function collectFee(token: string, body: any) {
  return request<any>("/fee/collect", { method: "POST", body: JSON.stringify(body) }, token);
}

export async function getArrears(token: string) {
  return request<any>("/fee/arrears", {}, token);
}
