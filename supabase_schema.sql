-- ===================================================================
-- NESTHR APP - MULTI-TENANT DATABASE SCHEMA
-- ===================================================================
-- KEY CONCEPT: Each company is completely isolated
-- Admin AA's company (AA) -> only sees AA's employees, customers, projects
-- Admin BB's company (BB) -> only sees BB's employees, customers, projects
-- ===================================================================

-- 0. COMPANY MASTER - Top level organization
CREATE TABLE company_master (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    website VARCHAR(255),
    industry_type VARCHAR(100),
    employee_count INTEGER,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    admin_id VARCHAR(50), -- Primary admin for this company
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1. ADMIN MASTER - Company Admins (one admin = one company initially)
CREATE TABLE admin_master (
    admin_id VARCHAR(50) PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    admin_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) UNIQUE NOT NULL,
    admin_phone VARCHAR(20),
    password_hash TEXT,
    role VARCHAR(50) DEFAULT 'Company Admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(company_id, admin_email)
);

-- 2. EMPLOYEE MASTER - Employees of a specific company
CREATE TABLE employee_master (
    employee_id VARCHAR(50) PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'Employee',
    password_hash TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(company_id, email) -- Email unique per company, not globally
);

-- 3. CUSTOMER MASTER - Customers of a specific company
CREATE TABLE customer_master (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius_meters INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(company_id, customer_name) -- Customer name unique per company
);

-- 4. PROJECT MASTER - Projects under a company's customers
CREATE TABLE project_master (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id) ON DELETE CASCADE,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    expected_hours_per_day DECIMAL(5, 2),
    overtime_allowed BOOLEAN DEFAULT false,
    remarks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(company_id, project_code) -- Project code unique per company
);

