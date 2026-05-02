# AL Qalam International — Enterprise System Blueprint
## Role-Based Access, Architecture & Developer Guide

---

## 1. SYSTEM OVERVIEW

AL Qalam Enterprise Management System is a full-stack school ERP covering:
- **Public Website** (multi-page, STREAM Robotics theme)
- **Academic Management** (students, teachers, classes, results, timetable)
- **Accounts** (fee collection, salary, scholarships)
- **Inventory & Stock** (item issuance, teacher wallets, consumable tracking)
- **CMS** (admin controls all website content)
- **4 Portals** (Admin, Teacher, Student, Parent)
- **Multi-Branch Support**

---

## 2. RECOMMENDED TECH STACK

| Layer       | Recommended Technology        | Why                                 |
|-------------|-------------------------------|-------------------------------------|
| Frontend    | Next.js 14 (React)            | SEO-friendly, fast, component-based |
| Backend API | Node.js + Express OR Laravel  | REST API, mature ecosystem          |
| Database    | MySQL 8.0 (MariaDB)           | Relational, reliable, widely hosted |
| Auth        | JWT + bcrypt                  | Secure stateless authentication     |
| File Store  | AWS S3 or local storage       | Media, reports, documents           |
| Email/SMS   | Nodemailer + Twilio            | Notifications, OTP                  |
| Deployment  | VPS (DigitalOcean/Hostinger)  | Full control, affordable            |
| Short-term  | XAMPP + PHP + MySQL           | Local testing, quick deploy         |

**For immediate deployment** — Use XAMPP + PHP + MySQL. The HTML file runs directly in browser.

---

## 3. ROLE-BASED ACCESS CONTROL (RBAC)

### 3.1 Roles & Hierarchy

```
super_admin
    └── admin
         ├── principal
         │    └── vice_principal
         ├── accountant
         ├── store_keeper
         ├── librarian
         ├── teacher
         │    ├── student (view own data)
         │    └── parent  (view child data)
```

### 3.2 Permissions Matrix

| Feature / Module              | super_admin | admin | principal | teacher | student | parent | accountant | store_keeper |
|-------------------------------|:-----------:|:-----:|:---------:|:-------:|:-------:|:------:|:----------:|:------------:|
| **WEBSITE CMS**               |             |       |           |         |         |        |            |              |
| Edit website content          | ✅          | ✅    | ❌        | ❌      | ❌      | ❌     | ❌         | ❌           |
| Publish notices               | ✅          | ✅    | ✅        | ❌      | ❌      | ❌     | ❌         | ❌           |
| Upload gallery images         | ✅          | ✅    | ✅        | ❌      | ❌      | ❌     | ❌         | ❌           |
| **USERS**                     |             |       |           |         |         |        |            |              |
| Create users                  | ✅          | ✅    | ❌        | ❌      | ❌      | ❌     | ❌         | ❌           |
| View all users                | ✅          | ✅    | ✅        | ❌      | ❌      | ❌     | ❌         | ❌           |
| Edit own profile              | ✅          | ✅    | ✅        | ✅      | ✅      | ✅     | ✅         | ✅           |
| **ACADEMIC**                  |             |       |           |         |         |        |            |              |
| Mark attendance               | ✅          | ✅    | ✅        | ✅      | ❌      | ❌     | ❌         | ❌           |
| Enter results                 | ✅          | ✅    | ✅        | ✅      | ❌      | ❌     | ❌         | ❌           |
| View own results              | ❌          | ❌    | ❌        | ❌      | ✅      | ✅     | ❌         | ❌           |
| Create lesson plans           | ✅          | ✅    | ✅        | ✅      | ❌      | ❌     | ❌         | ❌           |
| Approve lesson plans          | ✅          | ✅    | ✅        | ❌      | ❌      | ❌     | ❌         | ❌           |
| **ACCOUNTS**                  |             |       |           |         |         |        |            |              |
| Collect fee                   | ✅          | ✅    | ❌        | ❌      | ❌      | ❌     | ✅         | ❌           |
| View fee records              | ✅          | ✅    | ✅        | ❌      | ✅      | ✅     | ✅         | ❌           |
| Process salary                | ✅          | ✅    | ❌        | ❌      | ❌      | ❌     | ✅         | ❌           |
| Generate financial reports    | ✅          | ✅    | ✅        | ❌      | ❌      | ❌     | ✅         | ❌           |
| **INVENTORY**                 |             |       |           |         |         |        |            |              |
| Add stock (stock-in)          | ✅          | ✅    | ❌        | ❌      | ❌      | ❌     | ❌         | ✅           |
| Issue items (stock-out)       | ✅          | ✅    | ❌        | ❌      | ❌      | ❌     | ❌         | ✅           |
| Request items                 | ✅          | ✅    | ✅        | ✅      | ❌      | ❌     | ✅         | ❌           |
| Approve item requests         | ✅          | ✅    | ✅        | ❌      | ❌      | ❌     | ❌         | ❌           |
| View own wallet/item log      | ✅          | ✅    | ✅        | ✅      | ❌      | ❌     | ✅         | ✅           |
| View all inventory            | ✅          | ✅    | ✅        | ❌      | ❌      | ❌     | ✅         | ✅           |
| **ADMISSIONS**                |             |       |           |         |         |        |            |              |
| Process admissions            | ✅          | ✅    | ✅        | ❌      | ❌      | ❌     | ❌         | ❌           |
| View admission applications   | ✅          | ✅    | ✅        | ❌      | ❌      | ❌     | ❌         | ❌           |

