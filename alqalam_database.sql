-- ============================================================
--  AL QALAM INTERNATIONAL — ENTERPRISE DATABASE SCHEMA
--  Database: MySQL 8.0+  |  Charset: utf8mb4
--  Covers: Users, Academics, Inventory, Accounts, CMS, Portals
-- ============================================================

CREATE DATABASE IF NOT EXISTS alqalam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alqalam_db;

-- ============================================================
-- SECTION 1: BRANCHES (Multi-Branch Support)
-- ============================================================
CREATE TABLE branches (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  code          VARCHAR(20)  NOT NULL UNIQUE,
  address       TEXT,
  city          VARCHAR(100),
  phone         VARCHAR(30),
  email         VARCHAR(150),
  principal_name VARCHAR(150),
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO branches (name, code, address, city, phone, email, principal_name)
VALUES ('AL Qalam Main Campus', 'AQ-MAIN', 'Block 14, Gulshan-e-Iqbal', 'Karachi', '+92-21-34000000', 'main@alqalam.edu.pk', 'Dr. Ahmed Raza');

-- ============================================================
-- SECTION 2: ROLES & PERMISSIONS
-- ============================================================
CREATE TABLE roles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,   -- admin, super_admin, principal, teacher, student, parent, store_keeper, accountant
  label       VARCHAR(100),
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, label, description) VALUES
('super_admin',  'Super Administrator', 'Full system access including branch management'),
('admin',        'Administrator',       'Full school management and CMS access'),
('principal',    'Principal',           'Academic oversight, reports, staff management'),
('vice_principal','Vice Principal',     'Academics, timetable, discipline'),
('teacher',      'Teacher',             'Class management, attendance, result entry'),
('student',      'Student',             'View results, homework, timetable'),
('parent',       'Parent',              'View child records, fee, attendance'),
('accountant',   'Accountant',          'Fee management, salary, accounts'),
('store_keeper', 'Store Keeper',        'Inventory management, item issuance'),
('librarian',    'Librarian',           'Library catalog and book management');

-- ============================================================
-- SECTION 3: USERS (Unified Auth Table)
-- ============================================================
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL DEFAULT 1,
  role_id       INT NOT NULL,
  username      VARCHAR(80)  NOT NULL UNIQUE,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(30),
  cnic          VARCHAR(20),
  address       TEXT,
  profile_photo VARCHAR(255),
  gender        ENUM('male','female','other'),
  dob           DATE,
  is_active     TINYINT(1) DEFAULT 1,
  last_login    TIMESTAMP NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (role_id)   REFERENCES roles(id)
);

-- Demo / Temp Users (passwords stored as bcrypt hashes — shown plain for reference)
-- Password: AqAdmin@2024
INSERT INTO users (branch_id, role_id, username, email, password_hash, full_name, gender) VALUES
(1, 1, 'superadmin',  'superadmin@alqalam.edu.pk',  '$2b$12$PLACEHOLDER_HASH_1', 'System Administrator', 'male'),
(1, 2, 'admin',       'admin@alqalam.edu.pk',        '$2b$12$PLACEHOLDER_HASH_2', 'Admin User',           'male'),
(1, 3, 'principal',   'principal@alqalam.edu.pk',    '$2b$12$PLACEHOLDER_HASH_3', 'Dr. Ahmed Raza',       'male'),
(1, 5, 'teacher01',   'teacher01@alqalam.edu.pk',    '$2b$12$PLACEHOLDER_HASH_4', 'Ms. Aisha Siddiqui',   'female'),
(1, 5, 'teacher02',   'teacher02@alqalam.edu.pk',    '$2b$12$PLACEHOLDER_HASH_5', 'Mr. Bilal Hashmi',     'male'),
(1, 6, 'student001',  'student001@alqalam.edu.pk',   '$2b$12$PLACEHOLDER_HASH_6', 'Muhammad Ali Khan',    'male'),
(1, 7, 'parent001',   'parent001@alqalam.edu.pk',    '$2b$12$PLACEHOLDER_HASH_7', 'Mr. Imran Khan',       'male'),
(1, 8, 'accountant1', 'accounts@alqalam.edu.pk',     '$2b$12$PLACEHOLDER_HASH_8', 'Mr. Faisal Ahmed',     'male'),
(1, 9, 'storekeeper1','store@alqalam.edu.pk',        '$2b$12$PLACEHOLDER_HASH_9', 'Mr. Rafiq Ali',        'male');

