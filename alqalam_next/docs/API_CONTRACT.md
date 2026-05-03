# API Contract (Frontend <-> Node Backend)

Base URL is environment-driven:
- `NEXT_PUBLIC_API_BASE_URL`

## Auth
- `POST /auth/login`
- `GET /auth/me`

## Core modules
- Students: `GET /students`, `POST /students`, `PUT /students/:id`
- Staff: `GET /staff`, `POST /staff`, `PUT /staff/:id`
- Attendance: `GET /attendance/today`, `POST /attendance/bulk`

## Fee modules
- `GET /fee/challans`
- `POST /fee/challans/generate`
- `POST /fee/collect`
- `GET /fee/arrears`
- `GET /fee/student/:studentId`

## Class and sections
- `GET /classes`, `POST /classes`, `PUT /classes/:id`
- `GET /sections`, `POST /sections`

## Deployment notes
- Frontend and backend deploy separately.
- Backend must enable CORS for frontend origin.
- Keep `GET /health` and include app version in response for release checks.
