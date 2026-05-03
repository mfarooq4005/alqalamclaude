export const API_CONTRACT_VERSION = "v1";

export const CoreEndpoints = {
  auth: {
    login: "/auth/login",
    me: "/auth/me",
  },
  students: {
    list: "/students",
    create: "/students",
    update: "/students/:id",
  },
  staff: {
    list: "/staff",
    create: "/staff",
    update: "/staff/:id",
  },
  attendance: {
    today: "/attendance/today",
    bulkMark: "/attendance/bulk",
  },
  fee: {
    challans: "/fee/challans",
    generateChallans: "/fee/challans/generate",
    collect: "/fee/collect",
    arrears: "/fee/arrears",
    studentHistory: "/fee/student/:studentId",
  },
} as const;