-- 5. EMPLOYEE PROJECT ALLOCATION - Assign employees to projects
CREATE TABLE employee_project_allocation (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES project_master(project_id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE,
    planned_days INTEGER,
    expected_hours_per_day DECIMAL(5, 2),
    start_time TIME,
    end_time TIME,
    radius_meters INTEGER DEFAULT 400,
    allocation_status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Inactive', 'Completed'
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. ATTENDANCE CHECKIN CHECKOUT - Daily attendance tracking
CREATE TABLE attendance_checkin_checkout (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES project_master(project_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    in_time TIMESTAMP WITH TIME ZONE,
    out_time TIMESTAMP WITH TIME ZONE,
    in_selfie TEXT, -- URL to storage
    out_selfie TEXT, -- URL to storage
    in_latitude DECIMAL(10, 8),
    in_longitude DECIMAL(11, 8),
    out_latitude DECIMAL(10, 8),
    out_longitude DECIMAL(11, 8),
    in_distance INTEGER, -- Distance from site in meters
    out_distance INTEGER,
    gps_match_status VARCHAR(50), -- 'Matched', 'Invalid Location'
    total_worked_hours DECIMAL(5, 2),
    overtime_hours DECIMAL(5, 2),
    attendance_status VARCHAR(50), -- 'Present', 'Absent', 'Half-day'
    employee_remark TEXT,
    admin_remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(company_id, employee_id, attendance_date) -- One check-in per employee per day
);

-- 7. EMPLOYEE CUSTOMER LOCK - Lock employee access during disputes
CREATE TABLE employee_customer_lock (
    lock_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_master(customer_id) ON DELETE CASCADE,
    project_id UUID REFERENCES project_master(project_id) ON DELETE SET NULL,
    lock_reason TEXT,
    lock_from TIMESTAMP WITH TIME ZONE,
    lock_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    locked_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. TIMESHEET APPROVAL - Approve/reject timesheets
CREATE TABLE timesheet_approval (
    approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    attendance_id UUID NOT NULL REFERENCES attendance_checkin_checkout(attendance_id) ON DELETE CASCADE,
    approved_hours DECIMAL(5, 2),
    approved_ot_hours DECIMAL(5, 2),
    approval_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    approved_by VARCHAR(50),
    approval_date TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Company data lookups
CREATE INDEX idx_employee_company ON employee_master(company_id);
CREATE INDEX idx_customer_company ON customer_master(company_id);
CREATE INDEX idx_project_company ON project_master(company_id);
CREATE INDEX idx_allocation_company ON employee_project_allocation(company_id);
CREATE INDEX idx_attendance_company ON attendance_checkin_checkout(company_id);
CREATE INDEX idx_lock_company ON employee_customer_lock(company_id);
CREATE INDEX idx_approval_company ON timesheet_approval(company_id);

-- Employee lookups
CREATE INDEX idx_employee_email ON employee_master(company_id, email);
CREATE INDEX idx_allocation_employee ON employee_project_allocation(employee_id);
CREATE INDEX idx_attendance_employee ON attendance_checkin_checkout(employee_id, attendance_date);

-- Admin lookups
CREATE INDEX idx_admin_company ON admin_master(company_id);
CREATE INDEX idx_admin_email ON admin_master(admin_email);

-- Project lookups
CREATE INDEX idx_project_customer ON project_master(customer_id);
CREATE INDEX idx_allocation_project ON employee_project_allocation(project_id);
CREATE INDEX idx_attendance_project ON attendance_checkin_checkout(project_id);

-- Date range queries
CREATE INDEX idx_attendance_date_range ON attendance_checkin_checkout(company_id, attendance_date);
CREATE INDEX idx_allocation_date_range ON employee_project_allocation(company_id, from_date, to_date);

-- ===================================================================
-- IMPORTANT RULES FOR BACKEND
-- ===================================================================
-- 1. ALWAYS filter by company_id in WHERE clause
-- 2. When employee logs in -> fetch their company_id first
-- 3. When admin views data -> only show their company's data
-- 4. Use RLS (Row Level Security) policies if using Supabase Auth
-- 5. No data should cross companies
-- ===================================================================

-- ===================================================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================================================
-- Since we're using custom authentication, we'll create permissive policies
-- In production, replace with proper auth-based policies

-- Enable RLS on all tables
ALTER TABLE company_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_project_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_checkin_checkout ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_customer_lock ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_approval ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development (allow all operations)
-- In production, replace with proper authentication-based policies

CREATE POLICY "Allow all operations on company_master" ON company_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on admin_master" ON admin_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on employee_master" ON employee_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on customer_master" ON customer_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on project_master" ON project_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on employee_project_allocation" ON employee_project_allocation FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on attendance_checkin_checkout" ON attendance_checkin_checkout FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on employee_customer_lock" ON employee_customer_lock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on timesheet_approval" ON timesheet_approval FOR ALL USING (true) WITH CHECK (true);

-- ===================================================================
-- NESTHR DATABASE - ALTER QUERIES FOR NEW FEATURES
-- ===================================================================


-- 1. ADD FIELDS TO COMPANY_MASTER (License Number & Company Logo)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_master' AND column_name = 'license_number') THEN
        ALTER TABLE company_master ADD COLUMN license_number VARCHAR(100) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_master' AND column_name = 'company_logo') THEN
        ALTER TABLE company_master ADD COLUMN company_logo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_master' AND column_name = 'registration_date') THEN
        ALTER TABLE company_master ADD COLUMN registration_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_master' AND column_name = 'gst_number') THEN
        ALTER TABLE company_master ADD COLUMN gst_number VARCHAR(20);
    END IF;
END $$;

-- 2. CREATE BRANCH_MASTER TABLE (Branch Management)
CREATE TABLE IF NOT EXISTS branch_master (
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    branch_code VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    branch_head VARCHAR(255),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(company_id, branch_code)
);

CREATE INDEX IF NOT EXISTS idx_branch_company ON branch_master(company_id);

-- 3. ADD FIELDS TO EMPLOYEE_MASTER (Enhanced Employee Information)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'employee_identity_number') THEN
        ALTER TABLE employee_master ADD COLUMN employee_identity_number VARCHAR(50) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'punching_recognition_number') THEN
        ALTER TABLE employee_master ADD COLUMN punching_recognition_number VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'designation') THEN
        ALTER TABLE employee_master ADD COLUMN designation VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'date_of_birth') THEN
        ALTER TABLE employee_master ADD COLUMN date_of_birth DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'aadhar_number') THEN
        ALTER TABLE employee_master ADD COLUMN aadhar_number VARCHAR(20) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'date_of_joining') THEN
        ALTER TABLE employee_master ADD COLUMN date_of_joining DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'cadre') THEN
        ALTER TABLE employee_master ADD COLUMN cadre VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'branch_id') THEN
        ALTER TABLE employee_master ADD COLUMN branch_id UUID REFERENCES branch_master(branch_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'department') THEN
        ALTER TABLE employee_master ADD COLUMN department VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'gender') THEN
        ALTER TABLE employee_master ADD COLUMN gender VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'marital_status') THEN
        ALTER TABLE employee_master ADD COLUMN marital_status VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'father_name') THEN
        ALTER TABLE employee_master ADD COLUMN father_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'mother_name') THEN
        ALTER TABLE employee_master ADD COLUMN mother_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'permanent_address') THEN
        ALTER TABLE employee_master ADD COLUMN permanent_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'current_address') THEN
        ALTER TABLE employee_master ADD COLUMN current_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE employee_master ADD COLUMN emergency_contact_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'emergency_contact_number') THEN
        ALTER TABLE employee_master ADD COLUMN emergency_contact_number VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'employment_type') THEN
        ALTER TABLE employee_master ADD COLUMN employment_type VARCHAR(50) DEFAULT 'Full-time';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'basic_salary') THEN
        ALTER TABLE employee_master ADD COLUMN basic_salary DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'hra') THEN
        ALTER TABLE employee_master ADD COLUMN hra DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'da') THEN
        ALTER TABLE employee_master ADD COLUMN da DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'special_allowance') THEN
        ALTER TABLE employee_master ADD COLUMN special_allowance DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'bonus_incentives') THEN
        ALTER TABLE employee_master ADD COLUMN bonus_incentives DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'overtime_rate') THEN
        ALTER TABLE employee_master ADD COLUMN overtime_rate DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'ctc') THEN
        ALTER TABLE employee_master ADD COLUMN ctc DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'pf_number') THEN
        ALTER TABLE employee_master ADD COLUMN pf_number VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_master' AND column_name = 'esi_number') THEN
        ALTER TABLE employee_master ADD COLUMN esi_number VARCHAR(50);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employee_branch ON employee_master(branch_id);
