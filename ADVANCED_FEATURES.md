# NESTHR Advanced Features Documentation

## Overview
This document outlines the advanced HR and payroll features implemented in NESTHR, including rule-based salary engines, employee lifecycle management, payroll workflows, compliance tracking, and employee self-service portal.

---

## 1. Rule-Based Salary Engine ⚙️

### Features
- **Dynamic Salary Calculation**: No hardcoded rules - everything is configurable
- **Salary Templates**: Create different templates per company (Basic, Senior, Contract, Intern)
- **Conditional Rules**: IF-THEN salary rules (e.g., IF salary > 50k THEN apply different PF rule)
- **Formula Builder**: Define custom calculation formulas for deductions and allowances

### Database Tables
- `salary_rule_template`: Define salary structure templates per company
- `salary_calculation_rule`: Dynamic rules with conditions and formulas

### Example Usage
```javascript
// Create a salary template
const template = await supabaseHelpers.createSalaryRuleTemplate(companyId, {
  name: "Senior Management",
  type: "Senior",
  conditions: { salary_range: { min: 100000, max: 500000 } },
  formulas: { pf_percent: 12, esi_eligible: false }
});

// Add a rule
const rule = await supabaseHelpers.addSalaryCalculationRule(companyId, {
  templateId: template.template_id,
  name: "High Salary PF",
  type: "PF",
  condition: { salary_gt: 50000 },
  formula: "basic * 0.12"
});

// Calculate salary dynamically
const result = await supabaseHelpers.calculateSalaryDynamically(
  companyId, 
  employeeId, 
  salaryMonth
);
```

---

## 2. Employee Lifecycle Management 👥

### Lifecycle Events
1. **Onboarding**: Employee joins company
   - Document upload (Resume, KYC, etc.)
   - KYC verification
   - System access setup

2. **Confirmation**: Completion of probation period
   - Salary confirmation
   - Role confirmation
   - Approval workflow

3. **Promotion**: Salary and role changes
   - Old vs new designation tracking
   - Salary revision history
   - Approval workflow

4. **Exit**: Employee leaves company
   - Full & Final settlement calculation
   - Gratuity calculation
   - Document collection
   - Dues recovery

### Database Tables
- `employee_lifecycle`: Track all lifecycle events
- `exit_settlement`: Full & final settlement records

### Example Usage
```javascript
// Record promotion
await supabaseHelpers.recordLifecycleEvent(companyId, {
  employeeId: "EMP001",
  eventType: "Promotion",
  oldDesignation: "Developer",
  newDesignation: "Senior Developer",
  oldSalary: 500000,
  newSalary: 700000,
  eventDate: "2026-04-20"
});

// Record exit and settlement
await supabaseHelpers.recordEmployeeExit(companyId, {
  employeeId: "EMP001",
  exitDate: "2026-06-30",
  lastWorkingDay: "2026-06-28",
  reason: "Resignation",
  finalSalary: 58333,
  gratuity: 200000,
  bonusPayment: 100000,
  totalSettlement: 358333
});
```

---

## 3. Leave & Attendance Deep Integration 📅

### Leave Policy Configuration
- **Company-level policies**: Define leave policies per company
- **Monthly accrual**: Automatic monthly leave accrual
- **Carryforward rules**: Configurable carryforward limits
- **Encashment**: Enable/disable leave encashment

### Shift Management
- **Flexible shifts**: Define shift timings per company
- **Buffer times**: Grace period for punch-in/out
- **Night shift indicator**: Mark night shifts separately
- **Shift allocation**: Assign shifts to employees

### Holiday Calendar
- **Company holidays**: National, regional, restricted holidays
- **Branch-specific holidays**: Different holidays per branch
- **Holiday types**: National, Regional, Restricted, Optional

### Database Tables
- `leave_policy`: Leave policy configuration
- `shift_master`: Shift definitions
- `holiday_calendar`: Holiday master per company/branch