---

## 4. ITEM ISSUANCE WORKFLOW (Detailed)

```
Teacher/Staff
    │
    ▼
[Creates Item Request]
    │ → Notification sent to admin/principal
    ▼
Admin/Principal
    │
    ├── [APPROVE] → Notification to Store Keeper
    │                    │
    │                    ▼
    │              Store Keeper
    │                    │
    │                    ├── [ISSUE ITEM] → Physical item given
    │                    │       │
    │                    │       ▼
    │                    │  Teacher receives notification:
    │                    │  "1 Glue Gun issued. Tap to confirm."
    │                    │       │
    │                    │       ▼
    │                    │  Teacher [APPROVES receipt]
    │                    │       │
    │                    │       ▼
    │                    │  Item logged in Teacher's Wallet
    │                    │  Stock decremented automatically
    │                    │
    │                    └── [NON-CONSUMABLE] → Return date set
    │                                │
    │                                ▼
    │                        Return Reminder sent on due date
    │                        Teacher returns → Wallet updated
    │
    └── [REJECT] → Notification to teacher with reason
```

### Item Types:
- **Consumable**: Tape, pencil, soap, surf → tracked for usage, replenished
- **Non-Consumable**: Glue gun, scissors, lab equipment → returned, tracked in wallet

---

## 5. TEACHER PLANNING MODULE

Teachers can create plans at 3 levels:

| Level   | Fields                                      | Approved By    |
|---------|---------------------------------------------|----------------|
| Weekly  | Week No, Topic, Activities, Homework        | Vice Principal |
| Monthly | Month, Chapters, Assessment plan            | Principal      |
| Yearly  | Full syllabus map, annual targets           | Principal      |

**Flow**: Draft → Submitted → Approved / Revision Required → Completed

---

## 6. STUDENT RESULT SYSTEM

### Grade Boundaries:
| Percentage | Grade | Remark        |
|-----------|-------|---------------|
| 90–100    | A+    | Outstanding   |
| 80–89     | A     | Excellent      |
| 70–79     | B+    | Very Good      |
| 60–69     | B     | Good           |
| 50–59     | C     | Satisfactory   |
| 33–49     | D     | Pass           |
| 0–32      | F     | Fail           |

### Result Calculation Weight:
- Weekly Tests: 10%
- Monthly Exams: 20%
- Mid-Term: 30%
- Annual Exam: 40%

---

## 7. FEE MANAGEMENT FLOW

```
Fee Structure Setup (Admin/Accountant)
    │
    ▼
Monthly Invoices Auto-Generated (1st of each month)
    │
    ▼
Parent notified via SMS/Email (3 days before due)
    │
    ▼
Parent pays at counter or online
    │
    ▼
Accountant marks payment → Receipt generated
    │
    ├── [PAID on time] → Status: Paid, Receipt sent
    └── [LATE] → Late fee added daily after due date
                  Status: Overdue → final notice → escalate to Principal
```

---

## 8. DEMO USER CREDENTIALS

