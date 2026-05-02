// ═══════════════════════════════════════════════════════
//  AL Qalam EMS — API Service Layer
//  Connects to both PHP (main) and Node.js (real-time)
// ═══════════════════════════════════════════════════════

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { io, Socket } from 'socket.io-client';

// ── Config ─────────────────────────────────────────────
export const API_URLS = {
  // PHP Backend (cPanel) — main CRUD
  php:  'https://alqalam.edu.pk/ems/alqalam_backend.php',
  // Node.js Backend (AWS EC2) — real-time
  node: 'https://api.alqalam.edu.pk',
};

// Change these to your actual URLs after deployment
const BASE_URL = API_URLS.php;

// ── Token Storage ───────────────────────────────────────
const TOKEN_KEY = 'aq_jwt_token';
const USER_KEY  = 'aq_user_data';

export const TokenStorage = {
  async save(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async get(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },
  async remove() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
  async saveUser(user: any) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async getUser(): Promise<any | null> {
    const s = await SecureStore.getItemAsync(USER_KEY);
    return s ? JSON.parse(s) : null;
  },
};

// ── Axios Instance ──────────────────────────────────────
const createAPI = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 12000,
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Type': 'mobile',
      'X-App-Version': '1.0.0',
    },
  });

  // Request interceptor — add JWT
  instance.interceptors.request.use(async (config) => {
    const token = await TokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor — handle errors
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await TokenStorage.remove();
        // AuthStore will detect null token and redirect to login
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const api = createAPI();

// ── Helper ──────────────────────────────────────────────
async function req<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api(config);
  return res.data;
}

// ═══════════════════════════════════════════════════════
//  AUTH API
// ═══════════════════════════════════════════════════════
export const AuthAPI = {
  async login(username: string, password: string) {
    return req<{ success: boolean; data: { token: string; user: any } }>({
      method: 'POST', url: '/auth/login',
      data: { username, password },
    });
  },
  async logout() {
    return req({ method: 'POST', url: '/auth/logout' });
  },
  async changePassword(currentPassword: string, newPassword: string) {
    return req({ method: 'POST', url: '/auth/change-password',
      data: { current_password: currentPassword, new_password: newPassword },
    });
  },
};

// ═══════════════════════════════════════════════════════
//  STUDENTS API
// ═══════════════════════════════════════════════════════
export const StudentsAPI = {
  async getAll(params?: { page?: number; search?: string; class_id?: string }) {
    return req<any>({ method: 'GET', url: '/students', params });
  },
  async getById(id: string | number) {
    return req<any>({ method: 'GET', url: `/students/${id}` });
  },
  async getFeeStatus(id: string | number) {
    return req<any>({ method: 'GET', url: `/students/${id}/fee-status` });
  },
};

// ═══════════════════════════════════════════════════════
//  FEE API
// ═══════════════════════════════════════════════════════
export const FeeAPI = {
  async getChallans(params?: { status?: string; page?: number }) {
    return req<any>({ method: 'GET', url: '/fee/challans', params });
  },
  async collectFee(data: {
    student_id: string | number;
    amount_paid: number;
    payment_method: string;
    bank_name?: string;
    transaction_ref?: string;
  }) {
    return req<any>({ method: 'POST', url: '/fee/collect', data });
  },
  async getArrears() {
    return req<any>({ method: 'GET', url: '/fee/arrears' });
  },
  async getClosingReport(month: string) {
    return req<any>({ method: 'GET', url: '/fee/closing', params: { month } });
  },
  async getStudentFee(studentId: string | number) {
    return req<any>({ method: 'GET', url: `/fee/student/${studentId}` });
  },
};

// ═══════════════════════════════════════════════════════
//  ATTENDANCE API
// ═══════════════════════════════════════════════════════
export const AttendanceAPI = {
  async getToday(classId?: string) {
    return req<any>({ method: 'GET', url: '/attendance/today',
      params: classId ? { class_id: classId } : undefined,
    });
  },
  async markBulk(classId: string, date: string, records: Array<{ student_id: number; status: string; remarks?: string }>) {
    return req<any>({ method: 'POST', url: '/attendance/bulk',
      data: { class_id: classId, date, records },
    });
  },
  async getStudentHistory(studentId: string | number, month?: string) {
    return req<any>({ method: 'GET', url: `/attendance/student/${studentId}`,
      params: month ? { month } : undefined,
    });
  },
  async staffCheckin() {
    return req<any>({ method: 'POST', url: '/staff/checkin', data: {} });
  },
  async staffCheckout() {
    return req<any>({ method: 'POST', url: '/staff/checkout', data: {} });
  },
  async getStaffToday() {
    return req<any>({ method: 'GET', url: '/staff/attendance/today' });
  },
};

// ═══════════════════════════════════════════════════════
//  RESULTS API
// ═══════════════════════════════════════════════════════
export const ResultsAPI = {
  async getStudentResults(studentId: string | number) {
    return req<any>({ method: 'GET', url: `/examination/results/student/${studentId}` });
  },
  async enterResult(data: {
    student_id: number;
    exam_id: number;
    subject_id: number;
    marks_obtained: number;
    total_marks: number;
    remarks?: string;
  }) {
    return req<any>({ method: 'POST', url: '/examination/results', data });
  },
  async getExams(classId?: string) {
    return req<any>({ method: 'GET', url: '/examination/exams',
      params: classId ? { class_id: classId } : undefined,
    });
  },
};

// ═══════════════════════════════════════════════════════
//  TIMETABLE API
// ═══════════════════════════════════════════════════════
export const TimetableAPI = {
  async getMyTimetable() {
    return req<any>({ method: 'GET', url: '/timetable/mine' });
  },
  async getClassTimetable(classId: string) {
    return req<any>({ method: 'GET', url: `/timetable/class/${classId}` });
  },
};

// ═══════════════════════════════════════════════════════
//  NOTIFICATIONS API
// ═══════════════════════════════════════════════════════
export const NotifAPI = {
  async getAll(unreadOnly = false) {
    return req<any>({ method: 'GET', url: '/notifications',
      params: unreadOnly ? { unread: '1' } : undefined,
    });
  },
  async markRead(id: number) {
    return req<any>({ method: 'PUT', url: `/notifications/${id}/read` });
  },
  async markAllRead() {
    return req<any>({ method: 'PUT', url: '/notifications/read-all' });
  },
};

// ═══════════════════════════════════════════════════════
//  REPORTS API
// ═══════════════════════════════════════════════════════
export const ReportsAPI = {
  async getMonthlyFee(month: string) {
    return req<any>({ method: 'GET', url: '/reports/monthly-fee', params: { month } });
  },
  async getAttendanceSummary(year?: number) {
    return req<any>({ method: 'GET', url: '/reports/attendance-summary',
      params: year ? { year } : undefined,
    });
  },
};

// ═══════════════════════════════════════════════════════
//  LEAVE API
// ═══════════════════════════════════════════════════════
export const LeaveAPI = {
  async apply(data: { type: string; from_date: string; to_date: string; reason: string }) {
    return req<any>({ method: 'POST', url: '/leave/apply', data });
  },
  async getMyLeaves() {
    return req<any>({ method: 'GET', url: '/leave/mine' });
  },
  async approve(leaveId: number) {
    return req<any>({ method: 'PUT', url: `/leave/${leaveId}/approve` });
  },
};

// ═══════════════════════════════════════════════════════
//  SOCKET.IO — Real-time (Node.js backend)
// ═══════════════════════════════════════════════════════
let _socket: Socket | null = null;

export const SocketService = {
  async connect() {
    const token = await TokenStorage.get();
    if (!token || _socket?.connected) return;

    _socket = io(API_URLS.node, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    _socket.on('connect', () => {
      console.log('🔌 Socket.io connected');
    });
    _socket.on('connect_error', (err) => {
      console.warn('Socket.io error:', err.message);
    });

    return _socket;
  },
  disconnect() {
    _socket?.disconnect();
    _socket = null;
  },
  on(event: string, callback: (...args: any[]) => void) {
    _socket?.on(event, callback);
  },
  off(event: string) {
    _socket?.off(event);
  },
  emit(event: string, data: any) {
    _socket?.emit(event, data);
  },
  get isConnected() {
    return _socket?.connected ?? false;
  },
};