-- ============================================================
-- SECTION 4: USER SESSIONS
-- ============================================================
CREATE TABLE user_sessions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SECTION 5: ACADEMIC STRUCTURE
-- ============================================================
CREATE TABLE academic_years (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  branch_id  INT NOT NULL,
  label      VARCHAR(30) NOT NULL,   -- e.g. 2024-25
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_current TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
INSERT INTO academic_years (branch_id, label, start_date, end_date, is_current) VALUES
(1, '2024-25', '2024-04-01', '2025-03-31', 1);

CREATE TABLE classes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT NOT NULL,
  name        VARCHAR(50) NOT NULL,   -- Grade 1, Grade 9, KG-1
  level       ENUM('pre_primary','primary','middle','secondary','higher_secondary','other') DEFAULT 'primary',
  display_order INT DEFAULT 0,
  is_active   TINYINT(1) DEFAULT 1,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
INSERT INTO classes (branch_id, name, level, display_order) VALUES
(1,'Montessori','pre_primary',1),(1,'KG-1','pre_primary',2),(1,'KG-2','pre_primary',3),
(1,'Grade 1','primary',4),(1,'Grade 2','primary',5),(1,'Grade 3','primary',6),
(1,'Grade 4','primary',7),(1,'Grade 5','primary',8),
(1,'Grade 6','middle',9),(1,'Grade 7','middle',10),(1,'Grade 8','middle',11),
(1,'Grade 9','secondary',12),(1,'Grade 10','secondary',13),
(1,'Grade 11','higher_secondary',14),(1,'Grade 12','higher_secondary',15);

CREATE TABLE sections (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  class_id  INT NOT NULL,
  name      VARCHAR(10) NOT NULL,  -- A, B, C
  capacity  INT DEFAULT 40,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE subjects (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(20),
  type        ENUM('core','elective','extra_curricular','islamiat','language') DEFAULT 'core',
  class_id    INT,
  total_marks INT DEFAULT 100,
  pass_marks  INT DEFAULT 33,
  is_active   TINYINT(1) DEFAULT 1,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (class_id)  REFERENCES classes(id)
);

-- ============================================================
-- SECTION 6: TEACHERS
-- ============================================================
CREATE TABLE teachers (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL UNIQUE,
  branch_id          INT NOT NULL,
  employee_id        VARCHAR(30) UNIQUE,
  qualification      VARCHAR(100),
  specialization     VARCHAR(100),
  experience_years   INT DEFAULT 0,
  joining_date       DATE,
  employment_type    ENUM('permanent','contractual','visiting') DEFAULT 'permanent',
  salary             DECIMAL(10,2),
  bank_account       VARCHAR(50),
  emergency_contact  VARCHAR(30),
  FOREIGN KEY (user_id)   REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
INSERT INTO teachers (user_id, branch_id, employee_id, qualification, specialization, joining_date, employment_type, salary)
VALUES
(4, 1, 'AQ-T-001', 'M.Ed', 'Mathematics & Science', '2020-04-01', 'permanent', 45000.00),
(5, 1, 'AQ-T-002', 'M.Sc Physics', 'Physics & Robotics', '2021-04-01', 'permanent', 48000.00);

CREATE TABLE teacher_subject_assignments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id   INT NOT NULL,
  subject_id   INT NOT NULL,
  section_id   INT NOT NULL,
  academic_year_id INT NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (section_id) REFERENCES sections(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- ============================================================
-- SECTION 7: STUDENTS
-- ============================================================
CREATE TABLE students (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL UNIQUE,
  branch_id         INT NOT NULL,
  roll_number       VARCHAR(30) UNIQUE,
  registration_no   VARCHAR(30) UNIQUE,
  class_id          INT NOT NULL,
  section_id        INT,
  academic_year_id  INT NOT NULL,
  admission_date    DATE,
  b_form_no         VARCHAR(20),
  blood_group       VARCHAR(5),
  religion          VARCHAR(30) DEFAULT 'Islam',
  transport_required TINYINT(1) DEFAULT 0,
  hostel_required   TINYINT(1) DEFAULT 0,
  prev_school       VARCHAR(150),
  prev_class        VARCHAR(50),
  status            ENUM('active','inactive','transferred','graduated') DEFAULT 'active',
  FOREIGN KEY (user_id)          REFERENCES users(id),
  FOREIGN KEY (branch_id)        REFERENCES branches(id),
  FOREIGN KEY (class_id)         REFERENCES classes(id),
  FOREIGN KEY (section_id)       REFERENCES sections(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
INSERT INTO students (user_id, branch_id, roll_number, registration_no, class_id, academic_year_id, admission_date, b_form_no, status)
VALUES (6, 1, 'AQ-2024-1045', 'AQ-REG-2024-001', 12, 1, '2024-04-01', '42201-1234567-1', 'active');

-- ============================================================
-- SECTION 8: PARENTS (linked to students)
-- ============================================================
CREATE TABLE parents (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  father_name     VARCHAR(150),
  mother_name     VARCHAR(150),
  father_cnic     VARCHAR(20),
  mother_cnic     VARCHAR(20),
  father_phone    VARCHAR(30),
  mother_phone    VARCHAR(30),
  father_occupation VARCHAR(100),
  occupation_org  VARCHAR(150),
  monthly_income  DECIMAL(10,2),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO parents (user_id, father_name, father_cnic, father_phone, father_occupation)
VALUES (7, 'Mr. Imran Khan', '42201-9876543-1', '+92-300-1234567', 'Business');

CREATE TABLE student_parent_link (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  parent_id   INT NOT NULL,
  relation    ENUM('father','mother','guardian') DEFAULT 'father',
  is_primary  TINYINT(1) DEFAULT 1,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id)  REFERENCES parents(id)
);

-- ============================================================
-- SECTION 9: TIMETABLE
-- ============================================================
CREATE TABLE timetable (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  section_id    INT NOT NULL,
  subject_id    INT NOT NULL,
  teacher_id    INT NOT NULL,
  academic_year_id INT NOT NULL,
  day_of_week   ENUM('monday','tuesday','wednesday','thursday','friday','saturday') NOT NULL,
  period_no     INT NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  room          VARCHAR(20),
  FOREIGN KEY (branch_id)       REFERENCES branches(id),
  FOREIGN KEY (section_id)      REFERENCES sections(id),
  FOREIGN KEY (subject_id)      REFERENCES subjects(id),
  FOREIGN KEY (teacher_id)      REFERENCES teachers(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- ============================================================
-- SECTION 10: ATTENDANCE
-- ============================================================
CREATE TABLE student_attendance (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  section_id   INT NOT NULL,
  date         DATE NOT NULL,
  status       ENUM('present','absent','late','leave','holiday') DEFAULT 'present',
  remarks      VARCHAR(255),
  marked_by    INT,  -- teacher user_id
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_att (student_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (section_id) REFERENCES sections(id),
  FOREIGN KEY (marked_by)  REFERENCES users(id)
);

CREATE TABLE teacher_attendance (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id  INT NOT NULL,
  date        DATE NOT NULL,
  status      ENUM('present','absent','late','leave','half_day') DEFAULT 'present',
  check_in    TIME,
  check_out   TIME,
  remarks     VARCHAR(255),
  UNIQUE KEY uniq_tatt (teacher_id, date),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- ============================================================
-- SECTION 11: EXAMS & RESULTS
-- ============================================================
CREATE TABLE exam_types (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT NOT NULL,
  name        VARCHAR(80) NOT NULL,  -- Weekly Test, Monthly Exam, Mid-Term, Annual
  frequency   ENUM('weekly','monthly','quarterly','bi_annual','annual','one_time') DEFAULT 'monthly',
  weight_pct  DECIMAL(5,2) DEFAULT 0, -- percentage weight in final result
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
INSERT INTO exam_types (branch_id, name, frequency, weight_pct) VALUES
(1,'Weekly Test','weekly',10.00),(1,'Monthly Exam','monthly',20.00),
(1,'Mid-Term','bi_annual',30.00),(1,'Annual Exam','annual',40.00);

CREATE TABLE exams (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  exam_type_id    INT NOT NULL,
  academic_year_id INT NOT NULL,
  class_id        INT NOT NULL,
  name            VARCHAR(100) NOT NULL,
  start_date      DATE,
  end_date        DATE,
  status          ENUM('upcoming','ongoing','completed','result_declared') DEFAULT 'upcoming',
  created_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)        REFERENCES branches(id),
  FOREIGN KEY (exam_type_id)     REFERENCES exam_types(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (class_id)         REFERENCES classes(id),
  FOREIGN KEY (created_by)       REFERENCES users(id)
);

CREATE TABLE results (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  exam_id         INT NOT NULL,
  student_id      INT NOT NULL,
  subject_id      INT NOT NULL,
  marks_obtained  DECIMAL(6,2) DEFAULT 0,
  total_marks     INT DEFAULT 100,
  grade           VARCHAR(5),
  is_absent       TINYINT(1) DEFAULT 0,
  remarks         VARCHAR(200),
  entered_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_result (exam_id, student_id, subject_id),
  FOREIGN KEY (exam_id)    REFERENCES exams(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (entered_by) REFERENCES users(id)
);

-- Grade calculation helper view
CREATE VIEW v_student_results AS
SELECT
  r.id, r.exam_id, r.student_id, r.subject_id,
  r.marks_obtained, r.total_marks,
  ROUND((r.marks_obtained/r.total_marks)*100,2) AS percentage,
  CASE
    WHEN (r.marks_obtained/r.total_marks)*100 >= 90 THEN 'A+'
    WHEN (r.marks_obtained/r.total_marks)*100 >= 80 THEN 'A'
    WHEN (r.marks_obtained/r.total_marks)*100 >= 70 THEN 'B+'
    WHEN (r.marks_obtained/r.total_marks)*100 >= 60 THEN 'B'
    WHEN (r.marks_obtained/r.total_marks)*100 >= 50 THEN 'C'
    WHEN (r.marks_obtained/r.total_marks)*100 >= 33 THEN 'D'
    ELSE 'F'
  END AS computed_grade,
  r.is_absent, s.full_name AS student_name,
  sub.name AS subject_name, e.name AS exam_name
FROM results r
JOIN students st ON r.student_id=st.id
JOIN users s ON st.user_id=s.id
JOIN subjects sub ON r.subject_id=sub.id
JOIN exams e ON r.exam_id=e.id;

-- ============================================================
-- SECTION 12: TEACHER PLANNING
-- ============================================================
CREATE TABLE lesson_plans (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id    INT NOT NULL,
  subject_id    INT NOT NULL,
  section_id    INT NOT NULL,
  academic_year_id INT NOT NULL,
  plan_type     ENUM('weekly','monthly','yearly') NOT NULL,
  week_number   INT,
  month_number  INT,
  year_number   INT,
  topic         VARCHAR(200) NOT NULL,
  objectives    TEXT,
  activities    TEXT,
  resources     TEXT,
  homework      TEXT,
  status        ENUM('draft','approved','completed') DEFAULT 'draft',
  approved_by   INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id)       REFERENCES teachers(id),
  FOREIGN KEY (subject_id)       REFERENCES subjects(id),
  FOREIGN KEY (section_id)       REFERENCES sections(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (approved_by)      REFERENCES users(id)
);

CREATE TABLE homework (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id  INT NOT NULL,
  subject_id  INT NOT NULL,
  section_id  INT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  due_date    DATE NOT NULL,
  total_marks INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (section_id) REFERENCES sections(id)
);

CREATE TABLE homework_submissions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  homework_id     INT NOT NULL,
  student_id      INT NOT NULL,
  submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  marks_obtained  INT,
  feedback        TEXT,
  status          ENUM('submitted','late','graded','missing') DEFAULT 'submitted',
  UNIQUE KEY uniq_hw (homework_id, student_id),
  FOREIGN KEY (homework_id) REFERENCES homework(id),
  FOREIGN KEY (student_id)  REFERENCES students(id)
);

-- ============================================================
-- SECTION 13: FEE MANAGEMENT (Accounts)
-- ============================================================
CREATE TABLE fee_structures (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  class_id        INT NOT NULL,
  academic_year_id INT NOT NULL,
  fee_type        ENUM('tuition','admission','registration','exam','transport','hostel','library','lab','uniform','other') DEFAULT 'tuition',
  amount          DECIMAL(10,2) NOT NULL,
  frequency       ENUM('one_time','monthly','quarterly','annual') DEFAULT 'monthly',
  due_day         INT DEFAULT 10,   -- day of month fee is due
  late_fee        DECIMAL(8,2) DEFAULT 0,
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)        REFERENCES branches(id),
  FOREIGN KEY (class_id)         REFERENCES classes(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE fee_payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  fee_structure_id INT NOT NULL,
  invoice_no      VARCHAR(30) UNIQUE,
  amount_due      DECIMAL(10,2) NOT NULL,
  amount_paid     DECIMAL(10,2) DEFAULT 0,
  late_fee_applied DECIMAL(8,2) DEFAULT 0,
  discount        DECIMAL(8,2) DEFAULT 0,
  payment_date    DATE,
  due_date        DATE,
  payment_method  ENUM('cash','cheque','bank_transfer','online') DEFAULT 'cash',
  receipt_no      VARCHAR(30),
  status          ENUM('pending','partial','paid','overdue','waived') DEFAULT 'pending',
  collected_by    INT,
  remarks         VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)       REFERENCES students(id),
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id),
  FOREIGN KEY (collected_by)     REFERENCES users(id)
);

CREATE TABLE scholarships (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  type        ENUM('merit','need_based','sibling','staff_ward','other'),
  discount_pct DECIMAL(5,2),
  discount_amt DECIMAL(10,2),
  valid_from  DATE,
  valid_until DATE,
  approved_by INT,
  notes       TEXT,
  FOREIGN KEY (student_id)  REFERENCES students(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ============================================================
-- SECTION 14: SALARY (Staff)
-- ============================================================
CREATE TABLE salary_structures (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  basic_salary    DECIMAL(10,2) NOT NULL,
  house_allowance DECIMAL(10,2) DEFAULT 0,
  transport_allow DECIMAL(10,2) DEFAULT 0,
  medical_allow   DECIMAL(10,2) DEFAULT 0,
  other_allow     DECIMAL(10,2) DEFAULT 0,
  income_tax      DECIMAL(10,2) DEFAULT 0,
  provident_fund  DECIMAL(10,2) DEFAULT 0,
  gross_salary    DECIMAL(10,2) GENERATED ALWAYS AS (basic_salary+house_allowance+transport_allow+medical_allow+other_allow) STORED,
  net_salary      DECIMAL(10,2) GENERATED ALWAYS AS (basic_salary+house_allowance+transport_allow+medical_allow+other_allow-income_tax-provident_fund) STORED,
  effective_from  DATE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE salary_payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  month           INT NOT NULL,
  year            INT NOT NULL,
  amount_paid     DECIMAL(10,2) NOT NULL,
  deductions      DECIMAL(10,2) DEFAULT 0,
  bonus           DECIMAL(10,2) DEFAULT 0,
  payment_date    DATE,
  payment_method  ENUM('cash','bank_transfer','cheque') DEFAULT 'bank_transfer',
  processed_by    INT,
  remarks         VARCHAR(255),
  UNIQUE KEY uniq_sal (user_id, month, year),
  FOREIGN KEY (user_id)      REFERENCES users(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- ============================================================
-- SECTION 15: INVENTORY & STOCK SYSTEM
-- ============================================================
CREATE TABLE inventory_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  type        ENUM('stationary','grocery','lab_equipment','sports','furniture','electronics','cleaning','other') DEFAULT 'stationary',
  description TEXT,
  is_active   TINYINT(1) DEFAULT 1,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
INSERT INTO inventory_categories (branch_id, name, type) VALUES
(1,'Stationary','stationary'),(1,'Grocery','grocery'),(1,'Cleaning Supplies','cleaning'),
(1,'Lab Equipment','lab_equipment'),(1,'Sports Equipment','sports'),
(1,'Electronics','electronics'),(1,'Furniture','furniture');

CREATE TABLE inventory_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  category_id     INT NOT NULL,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  sku             VARCHAR(50) UNIQUE,
  unit            VARCHAR(20) DEFAULT 'piece',  -- piece, packet, box, kg, litre
  item_type       ENUM('consumable','non_consumable') DEFAULT 'consumable',
  reorder_level   INT DEFAULT 5,
  current_stock   INT DEFAULT 0,
  unit_cost       DECIMAL(10,2) DEFAULT 0,
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)   REFERENCES branches(id),
  FOREIGN KEY (category_id) REFERENCES inventory_categories(id)
);
INSERT INTO inventory_items (branch_id, category_id, name, sku, unit, item_type, reorder_level, current_stock, unit_cost) VALUES
(1,1,'Pencil HB','SKU-001','piece','consumable',50,200,5.00),
(1,1,'Ball Point Pen Blue','SKU-002','piece','consumable',30,150,15.00),
(1,1,'Glue Gun','SKU-003','piece','non_consumable',2,10,250.00),
(1,1,'Glue Sticks (pack)','SKU-004','packet','consumable',10,40,80.00),
(1,1,'Scotch Tape','SKU-005','piece','consumable',20,60,40.00),
(1,1,'A4 Paper Ream','SKU-006','ream','consumable',5,30,600.00),
(1,1,'Marker Set','SKU-007','set','consumable',10,25,120.00),
(1,1,'Scissors','SKU-008','piece','non_consumable',5,20,80.00),
(1,2,'Soap Bar','SKU-009','piece','consumable',20,80,30.00),
(1,2,'Surf/Detergent (kg)','SKU-010','kg','consumable',5,15,180.00),
(1,3,'Cups (pack of 12)','SKU-011','pack','consumable',5,20,120.00),
(1,3,'Plates (pack of 6)','SKU-012','pack','consumable',3,12,150.00),
(1,3,'Mop & Bucket Set','SKU-013','set','non_consumable',2,5,450.00),
(1,4,'Arduino Starter Kit','SKU-014','piece','non_consumable',3,15,3500.00),
(1,4,'Raspberry Pi 4','SKU-015','piece','non_consumable',2,8,8500.00);

-- Stock Transactions (IN / OUT)
CREATE TABLE stock_transactions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  item_id         INT NOT NULL,
  transaction_type ENUM('stock_in','stock_out','adjustment','return') NOT NULL,
  quantity        INT NOT NULL,
  unit_cost       DECIMAL(10,2),
  total_cost      DECIMAL(12,2),
  reference_no    VARCHAR(50),
  supplier        VARCHAR(150),
  notes           TEXT,
  performed_by    INT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)   REFERENCES branches(id),
  FOREIGN KEY (item_id)     REFERENCES inventory_items(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Trigger to auto-update current_stock on transaction
DELIMITER $$
CREATE TRIGGER trg_stock_update AFTER INSERT ON stock_transactions FOR EACH ROW
BEGIN
  IF NEW.transaction_type = 'stock_in' OR NEW.transaction_type = 'return' THEN
    UPDATE inventory_items SET current_stock = current_stock + NEW.quantity WHERE id = NEW.item_id;
  ELSEIF NEW.transaction_type = 'stock_out' THEN
    UPDATE inventory_items SET current_stock = current_stock - NEW.quantity WHERE id = NEW.item_id;
  ELSEIF NEW.transaction_type = 'adjustment' THEN
    UPDATE inventory_items SET current_stock = NEW.quantity WHERE id = NEW.item_id;
  END IF;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 16: TEACHER WALLET & ITEM ISSUANCE SYSTEM
-- ============================================================
-- Every user (especially teachers) has a virtual wallet for tracking items issued to them
CREATE TABLE user_wallets (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL UNIQUE,
  balance_pts  DECIMAL(10,2) DEFAULT 0,  -- optional credit points system
  total_items_received INT DEFAULT 0,
  total_items_returned INT DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert wallets for all teachers
INSERT INTO user_wallets (user_id) VALUES (4),(5);

-- Item issuance requests (teacher requests or storekeeper issues)
CREATE TABLE item_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  requester_id    INT NOT NULL,     -- teacher/staff user_id
  item_id         INT NOT NULL,
  quantity        INT NOT NULL DEFAULT 1,
  purpose         TEXT,
  status          ENUM('pending','approved','issued','rejected','returned') DEFAULT 'pending',
  requested_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by     INT,
  approved_at     TIMESTAMP NULL,
  issued_by       INT,              -- store_keeper user_id
  issued_at       TIMESTAMP NULL,
  return_date     DATE,             -- expected return (non-consumable)
  actual_return   TIMESTAMP NULL,
  rejection_note  TEXT,
  FOREIGN KEY (branch_id)    REFERENCES branches(id),
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (item_id)      REFERENCES inventory_items(id),
  FOREIGN KEY (approved_by)  REFERENCES users(id),
  FOREIGN KEY (issued_by)    REFERENCES users(id)
);

-- Wallet transaction log — shows what each teacher has received
CREATE TABLE wallet_item_log (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  wallet_id       INT NOT NULL,
  request_id      INT NOT NULL,
  item_id         INT NOT NULL,
  quantity        INT NOT NULL,
  action          ENUM('received','returned','lost','damaged') DEFAULT 'received',
  recorded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by     INT,
  notes           VARCHAR(255),
  FOREIGN KEY (wallet_id)   REFERENCES user_wallets(id),
  FOREIGN KEY (request_id)  REFERENCES item_requests(id),
  FOREIGN KEY (item_id)     REFERENCES inventory_items(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- ============================================================
-- SECTION 17: NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  recipient_id  INT NOT NULL,     -- user_id
  sender_id     INT,
  type          ENUM('item_request','item_issued','item_approved','item_rejected','fee_due','result','notice','attendance','general') DEFAULT 'general',
  title         VARCHAR(200) NOT NULL,
  body          TEXT,
  reference_id  INT,              -- linked record id
  reference_type VARCHAR(50),     -- table name
  is_read       TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)   REFERENCES branches(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id),
  FOREIGN KEY (sender_id)   REFERENCES users(id)
);

-- ============================================================
-- SECTION 18: BUSINESS FAIR
-- ============================================================
CREATE TABLE business_fairs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  academic_year_id INT NOT NULL,
  name            VARCHAR(150) NOT NULL,
  theme           VARCHAR(200),
  date            DATE NOT NULL,
  venue           VARCHAR(200),
  coordinator_id  INT,
  status          ENUM('planning','active','completed') DEFAULT 'planning',
  description     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)        REFERENCES branches(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (coordinator_id)   REFERENCES users(id)
);

CREATE TABLE fair_stalls (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  fair_id         INT NOT NULL,
  stall_number    VARCHAR(10),
  business_name   VARCHAR(150) NOT NULL,
  section_id      INT,
  description     TEXT,
  seed_budget     DECIMAL(10,2) DEFAULT 500,
  revenue_earned  DECIMAL(10,2) DEFAULT 0,
  profit_loss     DECIMAL(10,2) GENERATED ALWAYS AS (revenue_earned - seed_budget) STORED,
  product_type    ENUM('food','craft','technology','service','art','other') DEFAULT 'other',
  award           VARCHAR(100),
  FOREIGN KEY (fair_id)   REFERENCES business_fairs(id),
  FOREIGN KEY (section_id) REFERENCES sections(id)
);

CREATE TABLE fair_stall_members (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  stall_id    INT NOT NULL,
  student_id  INT NOT NULL,
  role        VARCHAR(50) DEFAULT 'member',
  FOREIGN KEY (stall_id)   REFERENCES fair_stalls(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- ============================================================
-- SECTION 19: LIBRARY
-- ============================================================
CREATE TABLE library_books (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  isbn            VARCHAR(30),
  title           VARCHAR(250) NOT NULL,
  author          VARCHAR(150),
  publisher       VARCHAR(150),
  edition         VARCHAR(30),
  category        VARCHAR(80),
  subject_id      INT,
  total_copies    INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  location        VARCHAR(50),
  is_active       TINYINT(1) DEFAULT 1,
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE library_issues (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  book_id     INT NOT NULL,
  user_id     INT NOT NULL,
  issued_date DATE NOT NULL,
  due_date    DATE NOT NULL,
  return_date DATE,
  fine_amount DECIMAL(8,2) DEFAULT 0,
  status      ENUM('issued','returned','overdue','lost') DEFAULT 'issued',
  issued_by   INT,
  FOREIGN KEY (book_id)   REFERENCES library_books(id),
  FOREIGN KEY (user_id)   REFERENCES users(id),
  FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- ============================================================
-- SECTION 20: ADMISSIONS
-- ============================================================
CREATE TABLE admissions (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  branch_id         INT NOT NULL,
  academic_year_id  INT NOT NULL,
  applicant_name    VARCHAR(150) NOT NULL,
  father_name       VARCHAR(150) NOT NULL,
  dob               DATE,
  gender            ENUM('male','female'),
  class_applied_for INT NOT NULL,
  prev_school       VARCHAR(150),
  prev_class        VARCHAR(50),
  prev_marks_pct    DECIMAL(5,2),
  phone             VARCHAR(30),
  email             VARCHAR(150),
  address           TEXT,
  b_form_no         VARCHAR(20),
  test_date         DATE,
  test_score        DECIMAL(5,2),
  interview_score   DECIMAL(5,2),
  status            ENUM('applied','shortlisted','tested','accepted','rejected','enrolled','waitlist') DEFAULT 'applied',
  admission_no      VARCHAR(30),
  processed_by      INT,
  remarks           TEXT,
  applied_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)        REFERENCES branches(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (class_applied_for) REFERENCES classes(id),
  FOREIGN KEY (processed_by)     REFERENCES users(id)
);

-- ============================================================
-- SECTION 21: WEBSITE CMS (Admin Controls Website Content)
-- ============================================================
CREATE TABLE cms_pages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT NOT NULL,
  slug        VARCHAR(80) NOT NULL UNIQUE,   -- home, about, academics, etc.
  title       VARCHAR(150) NOT NULL,
  meta_desc   TEXT,
  is_published TINYINT(1) DEFAULT 1,
  updated_by  INT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
INSERT INTO cms_pages (branch_id, slug, title, is_published) VALUES
(1,'home','Home Page',1),(1,'about','About Us',1),(1,'academics','Academics',1),
(1,'robotics','STREAM Robotics',1),(1,'character','Character Building',1),
(1,'fair','Business Fair',1),(1,'admissions','Admissions',1),(1,'contact','Contact',1);

CREATE TABLE cms_sections (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  page_id      INT NOT NULL,
  section_key  VARCHAR(80) NOT NULL,     -- hero_title, hero_sub, about_text, etc.
  content_type ENUM('text','html','image','number','url','boolean') DEFAULT 'text',
  content      LONGTEXT,
  is_active    TINYINT(1) DEFAULT 1,
  sort_order   INT DEFAULT 0,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_sec (page_id, section_key),
  FOREIGN KEY (page_id) REFERENCES cms_pages(id)
);

CREATE TABLE cms_media (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  file_type   ENUM('image','video','document','other') DEFAULT 'image',
  file_size   INT,
  alt_text    VARCHAR(255),
  category    VARCHAR(80),  -- gallery, slider, team, events
  uploaded_by INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)   REFERENCES branches(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE notices (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  title         VARCHAR(200) NOT NULL,
  body          TEXT,
  target_roles  VARCHAR(200),  -- comma-separated: teacher,student,parent
  is_published  TINYINT(1) DEFAULT 0,
  priority      ENUM('low','medium','high','urgent') DEFAULT 'medium',
  publish_date  DATE,
  expiry_date   DATE,
  published_by  INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)   REFERENCES branches(id),
  FOREIGN KEY (published_by) REFERENCES users(id)
);

CREATE TABLE news_events (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  type          ENUM('news','event','achievement') DEFAULT 'news',
  title         VARCHAR(200) NOT NULL,
  slug          VARCHAR(200),
  excerpt       TEXT,
  body          LONGTEXT,
  thumbnail     VARCHAR(255),
  event_date    DATE,
  event_venue   VARCHAR(150),
  is_published  TINYINT(1) DEFAULT 0,
  published_by  INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)   REFERENCES branches(id),
  FOREIGN KEY (published_by) REFERENCES users(id)
);

-- ============================================================
-- SECTION 22: LEAVE MANAGEMENT
-- ============================================================
CREATE TABLE leave_types (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80),
  max_days_per_year INT DEFAULT 15,
  applicable_to VARCHAR(50) DEFAULT 'all'  -- teacher, student, all
);
INSERT INTO leave_types (name, max_days_per_year, applicable_to) VALUES
('Casual Leave',12,'teacher'),('Sick Leave',15,'teacher'),
('Annual Leave',21,'teacher'),('Maternity Leave',90,'teacher'),
('Student Leave',5,'student');

CREATE TABLE leave_applications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  applicant_id    INT NOT NULL,
  leave_type_id   INT NOT NULL,
  from_date       DATE NOT NULL,
  to_date         DATE NOT NULL,
  total_days      INT GENERATED ALWAYS AS (DATEDIFF(to_date, from_date)+1) STORED,
  reason          TEXT,
  status          ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  approved_by     INT,
  approved_at     TIMESTAMP NULL,
  rejection_note  TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id)  REFERENCES users(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  FOREIGN KEY (approved_by)   REFERENCES users(id)
);

-- ============================================================
-- SECTION 23: COMPLAINTS & FEEDBACK
-- ============================================================
CREATE TABLE complaints (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  submitted_by  INT,
  complainant_name VARCHAR(150),
  type          ENUM('student','parent','teacher','general') DEFAULT 'general',
  subject       VARCHAR(200),
  description   TEXT,
  status        ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
  priority      ENUM('low','medium','high') DEFAULT 'medium',
  assigned_to   INT,
  resolution    TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)    REFERENCES branches(id),
  FOREIGN KEY (submitted_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to)  REFERENCES users(id)
);

-- ============================================================
-- SECTION 24: SYSTEM SETTINGS
-- ============================================================
CREATE TABLE system_settings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  value       TEXT,
  data_type   ENUM('string','number','boolean','json') DEFAULT 'string',
  updated_by  INT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_setting (branch_id, setting_key),
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
INSERT INTO system_settings (branch_id, setting_key, value, data_type) VALUES
(1,'school_name','AL Qalam International','string'),
(1,'session_year','2024-25','string'),
(1,'fee_due_day','10','number'),
(1,'late_fee_per_day','50','number'),
(1,'sms_enabled','1','boolean'),
(1,'email_enabled','1','boolean'),
(1,'portal_maintenance','0','boolean'),
(1,'working_days','mon,tue,wed,thu,fri,sat','string');

-- ============================================================
-- SECTION 25: AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT,
  action        VARCHAR(100) NOT NULL,  -- login, create, update, delete
  table_name    VARCHAR(80),
  record_id     INT,
  old_values    JSON,
  new_values    JSON,
  ip_address    VARCHAR(45),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- USEFUL STORED PROCEDURES
-- ============================================================

-- 1. Get full student report card
DELIMITER $$
CREATE PROCEDURE GetStudentReport(IN p_student_id INT, IN p_exam_id INT)
BEGIN
  SELECT
    u.full_name AS student_name,
    c.name AS class_name,
    sec.name AS section,
    sub.name AS subject,
    r.marks_obtained,
    r.total_marks,
    ROUND((r.marks_obtained/r.total_marks)*100,1) AS percentage,
    CASE
      WHEN (r.marks_obtained/r.total_marks)*100 >= 90 THEN 'A+'
      WHEN (r.marks_obtained/r.total_marks)*100 >= 80 THEN 'A'
      WHEN (r.marks_obtained/r.total_marks)*100 >= 70 THEN 'B+'
      WHEN (r.marks_obtained/r.total_marks)*100 >= 60 THEN 'B'
      WHEN (r.marks_obtained/r.total_marks)*100 >= 50 THEN 'C'
      WHEN (r.marks_obtained/r.total_marks)*100 >= 33 THEN 'D'
      ELSE 'F'
    END AS grade
  FROM results r
  JOIN students st ON r.student_id = st.id
  JOIN users u ON st.user_id = u.id
  JOIN classes c ON st.class_id = c.id
  LEFT JOIN sections sec ON st.section_id = sec.id
  JOIN subjects sub ON r.subject_id = sub.id
  WHERE r.student_id = p_student_id AND r.exam_id = p_exam_id;
END$$

-- 2. Issue item to teacher (wallet update)
CREATE PROCEDURE IssueItemToTeacher(
  IN p_request_id INT,
  IN p_storekeeper_id INT
)
BEGIN
  DECLARE v_item_id INT;
  DECLARE v_qty INT;
  DECLARE v_user_id INT;
  DECLARE v_wallet_id INT;

  SELECT item_id, quantity, requester_id INTO v_item_id, v_qty, v_user_id
  FROM item_requests WHERE id = p_request_id;

  SELECT id INTO v_wallet_id FROM user_wallets WHERE user_id = v_user_id;

  -- Update request status
  UPDATE item_requests
  SET status='issued', issued_by=p_storekeeper_id, issued_at=NOW()
  WHERE id = p_request_id;

  -- Log in wallet
  INSERT INTO wallet_item_log (wallet_id, request_id, item_id, quantity, action, recorded_by)
  VALUES (v_wallet_id, p_request_id, v_item_id, v_qty, 'received', p_storekeeper_id);

  -- Log stock transaction
  INSERT INTO stock_transactions (branch_id, item_id, transaction_type, quantity, performed_by, notes)
  SELECT branch_id, v_item_id, 'stock_out', v_qty, p_storekeeper_id, CONCAT('Issued via Request #', p_request_id)
  FROM item_requests WHERE id = p_request_id;

  -- Send notification to requester
  INSERT INTO notifications (branch_id, recipient_id, sender_id, type, title, body, reference_id, reference_type)
  SELECT ir.branch_id, ir.requester_id, p_storekeeper_id, 'item_issued',
    CONCAT('Item Issued: ', ii.name),
    CONCAT(v_qty, ' unit(s) of ', ii.name, ' have been issued to you. Please confirm receipt.'),
    p_request_id, 'item_requests'
  FROM item_requests ir JOIN inventory_items ii ON ir.item_id = ii.id
  WHERE ir.id = p_request_id;
END$$

-- 3. Get low stock alert items
CREATE PROCEDURE GetLowStockItems(IN p_branch_id INT)
BEGIN
  SELECT
    ii.id, ii.name, ii.sku, ii.current_stock,
    ii.reorder_level, ic.name AS category,
    ii.item_type, ii.unit_cost,
    (ii.reorder_level - ii.current_stock) AS shortage_qty
  FROM inventory_items ii
  JOIN inventory_categories ic ON ii.category_id = ic.id
  WHERE ii.branch_id = p_branch_id
    AND ii.current_stock <= ii.reorder_level
    AND ii.is_active = 1
  ORDER BY shortage_qty DESC;
END$$

DELIMITER ;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_students_branch    ON students(branch_id);
CREATE INDEX idx_students_class     ON students(class_id);
CREATE INDEX idx_students_roll      ON students(roll_number);
CREATE INDEX idx_results_student    ON results(student_id);
CREATE INDEX idx_results_exam       ON results(exam_id);
CREATE INDEX idx_attendance_date    ON student_attendance(date);
CREATE INDEX idx_attendance_student ON student_attendance(student_id);
CREATE INDEX idx_fee_student        ON fee_payments(student_id);
CREATE INDEX idx_fee_status         ON fee_payments(status);
CREATE INDEX idx_notif_recipient    ON notifications(recipient_id, is_read);
CREATE INDEX idx_stock_item         ON stock_transactions(item_id);
CREATE INDEX idx_requests_status    ON item_requests(status);
CREATE INDEX idx_requests_user      ON item_requests(requester_id);
CREATE INDEX idx_users_role         ON users(role_id);
CREATE INDEX idx_users_branch       ON users(branch_id);

-- ============================================================
--  SUMMARY OF TABLES (25 sections, 50+ tables)
-- ============================================================
-- branches               | Multi-campus support
-- roles                  | 10 system roles
-- users                  | Unified auth (all user types)
-- user_sessions          | JWT/session tokens
-- academic_years         | Session management
-- classes                | Grade/class structure
-- sections               | Class sections (A, B, C)
-- subjects               | Subjects per class
-- teachers               | Teacher profiles
-- teacher_subject_assignments | Who teaches what
-- students               | Student profiles & enrollment
-- parents                | Parent details
-- student_parent_link    | Student ↔ Parent relation
-- timetable              | Class schedule
-- student_attendance     | Daily attendance
-- teacher_attendance     | Staff attendance
-- exam_types             | Weekly/Monthly/Annual etc.
-- exams                  | Exam schedules
-- results                | Marks & grades
-- lesson_plans           | Weekly/Monthly/Yearly plans
-- homework               | Assignments
-- homework_submissions   | Student submissions
-- fee_structures         | Fee slabs per class
-- fee_payments           | Payment records
-- scholarships           | Discounts & waivers
-- salary_structures      | Staff salary setup
-- salary_payments        | Monthly payroll
-- inventory_categories   | Item categories
-- inventory_items        | All stock items (stationary, grocery, etc.)
-- stock_transactions     | IN/OUT/adjustment records
-- user_wallets           | Teacher item tracking wallet
-- item_requests          | Issuance requests with approval flow
-- wallet_item_log        | Per-teacher item history
-- notifications          | Real-time alerts
-- business_fairs         | Annual fair events
-- fair_stalls            | Student business stalls
-- fair_stall_members     | Stall team members
-- library_books          | Book catalog
-- library_issues         | Book borrowing records
-- admissions             | New admission applications
-- cms_pages              | Website page registry
-- cms_sections           | Editable content blocks
-- cms_media              | Uploaded images/files
-- notices                | School notices/circulars
-- news_events            | News & events
-- leave_types            | Leave categories
-- leave_applications     | Staff & student leaves
-- complaints             | Complaints & feedback
-- system_settings        | Global config
-- audit_logs             | Full activity tracking
-- ============================================================

SELECT 'AL Qalam Database Schema Installed Successfully!' AS status;

-- ============================================================
-- SECTION 26: TRANSPORT MANAGEMENT
-- ============================================================
CREATE TABLE transport_routes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  branch_id    INT NOT NULL,
  route_name   VARCHAR(100) NOT NULL,
  route_code   VARCHAR(20) UNIQUE,
  driver_name  VARCHAR(100),
  driver_phone VARCHAR(30),
  vehicle_no   VARCHAR(30),
  vehicle_type VARCHAR(50),
  capacity     INT DEFAULT 30,
  monthly_fee  DECIMAL(10,2) DEFAULT 0,
  morning_departure TIME,
  evening_departure TIME,
  stops        TEXT COMMENT 'JSON array of stop names',
  is_active    TINYINT(1) DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
INSERT INTO transport_routes (branch_id, route_name, route_code, driver_name, driver_phone, vehicle_no, vehicle_type, capacity, monthly_fee, morning_departure, evening_departure, stops) VALUES
(1,'Route A - Gulshan','RT-A','Muhammad Rafiq','+92-300-1234567','KHI-1234','Mini Bus',35,800.00,'07:00:00','14:30:00','["Gulshan Block 1","Gulshan Block 5","Gulshan Block 10","Main Campus"]'),
(1,'Route B - Nazimabad','RT-B','Abdul Karim','+92-311-9876543','KHI-5678','Coaster',25,700.00,'07:15:00','14:45:00','["Nazimabad No 1","Nazimabad No 3","Main Campus"]'),
(1,'Route C - North Karachi','RT-C','Ghulam Nabi','+92-333-4567890','KHI-9012','Mini Bus',35,900.00,'06:45:00','14:30:00','["North Karachi Sector 5","Sector 11","Sector 15","Main Campus"]');

CREATE TABLE transport_students (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  route_id     INT NOT NULL,
  pickup_stop  VARCHAR(100),
  dropoff_stop VARCHAR(100),
  morning_pickup TINYINT(1) DEFAULT 1,
  evening_drop   TINYINT(1) DEFAULT 1,
  enrolled_date  DATE,
  valid_until    DATE,
  fee_amount     DECIMAL(10,2),
  status         ENUM('active','inactive','suspended') DEFAULT 'active',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_transport_student (student_id, route_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (route_id)   REFERENCES transport_routes(id)
);

CREATE TABLE transport_attendance (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  route_id   INT NOT NULL,
  student_id INT NOT NULL,
  date       DATE NOT NULL,
  morning    ENUM('boarded','absent','holiday') DEFAULT 'absent',
  evening    ENUM('boarded','absent','holiday') DEFAULT 'absent',
  remarks    VARCHAR(255),
  UNIQUE KEY uniq_trans_att (student_id, date),
  FOREIGN KEY (route_id)   REFERENCES transport_routes(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- ============================================================
-- SECTION 27: STAFF ATTENDANCE (Extended for self check-in)
-- ============================================================
-- NOTE: teacher_attendance already exists for teachers.
-- staff_attendance covers ALL staff (teachers + admin + other roles)
CREATE TABLE staff_attendance (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  branch_id    INT NOT NULL DEFAULT 1,
  date         DATE NOT NULL,
  check_in     TIME,
  check_out    TIME,
  status       ENUM('present','absent','late','leave','half_day','holiday') DEFAULT 'present',
  late_minutes INT DEFAULT 0,
  device_type  ENUM('web','mobile','biometric') DEFAULT 'web',
  ip_address   VARCHAR(45),
  leave_type   VARCHAR(50),
  remarks      VARCHAR(255),
  marked_by    INT NULL COMMENT 'NULL = self check-in, user_id = admin override',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_staff_att (user_id, date),
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (marked_by)  REFERENCES users(id)
);

-- ============================================================
-- SECTION 28: FEE CHALLAN ITEMS
-- ============================================================
-- Stores the breakdown of what each challan contains
CREATE TABLE fee_challan_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  fee_payment_id  INT NOT NULL,
  item_name       VARCHAR(100) NOT NULL,  -- Tuition Fee, Transport Fee, Lab Fee etc.
  amount          DECIMAL(10,2) NOT NULL,
  item_type       ENUM('tuition','transport','hostel','lab','sports','exam','library','misc','discount','late_fee') DEFAULT 'tuition',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fee_payment_id) REFERENCES fee_payments(id) ON DELETE CASCADE
);

-- ============================================================
-- SECTION 29: FEE ARREARS
-- ============================================================
CREATE TABLE fee_arrears (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  branch_id    INT NOT NULL DEFAULT 1,
  month        VARCHAR(7) NOT NULL COMMENT 'YYYY-MM format',
  amount_due   DECIMAL(10,2) NOT NULL,
  amount_paid  DECIMAL(10,2) DEFAULT 0,
  balance      DECIMAL(10,2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
  original_due_date DATE,
  last_payment_date DATE,
  months_overdue INT GENERATED ALWAYS AS (TIMESTAMPDIFF(MONTH, original_due_date, CURRENT_DATE)) STORED,
  status       ENUM('outstanding','partial','cleared','waived') DEFAULT 'outstanding',
  remarks      VARCHAR(255),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_arrear (student_id, month),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (branch_id)  REFERENCES branches(id)
);

-- ============================================================
-- SECTION 30: FEE ADVANCE PAYMENTS
-- ============================================================
CREATE TABLE fee_advance_payments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  branch_id    INT NOT NULL DEFAULT 1,
  amount       DECIMAL(10,2) NOT NULL,
  paid_date    DATE NOT NULL,
  valid_for    VARCHAR(7) COMMENT 'YYYY-MM - month advance covers',
  receipt_no   VARCHAR(30),
  payment_mode ENUM('cash','bank_transfer','cheque','online') DEFAULT 'cash',
  bank_name    VARCHAR(100),
  cheque_no    VARCHAR(50),
  collected_by INT,
  remarks      VARCHAR(255),
  is_adjusted  TINYINT(1) DEFAULT 0 COMMENT '1 = already applied to a challan',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)   REFERENCES students(id),
  FOREIGN KEY (branch_id)    REFERENCES branches(id),
  FOREIGN KEY (collected_by) REFERENCES users(id)
);

-- ============================================================
-- SECTION 31: FEE CLOSING REPORTS
-- ============================================================
CREATE TABLE fee_closing_reports (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  branch_id        INT NOT NULL DEFAULT 1,
  report_month     VARCHAR(7) NOT NULL COMMENT 'YYYY-MM',
  total_students   INT DEFAULT 0,
  total_demanded   DECIMAL(12,2) DEFAULT 0,
  total_collected  DECIMAL(12,2) DEFAULT 0,
  total_arrears    DECIMAL(12,2) DEFAULT 0,
  total_advance    DECIMAL(12,2) DEFAULT 0,
  total_discounts  DECIMAL(12,2) DEFAULT 0,
  total_late_fee   DECIMAL(12,2) DEFAULT 0,
  cash_collected   DECIMAL(12,2) DEFAULT 0,
  bank_collected   DECIMAL(12,2) DEFAULT 0,
  online_collected DECIMAL(12,2) DEFAULT 0,
  cheque_collected DECIMAL(12,2) DEFAULT 0,
  collection_rate  DECIMAL(5,2)  DEFAULT 0 COMMENT 'Percentage',
  status           ENUM('draft','finalized','audited') DEFAULT 'draft',
  generated_by     INT,
  finalized_by     INT,
  finalized_at     TIMESTAMP NULL,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_closing (branch_id, report_month),
  FOREIGN KEY (branch_id)    REFERENCES branches(id),
  FOREIGN KEY (generated_by) REFERENCES users(id),
  FOREIGN KEY (finalized_by) REFERENCES users(id)
);

-- ============================================================
-- SECTION 32: LOGIN LOGS (Audit trail)
-- ============================================================
CREATE TABLE login_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  username    VARCHAR(80),
  role        VARCHAR(50),
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  device_type ENUM('web','mobile','desktop') DEFAULT 'web',
  action      ENUM('login','logout','failed','token_refresh') DEFAULT 'login',
  status      ENUM('success','failed') DEFAULT 'success',
  fail_reason VARCHAR(255),
  session_duration INT COMMENT 'Seconds, filled on logout',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- SECTION 33: TIMETABLE (Extended)
-- ============================================================
-- Extends existing timetable table with period-based schedule
CREATE TABLE timetable_periods (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  branch_id    INT NOT NULL DEFAULT 1,
  period_no    INT NOT NULL,
  period_name  VARCHAR(30),   -- Period 1, Break, Lunch etc.
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_break     TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
INSERT INTO timetable_periods (branch_id, period_no, period_name, start_time, end_time, is_break) VALUES
(1,1,'Period 1','08:00:00','08:45:00',0),
(1,2,'Period 2','08:45:00','09:30:00',0),
(1,3,'Break','09:30:00','09:45:00',1),
(1,4,'Period 3','09:45:00','10:30:00',0),
(1,5,'Period 4','10:30:00','11:15:00',0),
(1,6,'Period 5','11:15:00','12:00:00',0),
(1,7,'Lunch','12:00:00','12:30:00',1),
(1,8,'Period 6','12:30:00','13:15:00',0),
(1,9,'Period 7','13:15:00','14:00:00',0);

CREATE TABLE timetable_slots (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  branch_id    INT NOT NULL DEFAULT 1,
  academic_year_id INT NOT NULL,
  class_id     INT NOT NULL,
  section_id   INT,
  period_id    INT NOT NULL,
  day_of_week  ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  subject_id   INT,
  teacher_id   INT,
  room_no      VARCHAR(20),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_slot (class_id, section_id, period_id, day_of_week),
  FOREIGN KEY (branch_id)        REFERENCES branches(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (class_id)         REFERENCES classes(id),
  FOREIGN KEY (section_id)       REFERENCES sections(id),
  FOREIGN KEY (period_id)        REFERENCES timetable_periods(id),
  FOREIGN KEY (subject_id)       REFERENCES subjects(id),
  FOREIGN KEY (teacher_id)       REFERENCES teachers(id)
);

-- ============================================================
-- SECTION 34: EXAM SCHEDULE (Subject-wise exam timetable)
-- ============================================================
CREATE TABLE exam_schedule (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  exam_id      INT NOT NULL,
  subject_id   INT NOT NULL,
  class_id     INT NOT NULL,
  section_id   INT,
  exam_date    DATE NOT NULL,
  start_time   TIME,
  end_time     TIME,
  total_marks  INT DEFAULT 100,
  room_no      VARCHAR(20),
  invigilator_id INT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_exam_slot (exam_id, subject_id, class_id),
  FOREIGN KEY (exam_id)        REFERENCES exams(id),
  FOREIGN KEY (subject_id)     REFERENCES subjects(id),
  FOREIGN KEY (class_id)       REFERENCES classes(id),
  FOREIGN KEY (section_id)     REFERENCES sections(id),
  FOREIGN KEY (invigilator_id) REFERENCES teachers(id)
);

-- ============================================================
-- SECTION 35: SALARY SHEETS (Monthly payroll)
-- ============================================================
CREATE TABLE salary_sheets (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL DEFAULT 1,
  user_id         INT NOT NULL,
  month           VARCHAR(7) NOT NULL COMMENT 'YYYY-MM',
  basic_salary    DECIMAL(10,2) DEFAULT 0,
  house_allow     DECIMAL(10,2) DEFAULT 0,
  transport_allow DECIMAL(10,2) DEFAULT 0,
  medical_allow   DECIMAL(10,2) DEFAULT 0,
  other_allow     DECIMAL(10,2) DEFAULT 0,
  gross_salary    DECIMAL(10,2) DEFAULT 0,
  income_tax      DECIMAL(10,2) DEFAULT 0,
  provident_fund  DECIMAL(10,2) DEFAULT 0,
  loan_deduction  DECIMAL(10,2) DEFAULT 0,
  other_deduction DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) DEFAULT 0,
  net_salary      DECIMAL(10,2) DEFAULT 0,
  present_days    INT DEFAULT 0,
  absent_days     INT DEFAULT 0,
  leave_days      INT DEFAULT 0,
  late_days       INT DEFAULT 0,
  payment_mode    ENUM('cash','bank_transfer','cheque') DEFAULT 'bank_transfer',
  bank_name       VARCHAR(100),
  account_no      VARCHAR(50),
  payment_date    DATE,
  status          ENUM('draft','approved','paid','held') DEFAULT 'draft',
  approved_by     INT,
  remarks         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_salary (user_id, month),
  FOREIGN KEY (branch_id)    REFERENCES branches(id),
  FOREIGN KEY (user_id)      REFERENCES users(id),
  FOREIGN KEY (approved_by)  REFERENCES users(id)
);

-- ============================================================
-- SECTION 36: ROLE PERMISSIONS (Granular permission matrix)
-- ============================================================
CREATE TABLE role_permissions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  role_name   VARCHAR(50) NOT NULL,
  module      VARCHAR(50) NOT NULL,
  can_view    TINYINT(1) DEFAULT 1,
  can_create  TINYINT(1) DEFAULT 0,
  can_edit    TINYINT(1) DEFAULT 0,
  can_delete  TINYINT(1) DEFAULT 0,
  can_export  TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_role_module (role_name, module)
);

-- Seed default permissions
INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete, can_export) VALUES
('super_admin','*',1,1,1,1,1),
('admin','students',1,1,1,1,1),('admin','teachers',1,1,1,1,1),
('admin','fee',1,1,1,0,1),('admin','attendance',1,1,1,0,1),
('admin','reports',1,0,0,0,1),('admin','timetable',1,1,1,1,0),
('admin','transport',1,1,1,1,0),('admin','library',1,1,1,1,0),
('admin','examination',1,1,1,1,1),('admin','inventory',1,1,1,1,1),
('admin','salary',1,1,1,0,1),('admin','cms',1,1,1,1,0),
('principal','students',1,0,0,0,1),('principal','teachers',1,0,0,0,1),
('principal','attendance',1,1,0,0,1),('principal','results',1,0,0,0,1),
('principal','timetable',1,1,1,0,0),('principal','examination',1,1,1,0,1),
('principal','reports',1,0,0,0,1),
('accountant','fee',1,1,1,0,1),('accountant','salary',1,1,1,0,1),
('accountant','reports',1,0,0,0,1),
('teacher','attendance',1,1,0,0,0),('teacher','results',1,1,1,0,0),
('teacher','timetable',1,0,0,0,0),('teacher','homework',1,1,1,0,0),
('librarian','library',1,1,1,1,1),
('transport_manager','transport',1,1,1,1,1),
('store_keeper','inventory',1,1,1,0,1),
('exam_controller','examination',1,1,1,1,1),('exam_controller','results',1,1,1,0,1),
('receptionist','students',1,1,0,0,0),('receptionist','admissions',1,1,1,0,0);

-- ============================================================
-- ADDITIONAL INDEXES FOR NEW TABLES
-- ============================================================
CREATE INDEX idx_staff_att_user   ON staff_attendance(user_id);
CREATE INDEX idx_staff_att_date   ON staff_attendance(date);
CREATE INDEX idx_transport_route  ON transport_students(route_id);
CREATE INDEX idx_fee_arrears      ON fee_arrears(student_id, status);
CREATE INDEX idx_salary_sheet     ON salary_sheets(user_id, month);
CREATE INDEX idx_login_logs_user  ON login_logs(user_id);
CREATE INDEX idx_login_logs_date  ON login_logs(created_at);
CREATE INDEX idx_timetable_class  ON timetable_slots(class_id, day_of_week);
CREATE INDEX idx_exam_schedule    ON exam_schedule(exam_id, exam_date);
CREATE INDEX idx_fee_advance      ON fee_advance_payments(student_id, is_adjusted);

-- ============================================================
-- STORED PROCEDURE: Generate Monthly Fee Closing Report
-- ============================================================
DELIMITER $$
CREATE PROCEDURE GenerateFeeClosingReport(IN p_branch_id INT, IN p_month VARCHAR(7))
BEGIN
  DECLARE v_total_students INT;
  DECLARE v_total_demanded DECIMAL(12,2);
  DECLARE v_total_collected DECIMAL(12,2);
  DECLARE v_cash_collected DECIMAL(12,2);
  DECLARE v_bank_collected DECIMAL(12,2);
  DECLARE v_online_collected DECIMAL(12,2);
  DECLARE v_cheque_collected DECIMAL(12,2);
  DECLARE v_total_discounts DECIMAL(12,2);
  DECLARE v_total_late_fee DECIMAL(12,2);
  DECLARE v_total_arrears DECIMAL(12,2);

  -- Count students
  SELECT COUNT(*) INTO v_total_students FROM students WHERE branch_id=p_branch_id AND status='active';

  -- Fee totals for the month
  SELECT
    COALESCE(SUM(fp.amount_due),0),
    COALESCE(SUM(fp.amount_paid),0),
    COALESCE(SUM(CASE WHEN fp.payment_method='cash' THEN fp.amount_paid ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN fp.payment_method='bank_transfer' THEN fp.amount_paid ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN fp.payment_method='online' THEN fp.amount_paid ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN fp.payment_method='cheque' THEN fp.amount_paid ELSE 0 END),0),
    COALESCE(SUM(fp.discount),0),
    COALESCE(SUM(fp.late_fee_applied),0)
  INTO
    v_total_demanded, v_total_collected,
    v_cash_collected, v_bank_collected,
    v_online_collected, v_cheque_collected,
    v_total_discounts, v_total_late_fee
  FROM fee_payments fp
  JOIN students s ON fp.student_id = s.id
  WHERE s.branch_id = p_branch_id
    AND DATE_FORMAT(COALESCE(fp.payment_date, fp.due_date), '%Y-%m') = p_month;

  -- Arrears = outstanding from fee_arrears
  SELECT COALESCE(SUM(amount_due - amount_paid),0) INTO v_total_arrears
  FROM fee_arrears
  WHERE branch_id=p_branch_id AND status IN('outstanding','partial');

  -- Upsert into fee_closing_reports
  INSERT INTO fee_closing_reports
    (branch_id, report_month, total_students, total_demanded, total_collected, total_arrears,
     cash_collected, bank_collected, online_collected, cheque_collected,
     total_discounts, total_late_fee,
     collection_rate, status)
  VALUES
    (p_branch_id, p_month, v_total_students, v_total_demanded, v_total_collected, v_total_arrears,
     v_cash_collected, v_bank_collected, v_online_collected, v_cheque_collected,
     v_total_discounts, v_total_late_fee,
     IF(v_total_demanded>0, ROUND(v_total_collected/v_total_demanded*100,2), 0), 'draft')
  ON DUPLICATE KEY UPDATE
    total_students=v_total_students, total_demanded=v_total_demanded,
    total_collected=v_total_collected, total_arrears=v_total_arrears,
    cash_collected=v_cash_collected, bank_collected=v_bank_collected,
    online_collected=v_online_collected, cheque_collected=v_cheque_collected,
    total_discounts=v_total_discounts, total_late_fee=v_total_late_fee,
    collection_rate=IF(v_total_demanded>0, ROUND(v_total_collected/v_total_demanded*100,2), 0);

  SELECT * FROM fee_closing_reports WHERE branch_id=p_branch_id AND report_month=p_month;
END$$
DELIMITER ;

-- ============================================================
-- VIEW: v_staff_attendance_today
-- ============================================================
CREATE VIEW v_staff_attendance_today AS
SELECT
  sa.id, sa.user_id, u.full_name, u.username, r.name AS role,
  sa.date, sa.check_in, sa.check_out, sa.status,
  sa.late_minutes, sa.device_type, sa.remarks,
  CASE WHEN sa.marked_by IS NULL THEN 'Self' ELSE 'Admin Override' END AS marked_type
FROM staff_attendance sa
JOIN users u ON sa.user_id = u.id
JOIN roles r ON u.role_id = r.id
WHERE sa.date = CURDATE();

-- ============================================================
-- VIEW: v_fee_arrears_summary
-- ============================================================
CREATE VIEW v_fee_arrears_summary AS
SELECT
  fa.student_id,
  CONCAT(u.full_name) AS student_name,
  s.roll_number,
  c.name AS class_name,
  COUNT(fa.id) AS months_overdue,
  SUM(fa.amount_due) AS total_demanded,
  SUM(fa.amount_paid) AS total_paid,
  SUM(fa.amount_due - fa.amount_paid) AS total_balance
FROM fee_arrears fa
JOIN students s ON fa.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN classes c ON s.class_id = c.id
WHERE fa.status IN ('outstanding','partial')
GROUP BY fa.student_id, u.full_name, s.roll_number, c.name;

SELECT 'AL Qalam Database Schema v2.0 — All New Tables Added Successfully!' AS update_status;
