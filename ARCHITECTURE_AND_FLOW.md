# NesthrApp Architecture and Flow

Last updated: 2026-05-09

NesthrApp is a multi-tenant HR management application for company registration, employee self-service, attendance, project allocation, leave, payroll, tax declarations, and admin review workflows.

## Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Runtime Architecture](#runtime-architecture)
4. [Repository Structure](#repository-structure)
5. [Multi-Tenant Data Model](#multi-tenant-data-model)
6. [Routing and Navigation](#routing-and-navigation)
7. [Core User Flows](#core-user-flows)
8. [Data Access Layer](#data-access-layer)
9. [Backend API](#backend-api)
10. [Security and State](#security-and-state)
11. [Operational Notes](#operational-notes)

## System Overview

The application has three main layers:

- React/Vite frontend under `src/`
- Supabase PostgreSQL data access through `src/supabaseHelpers.js`
- Express email/OTP service under `server/index.js`

The frontend owns the user experience and calls Supabase directly for most business operations. The Express server is currently focused on OTP generation, OTP verification, and email delivery through Nodemailer.

```text
Browser
  |
  | React Router pages and components
  v
src/App.jsx
  |
  | Supabase helper functions
  v
Supabase PostgreSQL

Browser
  |
  | /api/send-otp, /api/forgot-password, /api/verify-otp
  v
Express OTP server
  |
  | SMTP
  v
Email inbox
```

## Technology Stack

Frontend:

- React 18
- Vite 5
- React Router DOM 7
- Lucide React icons
- React Leaflet and Leaflet for map/location experiences

Backend and data:

- Node.js
- Express 4
- Supabase JavaScript client 2
- Supabase PostgreSQL
- Nodemailer
- CORS
- dotenv

Development:

- ESLint 9
- concurrently for running frontend and backend together

## Runtime Architecture

```text
npm run dev
  |
  +-- npm run start:server
  |     |
  |     +-- server/index.js
  |           +-- Express JSON API on PORT or 4000
  |           +-- Nodemailer SMTP transport
  |           +-- In-memory OTP store
  |
  +-- vite
        |
        +-- src/main.jsx
              |
              +-- src/App.jsx
                    |
                    +-- React Router routes
                    +-- BottomNav for employee pages
                    +-- SideNav for employee pages
```

Most database reads and writes use Supabase directly from the browser through helper functions. The helper layer applies the project's most important tenant rule: every company-scoped query must include `company_id`.

## Repository Structure

```text
.
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   |-- supabaseClient.js
|   |-- supabaseHelpers.js
|   |-- components/
|   |   |-- BottomNav.jsx
|   |   |-- SideNav.jsx
|   |   `-- landing/
|   |-- pages/
|   |   |-- Login.jsx
|   |   |-- Register.jsx
|   |   |-- CheckIn.jsx
|   |   |-- CheckOut.jsx
|   |   |-- DailyTimesheet.jsx
|   |   |-- AttendanceHistory.jsx
|   |   |-- AttendanceResult.jsx
|   |   |-- MyAllocation.jsx
|   |   |-- Profile.jsx
|   |   |-- admin/
|   |   `-- employee/
|-- server/
|   `-- index.js
|-- supabase_schema.sql
|-- database_alter_queries.sql
|-- ARCHITECTURE_AND_FLOW.md
`-- ADVANCED_FEATURES.md
```

## Multi-Tenant Data Model

The application is designed around company isolation. Each company has its own users, customers, projects, allocations, attendance, payroll, leave, and configuration records.

```text
company_master
  |
  +-- admin_master
  +-- employee_master
  +-- branch_master
  +-- company_configuration
  +-- customer_master
  +-- project_master
  +-- employee_project_allocation
  +-- attendance_checkin_checkout
  +-- leave_master
  +-- payroll_master
  +-- employee_payroll_record
  +-- payslip_master
  +-- tax_declaration
  +-- notifications
```

Tenant boundary rule:

- Admin state stores `company_id` in `localStorage.adminData`.
- Employee state stores `company_id` and `employee_id` in `localStorage.employeeData`.
- Company-scoped helper functions filter by `company_id`.
- Employee-scoped helper functions filter by both `company_id` and `employee_id` where applicable.

Example helper pattern:

```text
getCompanyEmployees(company_id)
  -> employee_master
  -> where company_id = current company

getEmployeeAttendance(company_id, employee_id, from_date, to_date)
  -> attendance_checkin_checkout
  -> where company_id = current company
  -> where employee_id = current employee
```

## Routing and Navigation

Routes are defined in `src/App.jsx`.

Public and auth routes:

| Route | Page |
| --- | --- |
| `/` | Login |
| `/login` | Login |
| `/register` | Register |
| `/register-company` | CreateCompany |
| `/result` | AttendanceResult |

Employee routes:

| Route | Page |
| --- | --- |
| `/dashboard` | EmployeeDashboard |
| `/allocation` | MyAllocation |
| `/checkin` | CheckIn |
| `/checkout` | CheckOut |
| `/timesheet` | DailyTimesheet |
| `/attendance` | AttendanceHistory |
| `/profile` | Profile |
| `/employee/dashboard` | EmployeeDashboard |
| `/employee/analysis` | EmployeeAnalysis |
| `/employee/calendar` | AttendanceCalendar |
| `/employee/allocation` | MyAllocation |
| `/employee/checkin` | CheckIn |
| `/employee/checkout` | CheckOut |
| `/employee/timesheet` | DailyTimesheet |
| `/employee/attendance` | AttendanceHistory |
| `/employee/profile` | EmployeeProfile |
| `/employee/payslips` | PayslipDownload |
| `/employee/leave` | LeaveApplication |

Admin routes:

| Route | Page |
| --- | --- |
| `/admin` | AdminMenu |
| `/admin/review` | AdminReview |
| `/admin/monthly-review` | MonthlyAttendanceReview |
| `/admin/daily-checkin` | DailyCheckInList |
| `/admin/customer` | CustomerList |
| `/admin/customer/create` | CreateCustomer |
| `/admin/customer/edit/:id` | EditCustomer |
| `/admin/project` | ProjectList |
| `/admin/project/create` | CreateProject |
| `/admin/employee` | EmployeeList |
| `/admin/employee/create` | CreateEmployee |
| `/admin/employee/edit/:id` | EditEmployee |
| `/admin/allocate` | AllocateProject |
| `/admin/leave` | LeaveAllocation |
| `/admin/leave-approval` | LeaveApproval |
| `/admin/payroll-tax` | PayrollTaxManagement |
| `/admin/performance` | PerformanceAnalysis |
| `/admin/performance/employee/:id` | EmployeeAnalysis |

Navigation behavior:

- Employee pages show `SideNav`, mobile menu button, and `BottomNav`.
- Public, result, and admin pages hide employee navigation.
- Admin pages use the admin menu and admin-specific page navigation.

## Core User Flows

### Authentication Flow

```text
User opens / or /login
  |
  +-- Selects admin login
  |     |
  |     +-- loginAdmin(loginId, password)
  |     +-- Save result to localStorage.adminData
  |     +-- Navigate to /admin
  |
  +-- Selects employee login
        |
        +-- loginEmployee(employee_id/email, password)
        +-- Save result to localStorage.employeeData
        +-- Navigate to /dashboard or /employee/dashboard
```

Password reset uses the OTP API and then updates the matching admin or employee password through `resetPasswordByEmail`.

### Company Registration Flow

```text
/register-company
  |
  +-- registerCompany(companyData, adminData)
        |
        +-- insert company_master
        +-- insert admin_master
        +-- update company_master.admin_id
        +-- optionally insert branch_master
        +-- insert company_configuration defaults
```

### Admin Management Flow

```text
/admin
  |
  +-- Customers
  |     +-- list, create, edit
  |
  +-- Projects
  |     +-- list, create
  |
  +-- Employees
  |     +-- list, create, edit, delete
  |
  +-- Allocations
  |     +-- assign employees to projects
  |
  +-- Attendance
  |     +-- daily check-in list
  |     +-- review attendance
  |     +-- monthly review
  |
  +-- Leave
  |     +-- allocate leave
  |     +-- approve/reject requests
  |
  +-- Payroll and tax
        +-- payroll setup/status
        +-- salary calculation
        +-- payslip generation
        +-- tax declarations
```

### Employee Attendance Flow

```text
/employee/checkin or /checkin
  |
  +-- read employeeData from localStorage
  +-- get current allocation/customer/project context
  +-- capture location/time
  +-- checkInEmployee(company_id, attendanceData)
  +-- save latestAttendanceResult
  +-- navigate to /result

/employee/checkout or /checkout
  |
  +-- read employeeData from localStorage
  +-- capture checkout location/time
  +-- checkOutEmployee(company_id, employee_id, date, outData)
  +-- save latestAttendanceResult
  +-- navigate to /result
```

### Employee Self-Service Flow

```text
/employee/dashboard
  |
  +-- attendance summary
  +-- allocation entry points
  +-- check-in/check-out entry points
  +-- leave, calendar, profile, payslip, tax declaration pages
```

Self-service pages use `employeeData` from local storage and call Supabase helper functions with `company_id` and `employee_id`.

### Leave Flow

```text
Admin allocates leave
  -> allocateLeave(company_id, leaveData)

Employee requests leave
  -> requestLeave(company_id, leaveData)

Admin reviews leave
  -> getAllCompanyLeaves(company_id)
  -> updateLeaveStatus(company_id, leave_id, status)
```

### Payroll and Tax Flow

```text
Admin payroll setup
  -> setupPayrollIntegration(company_id, payrollData)
  -> createPayrollRecord(company_id, payrollRecord)
  -> calculateEmployeeSalary(company_id, employee_id, salary_month)
  -> generatePayslip(company_id, employee_id, salary_month, generatedBy)

Employee payslip access
  -> getEmployeePayslipsForSelfService(company_id, employee_id)
  -> recordPayslipAccess(company_id, employee_id, payslip_id)

Employee tax declaration
  -> submitTaxDeclaration(company_id, employee_id, declarationData)

Admin tax review
  -> getCompanyTaxDeclarations(company_id)
```

## Data Access Layer

`src/supabaseHelpers.js` is the central business/data-access module. It groups operations around these areas:

- Company and admin registration
- Admin and employee login
- Password reset
- Employee, customer, project, and branch management
- Project allocation
- Attendance check-in/check-out, timesheet, history, and admin review
- Notifications
- Leave allocation, requests, and approvals
- Payroll setup, salary calculation, records, payslips, and bank transfer batches
- Company configuration
- Salary rules and dynamic payroll calculation
- Employee lifecycle and exit settlement
- Compliance and tax declarations
- Role permissions
- Subscription, integration, and biometric configuration

Key helper groups:

| Area | Representative helpers |
| --- | --- |
| Auth | `loginAdmin`, `loginEmployee`, `resetPasswordByEmail` |
| Company setup | `registerCompany`, `getCompanyConfiguration`, `updateCompanyConfiguration` |
| Employees | `getCompanyEmployees`, `createCompanyEmployee`, `getEmployeeById`, `updateCompanyEmployee`, `deleteCompanyEmployee` |
| Customers/projects | `getCompanyCustomers`, `createCompanyCustomer`, `updateCompanyCustomer`, `getCompanyProjects`, `createCompanyProject` |
| Allocation | `allocateEmployeeToProject`, `getEmployeeAllocations`, `getEmployeeCurrentAllocation`, `getActiveAllocationsForDate` |
| Attendance | `checkInEmployee`, `checkOutEmployee`, `getEmployeeAttendance`, `getEmployeeTimesheet`, `getAttendanceForAdminReview`, `updateAttendanceStatus`, `getCompanyMonthlyAttendance` |
| Leave | `allocateLeave`, `getEmployeeLeaves`, `requestLeave`, `getAllCompanyLeaves`, `updateLeaveStatus` |
| Payroll | `setupPayrollIntegration`, `createPayrollRecord`, `calculateEmployeeSalary`, `generatePayslip`, `getEmployeePayslips` |
| Tax | `submitTaxDeclaration`, `getEmployeeTaxDeclarations`, `getCompanyTaxDeclarations` |
| RBAC | `checkUserPermission`, `assignRoleToUser` |

## Backend API

The Express server in `server/index.js` exposes three JSON endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/send-otp` | Send a verification OTP email |
| POST | `/api/forgot-password` | Send a forgot-password OTP email |
| POST | `/api/verify-otp` | Verify an OTP for an email and purpose |

OTP behavior:

- OTPs are six numeric digits.
- OTPs expire after 10 minutes.
- OTPs are stored in memory as `${email}:${purpose}`.
- A cleanup interval removes expired OTPs every minute.
- SMTP settings are read from environment variables.

Environment variables used by the server:

```text
PORT
EMAIL_USER
EMAIL_PASS
EMAIL_HOST
EMAIL_PORT
```

## Security and State

Current state model:

- Admin session data is stored in `localStorage.adminData`.
- Employee session data is stored in `localStorage.employeeData`.
- The latest attendance confirmation is stored in `localStorage.latestAttendanceResult`.
- The app currently uses helper-based credential checks against `admin_master` and `employee_master`.

Important implementation notes:

- Password values are compared directly in the current helper code. Production should hash and verify passwords with a server-side authentication flow.
- Supabase access happens from the browser. Production should enforce row-level security policies in Supabase, especially around `company_id`.
- The OTP store is in memory. OTPs are lost when the server restarts and are not shared across multiple server instances.
- Route-level guards are not centralized in `App.jsx`; pages rely on local state checks and stored user data.

## Operational Notes

Common commands:

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run start:server
```

Build and deployment shape:

```text
Frontend
  -> Vite build output in dist/

Backend
  -> Node process running server/index.js

Database
  -> Supabase schema maintained by supabase_schema.sql and database_alter_queries.sql
```

Suggested documentation maintenance checklist:

- Update the route table whenever `src/App.jsx` changes.
- Update helper groups when new exports are added to `src/supabaseHelpers.js`.
- Update backend endpoints when `server/index.js` changes.
- Update database tables when `supabase_schema.sql` or `database_alter_queries.sql` changes.