CREATE INDEX IF NOT EXISTS idx_employee_identity ON employee_master(employee_identity_number);
CREATE INDEX IF NOT EXISTS idx_employee_aadhar ON employee_master(aadhar_number);

-- 4. ADD FIELDS TO CUSTOMER_MASTER (Company Logo & Branch Info)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_master' AND column_name = 'customer_logo') THEN
        ALTER TABLE customer_master ADD COLUMN customer_logo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_master' AND column_name = 'customer_contact_person') THEN
        ALTER TABLE customer_master ADD COLUMN customer_contact_person VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_master' AND column_name = 'customer_contact_email') THEN
        ALTER TABLE customer_master ADD COLUMN customer_contact_email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_master' AND column_name = 'customer_contact_phone') THEN
        ALTER TABLE customer_master ADD COLUMN customer_contact_phone VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_master' AND column_name = 'gst_number') THEN
        ALTER TABLE customer_master ADD COLUMN gst_number VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_master' AND column_name = 'industry_type') THEN
        ALTER TABLE customer_master ADD COLUMN industry_type VARCHAR(100);
    END IF;
END $$;

-- 5. UPDATE PROJECT_MASTER (Add Start/End Time Instead of Just Dates)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_master' AND column_name = 'start_time') THEN
        ALTER TABLE project_master ADD COLUMN start_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_master' AND column_name = 'end_time') THEN
        ALTER TABLE project_master ADD COLUMN end_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_master' AND column_name = 'project_location') THEN
        ALTER TABLE project_master ADD COLUMN project_location TEXT;
    END IF;