| Role         | Username       | Password         | Access Level              |
|--------------|----------------|------------------|---------------------------|
| Super Admin  | `superadmin`   | `AqSuper@2024`   | Everything                |
| Admin        | `admin`        | `AqAdmin@2024`   | Full management           |
| Principal    | `principal`    | `AqPrincipal@24` | Academic + reports        |
| Teacher      | `teacher01`    | `AqTeach@2024`   | Class + results + plans   |
| Teacher 2    | `teacher02`    | `AqTeach2@2024`  | Class + results + plans   |
| Student      | `AQ-2024-1045` | `Student@123`    | Own data only             |
| Parent       | `parent001`    | `Parent@2024`    | Child data + fee          |
| Accountant   | `accountant1`  | `AqAcct@2024`    | Fee + salary only         |
| Store Keeper | `storekeeper1` | `AqStore@2024`   | Inventory only            |

> **Security Note**: Change all passwords immediately after first login. Passwords in DB must be stored as bcrypt hashes (cost factor 12+).

---

## 9. API ENDPOINTS REFERENCE (REST)

### Authentication
```
POST /api/auth/login          → { username, password } → JWT token
POST /api/auth/logout         → Invalidate session
POST /api/auth/refresh        → Refresh JWT token
POST /api/auth/change-password
```

### Students
```
GET    /api/students                    → List (admin/principal)
POST   /api/students                    → Create new student
GET    /api/students/:id                → Student profile
PUT    /api/students/:id                → Update
GET    /api/students/:id/results        → All results
GET    /api/students/:id/attendance     → Attendance summary
GET    /api/students/:id/fee            → Fee status
```

### Teachers
```
GET    /api/teachers                    → List
POST   /api/teachers                    → Add teacher
GET    /api/teachers/:id/plans          → Lesson plans
POST   /api/teachers/:id/plans          → Create plan
GET    /api/teachers/:id/attendance     → Attendance
GET    /api/teachers/:id/wallet         → Item wallet
```

### Results
```
GET    /api/results?student_id=&exam_id=  → Get results
POST   /api/results                       → Enter result (teacher)
PUT    /api/results/:id                   → Update result
GET    /api/results/report-card/:student_id/:exam_id  → Full report
```

### Inventory
```
GET    /api/inventory/items              → Item list
POST   /api/inventory/items              → Add item
GET    /api/inventory/items/low-stock    → Low stock alert
POST   /api/inventory/requests           → Request item
GET    /api/inventory/requests           → All requests
PUT    /api/inventory/requests/:id/approve  → Approve
PUT    /api/inventory/requests/:id/issue    → Issue
PUT    /api/inventory/requests/:id/return   → Return
GET    /api/inventory/wallet/:user_id    → Teacher wallet
```

### Fee
```
GET    /api/fee/structures               → Fee slabs
POST   /api/fee/payment                  → Record payment
GET    /api/fee/student/:id              → Student fee history
GET    /api/fee/overdue                  → Overdue list
POST   /api/fee/receipt/:payment_id      → Generate receipt
```

### CMS / Website
```
GET    /api/cms/pages                    → All pages
PUT    /api/cms/sections/:id             → Update section content
POST   /api/cms/media                    → Upload image
DELETE /api/cms/media/:id                → Delete image
GET    /api/cms/notices                  → Published notices
POST   /api/cms/notices                  → Create notice
GET    /api/cms/news                     → News & events
POST   /api/cms/news                     → Create news
```

### Notifications
```
GET    /api/notifications                → User notifications
PUT    /api/notifications/:id/read       → Mark read
PUT    /api/notifications/read-all       → Mark all read
```

---

## 10. FOLDER STRUCTURE (Recommended)

```
alqalam-system/
├── public/                  ← Website HTML files (multi-page)
│   ├── index.html           ← Main website
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── portals/
│       ├── admin/           ← Admin dashboard
│       ├── teacher/         ← Teacher portal
│       ├── student/         ← Student portal
│       └── parent/          ← Parent portal
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── students.js
│   │   ├── teachers.js
│   │   ├── results.js
│   │   ├── inventory.js
│   │   ├── fee.js
│   │   └── cms.js
│   ├── middleware/
│   │   ├── auth.js          ← JWT verification
│   │   └── rbac.js          ← Role checking
│   ├── models/
│   ├── controllers/
│   └── server.js
├── database/
│   ├── alqalam_database.sql ← Main schema (this file)
│   └── seed_data.sql        ← Sample data
└── docs/
    └── alqalam_system_blueprint.md  ← This file
```

---

## 11. SECURITY CHECKLIST

- [ ] All passwords hashed with bcrypt (cost ≥ 12)
- [ ] JWT secret key rotated every 90 days
- [ ] HTTPS enforced on all routes
- [ ] SQL prepared statements used (no raw queries)
- [ ] File upload validation (type, size, extension)
- [ ] Rate limiting on login endpoint (max 5 attempts)
- [ ] Session expiry after 8 hours
- [ ] Admin IP whitelist (optional)
- [ ] Audit logs enabled for all destructive actions
- [ ] Regular DB backups (daily automated)