### Example Usage
```javascript
// Create leave policy
await supabaseHelpers.createLeavePolicy(companyId, {
  name: "Casual Leave Policy",
  leaveType: "Casual Leave",
  annualAllocation: 8,
  monthlyAccrual: 0.67,
  carryforwardLimit: 5,
  encashmentAllowed: true
});
```

---

## 4. Advanced Payroll Processing 💰

### Payroll Workflow
```
Draft → Ready for Review → Approved → Locked → Processed
```

### Approval Workflow
- Multi-level approvals based on payroll amount
- Role-based approvers (HR Manager, Finance Manager, Director)
- Configurable approval limits

### Features
- **Payroll Runs**: Monthly or special payroll runs
- **Draft mode**: Create and review payroll before finalization
- **Approval chain**: Multi-level approval workflow
- **Locking**: Lock payroll after approval to prevent changes
- **Rollback**: Ability to re-run or rollback payroll

### Database Tables
- `payroll_run`: Payroll processing workflow
- `payroll_approval_workflow`: Approval chain configuration

### Example Usage
```javascript
// Create payroll run
const run = await supabaseHelpers.createPayrollRun(companyId, {
  salaryMonth: "2026-03-01",
  runType: "Regular",
  totalEmployees: 50,
  createdBy: "hr@company.com"
});

// Update status through workflow
await supabaseHelpers.updatePayrollRunStatus(
  companyId, 
  run.run_id, 
  "Ready for Review", 
  "hr@company.com"
);

// Approve payroll
await supabaseHelpers.updatePayrollRunStatus(
  companyId, 
  run.run_id, 
  "Approved", 
  "finance@company.com"
);

// Lock and process
await supabaseHelpers.updatePayrollRunStatus(
  companyId, 
  run.run_id, 
  "Locked", 
  "director@company.com"
);

await supabaseHelpers.updatePayrollRunStatus(
  companyId, 
  run.run_id, 
  "Processed", 
  "finance@company.com"
);
```

---

## 5. Statutory Compliance (India) 📊

### Compliance Types
1. **PF Return Filing**: Provident Fund contributions and returns
2. **ESI Reports**: Employee State Insurance reports
3. **TDS Filing (Form 24Q)**: Income tax deducted and remitted
4. **Tax Declarations**: 80C, 80D, 80E, etc.
5. **ITR Filing**: Income Tax Return support

### Database Tables
- `compliance_filing`: Compliance filing tracking
- `tax_declaration`: Employee tax declarations (Section 80C, 80D, 80E)

### Example Usage
```javascript
// Record PF filing
await supabaseHelpers.recordComplianceFiling(companyId, {
  filingType: "PF_Return",
  filingMonth: "2026-01-31",
  dueDate: "2026-02-15",
  details: { employees: 50, amount: 500000 }
});

// Employee submits tax declaration
await supabaseHelpers.submitTaxDeclaration(companyId, employeeId, {
  financialYear: "2025-26",
  section80c: 150000, // Life Insurance, PPF, etc.
  section80d: 50000,  // Health Insurance
  section80e: 30000,  // Education Loan Interest
  otherDeductions: 10000
});
```

---

## 6. Role-Based Access Control 🔐

### Roles
1. **Super Admin**: Full system access
2. **Company Admin**: Company-level administration
3. **HR Manager**: Employee and payroll management
4. **Manager**: Team management and leave approval
5. **Employee**: Self-service access

### Permissions Structure
Each role can have permissions for:
- **Modules**: Payroll, Employees, Leave, Reports, Compliance, etc.
- **Actions**: Create, Read, Update, Delete, Approve, etc.

### Database Table
- `user_role_permission`: Granular role-based permissions

### Example Usage
```javascript
// Check if user has permission
const hasPermission = await supabaseHelpers.checkUserPermission(
  companyId,
  userId,
  "Payroll",
  "Approve"
);

// Assign role to user
await supabaseHelpers.assignRoleToUser(
  companyId,
  userId,
  "HR",
  ["Payroll", "Employees", "Leave", "Reports"]
);
```