END $$;

-- Drop the old customer_id foreign key if it exists and we want to make it optional
-- ALTER TABLE project_master ALTER COLUMN customer_id DROP NOT NULL;

-- 6. CREATE LEAVE_MASTER TABLE (For Leave Allocation with 5 Options)
CREATE TABLE IF NOT EXISTS leave_master (
    leave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    leave_type VARCHAR(100) NOT NULL, -- 'Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Unpaid Leave'
    allotted_days DECIMAL(10, 2) NOT NULL,
    used_days DECIMAL(10, 2) DEFAULT 0,
    balance_days DECIMAL(10, 2),
    from_date DATE,
    to_date DATE,
    approval_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    approved_by VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leave_company ON leave_master(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_master(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_master(approval_status);

-- 7. CREATE PAYROLL_MASTER TABLE (For Payroll Integration)
CREATE TABLE IF NOT EXISTS payroll_master (
    payroll_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    payroll_service_provider VARCHAR(100) NOT NULL, -- 'Zoho', 'ADP', 'BambooHR', 'Internal'
    api_key TEXT,
    api_secret TEXT,
    integration_status VARCHAR(50) DEFAULT 'Active',
    last_sync_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payroll_company ON payroll_master(company_id);

-- 8. CREATE EMPLOYEE_PAYROLL_RECORD TABLE (For Employee Payroll Records)
CREATE TABLE IF NOT EXISTS employee_payroll_record (
    payroll_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    payroll_id UUID REFERENCES payroll_master(payroll_id) ON DELETE SET NULL,
    salary_month DATE NOT NULL,
    ctc DECIMAL(12, 2),
    basic_salary DECIMAL(12, 2),
    hra DECIMAL(12, 2),
    da DECIMAL(12, 2),
    special_allowance DECIMAL(12, 2),
    bonus_incentives DECIMAL(12, 2),
    gross_salary DECIMAL(12, 2),
    overtime_amount DECIMAL(12, 2),
    total_earnings DECIMAL(12, 2),
    pf_amount DECIMAL(12, 2),
    esi_amount DECIMAL(12, 2),
    professional_tax DECIMAL(12, 2),
    tds_amount DECIMAL(12, 2),
    other_deductions DECIMAL(12, 2) DEFAULT 0,
    total_deductions DECIMAL(12, 2),
    net_salary DECIMAL(12, 2),
    payout_reference VARCHAR(255),
    bank_transfer_status VARCHAR(50) DEFAULT 'Pending',
    payroll_notes TEXT,
    salary_details JSONB,
    payment_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Processed', 'Paid'
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(company_id, employee_id, salary_month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_record_company ON employee_payroll_record(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_record_employee ON employee_payroll_record(employee_id);

-- 9. UPDATE ATTENDANCE TABLE (Add Branch Field and payroll tracking)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_checkin_checkout' AND column_name = 'branch_id') THEN
        ALTER TABLE attendance_checkin_checkout ADD COLUMN branch_id UUID REFERENCES branch_master(branch_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_checkin_checkout' AND column_name = 'late_entry') THEN
        ALTER TABLE attendance_checkin_checkout ADD COLUMN late_entry BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_checkin_checkout' AND column_name = 'half_day') THEN
        ALTER TABLE attendance_checkin_checkout ADD COLUMN half_day BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_checkin_checkout' AND column_name = 'leave_type') THEN
        ALTER TABLE attendance_checkin_checkout ADD COLUMN leave_type VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_checkin_checkout' AND column_name = 'absent_reason') THEN
        ALTER TABLE attendance_checkin_checkout ADD COLUMN absent_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_checkin_checkout' AND column_name = 'salary_credit') THEN
        ALTER TABLE attendance_checkin_checkout ADD COLUMN salary_credit DECIMAL(12, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_checkin_checkout' AND column_name = 'salary_deduction') THEN
        ALTER TABLE attendance_checkin_checkout ADD COLUMN salary_deduction DECIMAL(12, 2);
    END IF;
END $$;

-- 10. UPDATE ALLOCATION TABLE (Add Branch Field)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_project_allocation' AND column_name = 'branch_id') THEN
        ALTER TABLE employee_project_allocation ADD COLUMN branch_id UUID REFERENCES branch_master(branch_id) ON DELETE SET NULL;
    END IF;
END $$;

-- 11. CREATE COMPANY_CONFIGURATION TABLE (For App Settings)
CREATE TABLE IF NOT EXISTS company_configuration (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id_prefix VARCHAR(10) DEFAULT 'NES',
    employee_id_format VARCHAR(50) DEFAULT 'SHORT', -- 'SHORT' (4 digits) or 'LONG'
    attendance_geofence_radius INTEGER DEFAULT 100,
    punch_in_time TIME,
    punch_out_time TIME,
    working_days_per_week INTEGER DEFAULT 5,
    weekend_type VARCHAR(50) DEFAULT 'Saturday-Sunday',
    enable_payroll_sync BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_company_config ON company_configuration(company_id);

-- 12. CREATE PAYSLIP_MASTER TABLE (For Payslip Generation)
CREATE TABLE IF NOT EXISTS payslip_master (
    payslip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    salary_month DATE NOT NULL,
    gross_salary DECIMAL(12, 2),
    total_earnings DECIMAL(12, 2),
    total_deductions DECIMAL(12, 2),
    net_salary DECIMAL(12, 2),
    generated_by VARCHAR(255),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    payslip_url TEXT,
    salary_details JSONB,
    UNIQUE(company_id, employee_id, salary_month)
);

CREATE INDEX IF NOT EXISTS idx_payslip_company ON payslip_master(company_id);
CREATE INDEX IF NOT EXISTS idx_payslip_employee ON payslip_master(employee_id);

-- 13. CREATE BANK_TRANSFER_BATCH TABLE (For Bulk Payout)
CREATE TABLE IF NOT EXISTS bank_transfer_batch (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    salary_month DATE NOT NULL,
    batch_reference VARCHAR(255) UNIQUE,
    total_employees INTEGER,
    total_amount DECIMAL(14, 2),
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bank_batch_company ON bank_transfer_batch(company_id);

-- ===================================================================
-- ADVANCED PAYROLL & HR FEATURES - PART 2
-- ===================================================================

-- 14. CREATE SALARY_RULE_TEMPLATE TABLE (For Rule-Based Engine)
CREATE TABLE IF NOT EXISTS salary_rule_template (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50), -- 'Basic', 'Senior', 'Contract', 'Intern'
    is_active BOOLEAN DEFAULT true,
    rule_conditions JSONB, -- Stores: {salary_range: {min: 50000, max: 100000}, rules: [...]}
    formula_config JSONB, -- Stores salary calculation formulas
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_salary_template_company ON salary_rule_template(company_id);

-- 15. CREATE SALARY_CALCULATION_RULE TABLE (For Dynamic Rule Engine)
CREATE TABLE IF NOT EXISTS salary_calculation_rule (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    template_id UUID REFERENCES salary_rule_template(template_id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100), -- 'PF', 'ESI', 'TDS', 'HRA', 'DA', 'Bonus', 'Custom'
    condition_json JSONB, -- IF salary > 50000 THEN apply rule X
    calculation_formula VARCHAR(500), -- Formula like: basic * 0.12 OR basic + hra - pf
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_salary_rule_company ON salary_calculation_rule(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_rule_template ON salary_calculation_rule(template_id);

-- 16. CREATE EMPLOYEE_LIFECYCLE TABLE (Onboarding, Promotion, Exit)
CREATE TABLE IF NOT EXISTS employee_lifecycle (
    lifecycle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    event_type VARCHAR(50), -- 'Onboarding', 'Confirmation', 'Promotion', 'Salary Revision', 'Exit'
    old_designation VARCHAR(255),
    new_designation VARCHAR(255),
    old_salary DECIMAL(12, 2),
    new_salary DECIMAL(12, 2),
    event_date DATE NOT NULL,
    documents_uploaded JSONB, -- {resume: url, kyc: url, etc}
    approval_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    approved_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_company ON employee_lifecycle(company_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_employee ON employee_lifecycle(employee_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_event ON employee_lifecycle(event_type);

-- 17. CREATE EXIT_SETTLEMENT TABLE (Full & Final Settlement)
CREATE TABLE IF NOT EXISTS exit_settlement (
    settlement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    exit_date DATE NOT NULL,
    last_working_day DATE,
    reason_for_exit VARCHAR(255),
    final_salary DECIMAL(12, 2),
    gratuity DECIMAL(12, 2),
    bonus_payment DECIMAL(12, 2),
    other_payments DECIMAL(12, 2),
    total_settlement DECIMAL(12, 2),
    recovery_amount DECIMAL(12, 2),
    net_payment DECIMAL(12, 2),
    settlement_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Processed', 'Paid'
    documents JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_settlement_company ON exit_settlement(company_id);
CREATE INDEX IF NOT EXISTS idx_settlement_employee ON exit_settlement(employee_id);

-- 18. CREATE LEAVE_POLICY TABLE (Company-wise Leave Configuration)
CREATE TABLE IF NOT EXISTS leave_policy (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    policy_name VARCHAR(255) NOT NULL,
    leave_type VARCHAR(100), -- 'Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Unpaid Leave'
    annual_allocation INTEGER,
    monthly_accrual DECIMAL(5, 2),
    carryforward_limit INTEGER DEFAULT 5,
    encashment_allowed BOOLEAN DEFAULT true,
    notice_period INTEGER DEFAULT 1, -- days
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leave_policy_company ON leave_policy(company_id);

-- 19. CREATE SHIFT_MASTER TABLE (Shift Configuration)
CREATE TABLE IF NOT EXISTS shift_master (
    shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    shift_name VARCHAR(100) NOT NULL,
    shift_code VARCHAR(20),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    working_hours DECIMAL(4, 2),
    buffer_in_time INTEGER, -- minutes before start time
    buffer_out_time INTEGER, -- minutes after end time
    is_night_shift BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shift_company ON shift_master(company_id);

-- 20. CREATE HOLIDAY_CALENDAR TABLE (Holiday Master per Company)
CREATE TABLE IF NOT EXISTS holiday_calendar (
    holiday_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(255),
    holiday_type VARCHAR(50), -- 'National', 'Regional', 'Restricted', 'Optional'
    branch_id UUID REFERENCES branch_master(branch_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(company_id, holiday_date, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_holiday_company ON holiday_calendar(company_id);
CREATE INDEX IF NOT EXISTS idx_holiday_date ON holiday_calendar(holiday_date);

-- 21. CREATE PAYROLL_RUN TABLE (Payroll Processing Workflow)
CREATE TABLE IF NOT EXISTS payroll_run (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    salary_month DATE NOT NULL,
    run_type VARCHAR(50) DEFAULT 'Regular', -- 'Regular', 'Special', 'Arrears'
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Ready for Review', 'Approved', 'Locked', 'Processed'
    total_employees INTEGER,
    total_amount DECIMAL(14, 2),
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    locked_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payroll_run_company ON payroll_run(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_run_status ON payroll_run(status);

-- 22. CREATE PAYROLL_APPROVAL_WORKFLOW TABLE (Approval Chain Configuration)
CREATE TABLE IF NOT EXISTS payroll_approval_workflow (
    workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    workflow_stage INTEGER, -- 1: HR Review, 2: Finance Review, 3: Director Approval
    approver_role VARCHAR(50), -- 'HR_MANAGER', 'FINANCE_MANAGER', 'DIRECTOR'
    approval_limit DECIMAL(14, 2), -- Applies only for payroll > this limit
    is_required BOOLEAN DEFAULT true,
    sequence_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workflow_company ON payroll_approval_workflow(company_id);

-- 23. CREATE COMPLIANCE_FILING TABLE (Statutory Compliance Tracking)
CREATE TABLE IF NOT EXISTS compliance_filing (
    filing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    filing_type VARCHAR(100), -- 'PF_Return', 'ESI_Return', 'TDS_Form24Q', 'ITR', 'Form_80C'
    filing_month DATE,
    due_date DATE,
    filing_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Filed', 'Accepted', 'Rejected'
    filing_reference VARCHAR(255),
    document_url TEXT,
    filed_by VARCHAR(255),
    filed_at TIMESTAMP WITH TIME ZONE,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_compliance_company ON compliance_filing(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_filing(filing_type);

-- 24. CREATE USER_ROLE_PERMISSION TABLE (Granular Access Control)
CREATE TABLE IF NOT EXISTS user_role_permission (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    role_name VARCHAR(100), -- 'Super Admin', 'Company Admin', 'HR', 'Manager', 'Employee'
    module_name VARCHAR(100), -- 'Payroll', 'Employees', 'Leave', 'Reports', 'Compliance'
    action_allowed VARCHAR(50), -- 'Create', 'Read', 'Update', 'Approve', 'Delete'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_role_company ON user_role_permission(company_id);
CREATE INDEX IF NOT EXISTS idx_role_user ON user_role_permission(user_id);

-- 25. CREATE SUBSCRIPTION_PLAN TABLE (SaaS Multi-Company Support)
CREATE TABLE IF NOT EXISTS subscription_plan (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(100), -- 'Starter', 'Professional', 'Enterprise'
    plan_type VARCHAR(50) DEFAULT 'Annual',
    price DECIMAL(10, 2),
    max_employees INTEGER,
    max_payroll_runs INTEGER DEFAULT 12,
    modules_included JSONB, -- {payroll: true, reports: true, compliance: false}
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 26. CREATE COMPANY_SUBSCRIPTION TABLE (Link Company to Subscription)
CREATE TABLE IF NOT EXISTS company_subscription (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES company_master(company_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plan(plan_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Expired', 'Cancelled', 'Suspended'
    auto_renew BOOLEAN DEFAULT true,
    employees_used INTEGER DEFAULT 0,
    payroll_runs_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_company_subscription ON company_subscription(company_id);

-- 27. CREATE INTEGRATION_CONFIG TABLE (Third-party Integration Configuration)
CREATE TABLE IF NOT EXISTS integration_config (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    integration_name VARCHAR(100), -- 'Tally', 'Zoho Books', 'ICICI Bank', 'Biometric System', 'Email/SMS'
    integration_type VARCHAR(50), -- 'Accounting', 'Banking', 'Biometric', 'Communication'
    api_endpoint TEXT,
    api_key TEXT,
    api_secret TEXT,
    is_active BOOLEAN DEFAULT false,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_frequency VARCHAR(50) DEFAULT 'Daily', -- 'Real-time', 'Hourly', 'Daily', 'Weekly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_integration_company ON integration_config(company_id);

-- 28. CREATE PAYSLIP_CUSTOMIZATION TABLE (Customize Payslip Template per Company)
CREATE TABLE IF NOT EXISTS payslip_customization (
    customization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES company_master(company_id) ON DELETE CASCADE,
    payslip_header TEXT,
    payslip_footer TEXT,
    logo_url TEXT,
    show_bank_details BOOLEAN DEFAULT true,
    show_uan_number BOOLEAN DEFAULT true,
    show_pan_number BOOLEAN DEFAULT true,
    custom_fields JSONB, -- Additional fields to display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 29. CREATE EMPLOYEE_PAYSLIP_ACCESS TABLE (Track Payslip Downloads by Employee)
CREATE TABLE IF NOT EXISTS employee_payslip_access (
    access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    payslip_id UUID REFERENCES payslip_master(payslip_id) ON DELETE CASCADE,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payslip_access_employee ON employee_payslip_access(employee_id);

-- 30. CREATE TAX_DECLARATION TABLE (Employee Tax Declaration Form)
CREATE TABLE IF NOT EXISTS tax_declaration (
    declaration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    financial_year VARCHAR(10),
    section_80c DECIMAL(12, 2) DEFAULT 0, -- Life Insurance, PPF
    section_80d DECIMAL(12, 2) DEFAULT 0, -- Health Insurance
    section_80e DECIMAL(12, 2) DEFAULT 0, -- Education Loan Interest
    other_deductions DECIMAL(12, 2) DEFAULT 0,
    documents JSONB,
    submission_date DATE,
    status VARCHAR(50) DEFAULT 'Submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tax_declaration_company ON tax_declaration(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_declaration_employee ON tax_declaration(employee_id);

-- 31. CREATE BIOMETRIC_INTEGRATION TABLE (Biometric Device Configuration)
CREATE TABLE IF NOT EXISTS biometric_integration (
    biometric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    device_code VARCHAR(50),
    device_location VARCHAR(255),
    api_endpoint TEXT,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'Inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_biometric_company ON biometric_integration(company_id);

-- ===================================================================
-- SUMMARY OF ALL CHANGES
-- ===================================================================
-- This script is now SAFE TO RUN MULTIPLE TIMES - it checks for existing columns/tables
-- PART 1 (Previous):
-- 1. company_master: Added license_number, company_logo, registration_date, gst_number
-- 2. branch_master: New table for branch management
-- 3. employee_master: Added 15+ fields for comprehensive employee information including salary structure
-- 4. customer_master: Added logo, contact, and GST info
-- 5. project_master: Added start_time, end_time, project_location
-- 6. leave_master: New table for leave allocation (5 leave types available)
-- 7. payroll_master: New table for payroll service integration
-- 8. employee_payroll_record: New table for payroll records with earnings, deductions, PF/ESI/TDS
-- 9. attendance_checkin_checkout: Added branch_id, late_entry, half_day, leave_type, salary credit/deduction
-- 10. employee_project_allocation: Added branch_id reference
-- 11. company_configuration: New table for company settings
-- 12. payslip_master: New table for payslip generation and reporting
-- 13. bank_transfer_batch: New table for payroll payout batch processing
-- PART 2 (Advanced Features):
-- 14. salary_rule_template: Rule-based engine for different salary templates per company
-- 15. salary_calculation_rule: Dynamic salary calculation rules (IF-THEN conditions, formulas)
-- 16. employee_lifecycle: Employee onboarding, promotion, confirmation, exit tracking
-- 17. exit_settlement: Full & final settlement records
-- 18. leave_policy: Company-wise leave policy configuration with accrual rules
-- 19. shift_master: Shift management with flexible timings
-- 20. holiday_calendar: Holiday master per company and branch
-- 21. payroll_run: Payroll processing workflow (Draft → Review → Approve → Lock → Process)
-- 22. payroll_approval_workflow: Approval chain configuration with role-based workflow
-- 23. compliance_filing: Statutory compliance tracking (PF, ESI, TDS, ITR, etc.)
-- 24. user_role_permission: Granular role-based access control (Super Admin, Company Admin, HR, Manager, Employee)
-- 25. subscription_plan: SaaS subscription plans with different features and limits
-- 26. company_subscription: Link company to subscription plan with usage tracking
-- 27. integration_config: Third-party integrations (Accounting, Banking, Biometric, Communication)
-- 28. payslip_customization: Customize payslip template per company
-- 29. employee_payslip_access: Track payslip downloads and access by employees
-- 30. tax_declaration: Employee tax declaration form (80C, 80D, 80E, etc.)
-- 31. biometric_integration: Biometric device configuration and sync status
