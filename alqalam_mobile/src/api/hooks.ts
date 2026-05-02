// ═══════════════════════════════════════════════════════════════
//  AL Qalam EMS — React Query Hooks (Real API, no mock data)
//  All hooks auto-retry on failure and show offline state.
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  StudentsAPI, FeeAPI, AttendanceAPI, ResultsAPI,
  TimetableAPI, NotifAPI, ReportsAPI, LeaveAPI, api,
} from './index';
import { useAuthStore } from '../store/auth';

// ── Query Key Factory ──────────────────────────────────────────
export const QK = {
  // Admin
  dashboard:        ['dashboard']              as const,
  students:         (p?: any) => ['students', p] as const,
  student:          (id: any) => ['student', id] as const,
  staff:            ['staff']                  as const,

  // Fee
  challans:         (p?: any) => ['challans', p] as const,
  arrears:          ['arrears']                as const,
  feeStudent:       (id: any) => ['fee-student', id] as const,
  closingReport:    (m: string) => ['closing', m] as const,

  // Attendance
  attToday:         (cls?: string) => ['att-today', cls] as const,
  attStudent:       (id: any, mo?: string) => ['att-student', id, mo] as const,
  attStaffToday:    ['att-staff-today']        as const,

  // Examination
  exams:            (cls?: string) => ['exams', cls] as const,
  studentResults:   (id: any) => ['results', id] as const,
  myResults:        ['my-results']             as const,

  // Timetable
  myTimetable:      ['my-timetable']           as const,
  classTimetable:   (cls: string) => ['class-timetable', cls] as const,

  // Notifications
  notifications:    ['notifications']          as const,

  // Parent
  myChildren:       ['my-children']            as const,
  childFee:         (id: any) => ['child-fee', id] as const,
  childAttendance:  (id: any) => ['child-att', id] as const,

  // Reports
  monthlyReport:    (m: string) => ['monthly-report', m] as const,
};

// ════════════════════════════════════════════════════════════════
//  ADMIN HOOKS
// ════════════════════════════════════════════════════════════════

export function useAdminDashboard() {
  return useQuery({
    queryKey: QK.dashboard,
    queryFn:  async () => {
      const res = await api({ method: 'GET', url: '/reports/dashboard' });
      return res.data?.data ?? res.data;
    },
    staleTime: 2 * 60 * 1000,  // 2 min
  });
}

export function useStudents(params?: { page?: number; search?: string; class_id?: string }) {
  return useQuery({
    queryKey: QK.students(params),
    queryFn:  () => StudentsAPI.getAll(params).then((r: any) => r?.data ?? r),
    staleTime: 3 * 60 * 1000,
    placeholderData: (prev: any) => prev,
  });
}

export function useStudent(id: string | number) {
  return useQuery({
    queryKey: QK.student(id),
    queryFn:  () => StudentsAPI.getById(id).then((r: any) => r?.data ?? r),
    enabled:  !!id,
  });
}