---

## 7. Employee Self-Service Portal 📱

### Features
Employees can access their own portal at `/employee/dashboard`

#### Pages Available
1. **Dashboard**: Overview of earnings, leave balance, pending requests
2. **Payslips** (`/employee/payslips`):
   - View all payslips
   - Filter by year
   - Download payslip as PDF
   - View detailed salary breakdown

3. **Leave Application** (`/employee/leave`):
   - View leave balance for all leave types
   - Apply for leave with date range
   - Specify reason for leave
   - Track leave request status
   - View approval history

4. **Tax Declaration** (`/employee/tax-declaration`):
   - File tax declarations (Section 80C, 80D, 80E)
   - Upload supporting documents
   - View tax saving sections with limits
   - Submit declarations by deadline

5. **Profile** (`/employee/profile`):
   - View and update personal information
   - Update contact details
   - View salary structure
   - Update emergency contacts
   - Update bank details
   - View government IDs (Aadhar, PAN, UAN, ESI)

### Database Tables
- `employee_payslip_access`: Track payslip downloads
- `payslip_customization`: Customize payslip template

### Mobile-Friendly UI
- Responsive design for all screen sizes
- Sidebar navigation with toggle
- Touch-friendly buttons and inputs

---

## 8. Payslip Management 🧾

### Features
- **Payslip Generation**: Auto-generate payslips monthly
- **Customization**: Customize payslip template per company
- **Download**: Download payslips as PDF
- **Access Tracking**: Track when employees download payslips
- **Archive**: Store all historical payslips

### Database Tables
- `payslip_master`: Payslip records with salary breakdown
- `payslip_customization`: Company-specific payslip settings
- `employee_payslip_access`: Track downloads and access

---

## 9. Integrations 🔗

### Integration Types
1. **Accounting Software**
   - Tally
   - Zoho Books
   - QuickBooks

2. **Banking Systems**
   - NEFT/RTGS file generation
   - Bank APIs for salary transfer
   - Payment reconciliation

3. **Biometric Devices**
   - Biometric punch sync
   - Automatic attendance update
   - Real-time attendance tracking

4. **Communication**
   - Email notifications
   - SMS alerts
   - Payslip delivery

### Database Table
- `integration_config`: Third-party integration configuration

### Example Usage
```javascript
// Configure integration
await supabaseHelpers.configureIntegration(companyId, {
  name: "Zoho Books",
  type: "Accounting",
  endpoint: "https://api.zoho.com/books",
  apiKey: "your_api_key",
  apiSecret: "your_api_secret",
  isActive: true,
  syncFrequency: "Daily"
});

// Configure biometric device
await supabaseHelpers.configureBiometricDevice(companyId, {
  deviceName: "Main Gate Biometric",
  deviceCode: "BIO-001",
  location: "Ground Floor, Building A",
  apiEndpoint: "http://biometric-device.local:8080/api"
});
```

---

## 10. Multi-Company SaaS Architecture 🏢

### Subscription Plans
- **Starter**: Basic payroll for small companies
- **Professional**: Advanced features for mid-size companies
- **Enterprise**: Full feature set with custom integrations

### Subscription Management
- Plan selection during company registration
- Usage tracking (employees, payroll runs)
- Auto-renewal with billing
- Subscription upgrade/downgrade

### Features by Plan
```
Starter:
- Payroll calculation
- Attendance tracking
- Basic reports
- Up to 50 employees
- 12 payroll runs/year

Professional:
- Everything in Starter
- Leave management
- Tax declarations
- Advanced reports
- Up to 500 employees

Enterprise:
- Everything in Professional
- Custom rule-based engine
- Integrations
- Compliance filing
- Unlimited employees
```

### Database Tables
- `subscription_plan`: Plan definitions
- `company_subscription`: Company subscription tracking

### Example Usage
```javascript
// Subscribe company to plan
await supabaseHelpers.subscribeCompanyToPlan(
  companyId,
  planId,
  {
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    autoRenew: true
  }
);
```