---

## 12. DEPLOYMENT STEPS (Quick Start — XAMPP)

```bash
# Step 1: Install XAMPP (Apache + MySQL + PHP)
# Download from: https://www.apachefriends.org

# Step 2: Start Apache and MySQL from XAMPP control panel

# Step 3: Open phpMyAdmin → http://localhost/phpmyadmin

# Step 4: Create database
CREATE DATABASE alqalam_db;

# Step 5: Import schema
# phpMyAdmin → Select alqalam_db → Import → Choose alqalam_database.sql

# Step 6: Open website
# Copy alqalam_website.html to C:/xampp/htdocs/
# Visit: http://localhost/alqalam_website.html

# Step 7: Change demo passwords
# Update password_hash column in users table with bcrypt hashes
```

---

## 13. BUSINESS FAIR MODULE WORKFLOW

```
Admin creates Business Fair event
    │
    ▼
Students form teams (3-5 per stall)
    │
    ▼
Teams submit Business Plan (2 months before)
    │
    ▼
Teacher reviews & approves plan
    │
    ▼
Seed budget allocated (Rs. 500–2000 per team)
    │
    ▼
Fair Day: Stalls open, customers buy products
    │
    ▼
Revenue recorded per stall
    │
    ▼
Results: Best Stall, Most Revenue, Most Creative awards
    │
    ▼
System archives event for historical records
```

---

## 14. TABLES QUICK REFERENCE

| # | Table                    | Purpose                          |
|---|--------------------------|----------------------------------|
| 1 | branches                 | Multi-campus support             |
| 2 | roles                    | 10 system roles defined          |
| 3 | users                    | All users (unified login)        |
| 4 | user_sessions            | Token management                 |
| 5 | academic_years           | Session: 2024-25, 2025-26        |
| 6 | classes                  | Grade 1 to Grade 12 + KG        |
| 7 | sections                 | A, B, C per class                |
| 8 | subjects                 | Subject list per class           |
| 9 | teachers                 | Teacher profiles                 |
|10 | teacher_subject_assignments | Teaching assignments          |
|11 | students                 | Student profiles & enrollment    |
|12 | parents                  | Parent details                   |
|13 | student_parent_link      | Who is whose parent              |
|14 | timetable                | Day-wise class schedule          |
|15 | student_attendance       | Daily student attendance         |
|16 | teacher_attendance       | Staff daily check-in             |
|17 | exam_types               | Weekly/Monthly/Annual            |
|18 | exams                    | Exam schedules                   |
|19 | results                  | Marks per subject per student    |
|20 | lesson_plans             | Weekly/Monthly/Yearly plans      |
|21 | homework                 | Assignments given                |
|22 | homework_submissions     | Student submissions              |
|23 | fee_structures           | Fee slabs by class               |
|24 | fee_payments             | All payment records              |
|25 | scholarships             | Discounts & waivers              |
|26 | salary_structures        | Staff salary setup               |
|27 | salary_payments          | Monthly payroll records          |
|28 | inventory_categories     | Item categories                  |
|29 | inventory_items          | All items (stationary, grocery)  |
|30 | stock_transactions       | Every stock movement             |
|31 | user_wallets             | Teacher item account             |
|32 | item_requests            | Issuance request + approval flow |
|33 | wallet_item_log          | Per-teacher item history         |
|34 | notifications            | Real-time alerts                 |
|35 | business_fairs           | Annual fair events               |
|36 | fair_stalls              | Student stall registrations      |
|37 | fair_stall_members       | Stall team roster                |
|38 | library_books            | Book catalog                     |
|39 | library_issues           | Book borrowing records           |
|40 | admissions               | New student applications         |
|41 | cms_pages                | Website page registry            |
|42 | cms_sections             | Editable content blocks          |
|43 | cms_media                | Images, files upload             |
|44 | notices                  | School notices & circulars       |
|45 | news_events              | News & events                    |
|46 | leave_types              | Leave categories                 |
|47 | leave_applications       | Staff & student leaves           |
|48 | complaints               | Feedback & complaints            |
|49 | system_settings          | Global configuration             |
|50 | audit_logs               | Full activity history            |

---

*AL Qalam International Enterprise System — Designed for 21st Century Education*
*Document Version: 1.0 | April 2025*