export function useStaff() {
  return useQuery({
    queryKey: QK.staff,
    queryFn:  async () => {
      const res = await api({ method: 'GET', url: '/staff' });
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ════════════════════════════════════════════════════════════════
//  FEE HOOKS
// ════════════════════════════════════════════════════════════════

export function useChallans(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: QK.challans(params),
    queryFn:  () => FeeAPI.getChallans(params).then((r: any) => r?.data ?? r),
    staleTime: 1 * 60 * 1000,
    placeholderData: (prev: any) => prev,
  });
}

export function useArrears() {
  return useQuery({
    queryKey: QK.arrears,
    queryFn:  () => FeeAPI.getArrears().then((r: any) => r?.data ?? r),
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudentFee(studentId: string | number) {
  return useQuery({
    queryKey: QK.feeStudent(studentId),
    queryFn:  () => FeeAPI.getStudentFee(studentId).then((r: any) => r?.data ?? r),
    enabled:  !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyFee() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: QK.feeStudent(user?.id),
    queryFn:  () => FeeAPI.getStudentFee(user!.id).then((r: any) => r?.data ?? r),
    enabled:  !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCollectFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: FeeAPI.collectFee,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['challans'] });
      qc.invalidateQueries({ queryKey: ['arrears']  });
    },
  });
}

export function useClosingReport(month: string) {
  return useQuery({
    queryKey: QK.closingReport(month),
    queryFn:  () => FeeAPI.getClosingReport(month).then((r: any) => r?.data ?? r),
    enabled:  !!month,
    staleTime: 10 * 60 * 1000,
  });
}

// ════════════════════════════════════════════════════════════════
//  ATTENDANCE HOOKS
// ════════════════════════════════════════════════════════════════

export function useAttendanceToday(classId?: string) {
  return useQuery({
    queryKey: QK.attToday(classId),
    queryFn:  () => AttendanceAPI.getToday(classId).then((r: any) => r?.data ?? r),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,  // refresh every 5 min
  });
}

export function useStudentAttendance(studentId: string | number, month?: string) {
  return useQuery({
    queryKey: QK.attStudent(studentId, month),
    queryFn:  () => AttendanceAPI.getStudentHistory(studentId, month).then((r: any) => r?.data ?? r),
    enabled:  !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyAttendance(month?: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: QK.attStudent(user?.id, month),
    queryFn:  () => AttendanceAPI.getStudentHistory(user!.id, month).then((r: any) => r?.data ?? r),
    enabled:  !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStaffAttendanceToday() {
  return useQuery({
    queryKey: QK.attStaffToday,
    queryFn:  () => AttendanceAPI.getStaffToday().then((r: any) => r?.data ?? r),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, date, records }: {
      classId: string; date: string;
      records: Array<{ student_id: number; status: string; remarks?: string }>;
    }) => AttendanceAPI.markBulk(classId, date, records),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['att-today'] });
    },
  });
}

// ════════════════════════════════════════════════════════════════
//  EXAMINATION / RESULTS HOOKS
// ════════════════════════════════════════════════════════════════

export function useExams(classId?: string) {
  return useQuery({
    queryKey: QK.exams(classId),
    queryFn:  () => ResultsAPI.getExams(classId).then((r: any) => r?.data ?? r),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStudentResults(studentId: string | number) {
  return useQuery({
    queryKey: QK.studentResults(studentId),
    queryFn:  () => ResultsAPI.getStudentResults(studentId).then((r: any) => r?.data ?? r),
    enabled:  !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyResults() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: QK.myResults,
    queryFn:  async () => {
      const res = await api({ method: 'GET', url: '/examination/results/mine' });
      return res.data?.data ?? res.data;
    },
    enabled:  !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEnterResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ResultsAPI.enterResult,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['results'] });
    },
  });
}

// ════════════════════════════════════════════════════════════════
//  TIMETABLE HOOKS
// ════════════════════════════════════════════════════════════════

export function useMyTimetable() {
  return useQuery({
    queryKey: QK.myTimetable,
    queryFn:  () => TimetableAPI.getMyTimetable().then((r: any) => r?.data ?? r),
    staleTime: 30 * 60 * 1000,  // timetable changes rarely
  });
}

export function useClassTimetable(classId: string) {
  return useQuery({
    queryKey: QK.classTimetable(classId),
    queryFn:  () => TimetableAPI.getClassTimetable(classId).then((r: any) => r?.data ?? r),
    enabled:  !!classId,
    staleTime: 30 * 60 * 1000,
  });
}

// ════════════════════════════════════════════════════════════════
//  NOTIFICATIONS HOOK
// ════════════════════════════════════════════════════════════════

export function useServerNotifications() {
  return useQuery({
    queryKey: QK.notifications,
    queryFn:  () => NotifAPI.getAll().then((r: any) => r?.data ?? r),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: NotifAPI.markAllRead,
    onSuccess:  () => qc.invalidateQueries({ queryKey: QK.notifications }),
  });
}

// ════════════════════════════════════════════════════════════════
//  PARENT HOOKS
// ════════════════════════════════════════════════════════════════

export function useMyChildren() {
  return useQuery({
    queryKey: QK.myChildren,
    queryFn:  async () => {
      const res = await api({ method: 'GET', url: '/students/my-children' });
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useChildFee(studentId: string | number) {
  return useQuery({
    queryKey: QK.childFee(studentId),
    queryFn:  () => FeeAPI.getStudentFee(studentId).then((r: any) => r?.data ?? r),
    enabled:  !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useChildAttendance(studentId: string | number, month?: string) {
  return useQuery({
    queryKey: QK.childAttendance(studentId),
    queryFn:  () => AttendanceAPI.getStudentHistory(studentId, month).then((r: any) => r?.data ?? r),
    enabled:  !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

// ════════════════════════════════════════════════════════════════
//  LEAVE HOOKS
// ════════════════════════════════════════════════════════════════

export function useMyLeaves() {
  return useQuery({
    queryKey: ['my-leaves'],
    queryFn:  () => LeaveAPI.getMyLeaves().then((r: any) => r?.data ?? r),
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: LeaveAPI.apply,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['my-leaves'] }),
  });
}

// ════════════════════════════════════════════════════════════════
//  REPORTS HOOKS
// ════════════════════════════════════════════════════════════════

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: QK.monthlyReport(month),
    queryFn:  () => ReportsAPI.getMonthlyFee(month).then((r: any) => r?.data ?? r),
    enabled:  !!month,
    staleTime: 10 * 60 * 1000,
  });
}

// ════════════════════════════════════════════════════════════════
//  PROFILE HOOK (any role)
// ════════════════════════════════════════════════════════════════

export function useMyProfile() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn:  async () => {
      const res = await api({ method: 'GET', url: '/auth/me' });
      return res.data?.data ?? res.data;
    },
    enabled:  !!user?.id,
    staleTime: 10 * 60 * 1000,
  });
}