---

## Implementation Checklist

### Database
- ✅ All tables created with proper indexes
- ✅ Multi-tenant isolation (company_id) on all queries
- ✅ Proper foreign keys and constraints

### Backend (supabaseHelpers.js)
- ✅ Rule-based salary calculation functions
- ✅ Employee lifecycle management
- ✅ Leave policy management
- ✅ Payroll workflow functions
- ✅ Compliance tracking
- ✅ Role-based access control
- ✅ Payslip access tracking
- ✅ Subscription management
- ✅ Integration configuration

### Frontend
- ✅ Employee Dashboard
- ✅ Payslip Download Page
- ✅ Leave Application Page
- ✅ Tax Declaration Page
- ✅ Employee Profile Page
- ✅ Routes configured in App.jsx

### Remaining Tasks
- [ ] Admin UI for Payroll Processing (Draft → Approve → Lock → Process)
- [ ] Admin UI for Rule Management (Create rules, templates)
- [ ] Admin UI for Compliance Filing
- [ ] Reports & Analytics Dashboard
- [ ] PDF generation for payslips
- [ ] Email notifications for payslip delivery
- [ ] Biometric device sync implementation
- [ ] Bank file generation (NEFT/RTGS)
- [ ] Zoho/Tally integration APIs
- [ ] SMS notifications

---

## Security Considerations

### Data Protection
- All payroll data is encrypted in database
- API keys and secrets are encrypted
- Multi-tenant isolation ensures data separation
- Row-level security (company_id) on all queries

### Access Control
- Role-based permissions for all operations
- Audit trail for all changes (planned)
- Two-factor authentication (planned)

### Compliance
- GDPR compliance for EU employees
- India-specific compliance (PF, ESI, TDS)
- Data retention policies

---

## Best Practices

### For Payroll Calculation
1. Always use rule-based engine instead of hardcoded values
2. Test rules with sample employees before applying
3. Maintain version history of rules
4. Document any custom formulas

### For Leave Management
1. Configure leave policies before employee onboarding
2. Set up holiday calendar at start of financial year
3. Configure shift details based on company requirements
4. Review carryforward policies annually

### For Compliance
1. File compliance documents on time
2. Keep supporting documents for 7 years
3. Schedule regular compliance checks
4. Train HR team on compliance requirements

---

## API Reference

### Salary Engine
```javascript
createSalaryRuleTemplate(companyId, templateData)
addSalaryCalculationRule(companyId, ruleData)
calculateSalaryDynamically(companyId, employeeId, salaryMonth)
```

### Employee Lifecycle
```javascript
recordLifecycleEvent(companyId, lifecycleData)
recordEmployeeExit(companyId, exitData)
```

### Leave & Payroll
```javascript
createLeavePolicy(companyId, policyData)
createPayrollRun(companyId, runData)
updatePayrollRunStatus(companyId, runId, newStatus, updatedBy)
```

### Compliance
```javascript
recordComplianceFiling(companyId, filingData)
submitTaxDeclaration(companyId, employeeId, declarationData)
```

### Access Control
```javascript
checkUserPermission(companyId, userId, moduleName, actionNeeded)
assignRoleToUser(companyId, userId, roleName, modules)
```

### Payslip & Portal
```javascript
recordPayslipAccess(companyId, employeeId, payslipId)
getEmployeePayslipsForSelfService(companyId, employeeId)
customizePayslipTemplate(companyId, customizationData)
```

### Integration
```javascript
subscribeCompanyToPlan(companyId, planId, subscriptionData)
configureIntegration(companyId, integrationData)
configureBiometricDevice(companyId, biometricData)
```

---

## Support & Documentation
For more information, refer to:
- Database schema: [database_alter_queries.sql](./database_alter_queries.sql)
- Helper functions: [supabaseHelpers.js](./src/supabaseHelpers.js)
- Employee pages: [src/pages/employee/](./src/pages/employee/)
