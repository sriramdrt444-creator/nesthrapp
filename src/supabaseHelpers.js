// ===================================================================
// SUPABASE QUERY HELPERS - Multi-Tenant Database Operations
// ===================================================================
// KEY RULE: ALWAYS include company_id in WHERE clause
// This ensures data isolation between companies
// ===================================================================

import { supabase } from './supabaseClient';

// ===================================================================
// 1. COMPANY & ADMIN REGISTRATION
// ===================================================================

/**
 * Register a new company with admin account
 * Creates entries in: company_master + admin_master + employee_master (for admin)
 */
export const registerCompany = async (companyData, adminData) => {
  try {
    // 1. Create company record
    const { data: company, error: companyError } = await supabase
      .from('company_master')
      .insert({
        company_name: companyData.name,
        registration_number: companyData.registration_number,
        license_number: companyData.license_number,
        gst_number: companyData.gst_number,
        company_logo: companyData.company_logo,
        email: companyData.email,
        phone_number: companyData.phone,
        website: companyData.website,
        industry_type: companyData.industry,
        employee_count: companyData.employee_count,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        zip_code: companyData.zip_code,
        registration_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (companyError) throw companyError;

    const company_id = company.company_id;

    // 2. Generate admin ID
    const admin_id = `ADM-${Date.now()}`;

    // 3. Create admin account in admin_master
    const { error: adminError } = await supabase
      .from('admin_master')
      .insert({
        admin_id: admin_id,
        company_id: company_id,
        admin_name: adminData.name,
        admin_email: adminData.email,
        admin_phone: adminData.phone,
        password_hash: adminData.password, // Use bcrypt in production
        role: 'Company Admin',
      })
      .select()
      .single();

    if (adminError) throw adminError;

    // 4. Update company with admin_id reference
    await supabase
      .from('company_master')
      .update({ admin_id: admin_id })
      .eq('company_id', company_id);

    // 5. Create head branch if provided
    if (companyData.branch_name) {
      const branch_code = `BR-${company_id.substring(0, 4)}-001`;
      
      const { error: branchError } = await supabase
        .from('branch_master')
        .insert({
          company_id: company_id,
          branch_name: companyData.branch_name || 'Head Office',
          branch_code: branch_code,
          address: companyData.address,
          city: companyData.city,
          state: companyData.state,
          zip_code: companyData.zip_code,
          branch_head: companyData.branch_head,
          phone_number: companyData.phone,
        });

      if (branchError) console.error('Warning: Could not create branch', branchError);
    }

    // 6. Create default company configuration
    const { error: configError } = await supabase
      .from('company_configuration')
      .insert({
        company_id: company_id,
        employee_id_prefix: 'NES',
        employee_id_format: 'SHORT',
        attendance_geofence_radius: 100,
        punch_in_time: '09:00',
        punch_out_time: '18:00',
        working_days_per_week: 5,
        weekend_type: 'Saturday-Sunday',
        enable_payroll_sync: false,
      });

    if (configError) console.error('Warning: Could not create configuration', configError);

    return {
      success: true,
      company_id: company_id,
      admin_id: admin_id,
      message: `Company registered! Admin ID: ${adminData.email}`,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// 2. LOGIN & AUTHENTICATION
// ===================================================================

/**
 * Admin Login - Returns admin + company details
 * IMPORTANT: company_id is returned for all future queries
 */
const passwordsMatch = (storedPassword, enteredPassword) => {
  const stored = String(storedPassword ?? '').trim();
  const entered = String(enteredPassword ?? '').trim();
  return stored !== '' && stored === entered;
};

export const loginAdmin = async (loginId, password) => {
  try {
    const trimmedLoginId = String(loginId || '').trim();
    const trimmedPassword = String(password || '').trim();

    if (!trimmedLoginId || !trimmedPassword) {
      throw new Error('Login ID and password are required');
    }

    const isEmail = trimmedLoginId.includes('@');
    const normalizedCompanyId = trimmedLoginId.toUpperCase();
    const normalizedLoginId = trimmedLoginId.toLowerCase();

    let query = supabase
      .from('admin_master')
      .select('admin_id, company_id, admin_name, admin_email, password_hash, role');

    if (isEmail) {
      query = query.ilike('admin_email', normalizedLoginId);
    } else {
      query = query.eq('company_id', normalizedCompanyId);
    }

    const { data: admin, error } = await query.maybeSingle();

    if (error || !admin) {
      throw new Error('Invalid admin credentials');
    }

    if (!passwordsMatch(admin.password_hash, trimmedPassword)) {
      throw new Error('Invalid admin credentials');
    }

    const { data: company, error: companyError } = await supabase
      .from('company_master')
      .select('company_id, company_name')
      .eq('company_id', admin.company_id)
      .single();

    if (companyError || !company) {
      throw new Error('Unable to load company details');
    }

    return {
      success: true,
      admin_id: admin.admin_id,
      company_id: admin.company_id,
      admin_name: admin.admin_name,
      admin_email: admin.admin_email,
      company_name: company.company_name,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Employee Login - Returns employee + company details
 */
export const loginEmployee = async (employee_id, password) => {
  try {
    const trimmedLoginId = String(employee_id || '').trim();
    const trimmedPassword = String(password || '').trim();

    if (!trimmedLoginId || !trimmedPassword) {
      throw new Error('Login ID and password are required');
    }

    const isEmail = trimmedLoginId.includes('@');
    const normalizedEmployeeId = trimmedLoginId.toUpperCase();

    let query;

    if (isEmail) {
      query = supabase
        .from('employee_master')
        .select('*')
        .ilike('email', trimmedLoginId.toLowerCase());
    } else {
      query = supabase
        .from('employee_master')
        .select('*')
        .eq('employee_id', normalizedEmployeeId);
    }

    const { data: employee, error } = await query;

    // If we get multiple results, take the first one
    const employeeData = Array.isArray(employee) ? employee[0] : employee;

    if (error || !employeeData) {
      throw new Error('Invalid employee credentials');
    }

    if (!passwordsMatch(employeeData.password_hash, trimmedPassword)) {
      throw new Error('Invalid employee credentials');
    }

    const { data: company, error: companyError } = await supabase
      .from('company_master')
      .select('company_id, company_name')
      .eq('company_id', employeeData.company_id)
      .single();

    if (companyError || !company) {
      throw new Error('Unable to load company details');
    }

    const employeeName = employeeData.name || employeeData.employee_name || 'Employee';

    return {
      success: true,
      employee_id: employeeData.employee_id,
      company_id: employeeData.company_id,
      name: employeeName,
      employee_name: employeeName,
      email: employeeData.email,
      phone_number: employeeData.phone_number,
      designation: employeeData.designation,
      department: employeeData.department,
      date_of_joining: employeeData.date_of_joining,
      gender: employeeData.gender,
      current_address: employeeData.current_address,
      permanent_address: employeeData.permanent_address,
      emergency_contact_name: employeeData.emergency_contact_name,
      emergency_contact_number: employeeData.emergency_contact_number,
      bank_account_number: employeeData.bank_account_number,
      bank_name: employeeData.bank_name,
      ifsc_code: employeeData.ifsc_code,
      upi_id: employeeData.upi_id,
      aadhar_number: employeeData.aadhar_number,
      pan_number: employeeData.pan_number,
      pf_number: employeeData.pf_number,
      esi_number: employeeData.esi_number,
      role: employeeData.role,
      photo_url: employeeData.photo_url,
      company_name: company.company_name,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPasswordByEmail = async (email, newPassword) => {
  try {
    const { data: admin, error: adminError } = await supabase
      .from('admin_master')
      .select('admin_id')
      .eq('admin_email', email)
      .single();

    if (!adminError && admin) {
      const { error } = await supabase
        .from('admin_master')
        .update({ password_hash: newPassword })
        .eq('admin_email', email);

      if (error) throw error;
      return { success: true, userType: 'admin' };
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employee_master')
      .select('employee_id')
      .eq('email', email)
      .single();

    if (!employeeError && employee) {
      const { error } = await supabase
        .from('employee_master')
        .update({ password_hash: newPassword })
        .eq('email', email);

      if (error) throw error;
      return { success: true, userType: 'employee' };
    }

    throw new Error('Email not found');
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===================================================================
// 3. COMPANY-SPECIFIC QUERIES (ADMIN OPERATIONS)
// ===================================================================

/**
 * Get all employees of a company (NOT other companies!)
 * CRITICAL: Filtered by company_id
 */
/**
 * Get all employees of a company (NOT other companies!)
 * CRITICAL: Filtered by company_id
 * @param {string} company_id
 * @returns {Promise<{ success: boolean, employees: Array<{ employee_id: string, name: string, email: string, phone_number?: string, role?: string, is_active?: boolean }> }>} 
 */
export const getCompanyEmployees = async (company_id) => {
  try {
    const { data, error } = await supabase
      .from('employee_master')
      .select('*')
      .eq('company_id', company_id); // CRITICAL: Filter by company_id

    if (error) throw error;
    return { success: true, employees: data };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return { success: false, employees: [] };
  }
};

/**
 * Get all customers of a company (NOT other companies!)
 */
export const getCompanyCustomers = async (company_id) => {
  try {
    const { data, error } = await supabase
      .from('customer_master')
      .select('*')
      .eq('company_id', company_id); // CRITICAL: Filter by company_id

    if (error) throw error;
    return { success: true, customers: data };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { success: false, customers: [] };
  }
};

/**
 * Get all projects of a company
 */
export const getCompanyProjects = async (company_id) => {
  try {
    const { data, error } = await supabase
      .from('project_master')
      .select('*, customer_master(customer_name)')
      .eq('company_id', company_id); // CRITICAL: Filter by company_id

    if (error) throw error;
    return { success: true, projects: data };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return { success: false, projects: [] };
  }
};

/**
 * Get all tax declaration submissions for a company.
 */
export const getCompanyTaxDeclarations = async (company_id) => {
  try {
    const { data, error } = await supabase
      .from('tax_declaration')
      .select('*')
      .eq('company_id', company_id)
      .order('submission_date', { ascending: false });

    if (error) throw error;
    return { success: true, declarations: data };
  } catch (error) {
    console.error('Error fetching tax declarations:', error);
    return { success: false, declarations: [] };
  }
};

/**
 * Create employee in company
 */
export const createCompanyEmployee = async (company_id, employeeData) => {
  try {
    const employee_id = employeeData.employee_id || await generateEmployeeId(company_id);

    const { data, error } = await supabase
      .from('employee_master')
      .insert({
        employee_id: employee_id,
        company_id: company_id,
        name: employeeData.name,
        email: employeeData.email,
        phone_number: employeeData.phone_number,
        password_hash: employeeData.password,
        role: employeeData.role || 'Employee',
        // Professional Information
        designation: employeeData.designation || null,
        department: employeeData.department || null,
        cadre: employeeData.cadre || null,
        employment_type: employeeData.employment_type || 'Full-time',
        date_of_joining: employeeData.date_of_joining || null,
        basic_salary: employeeData.basic_salary || 0,
        hra: employeeData.hra || 0,
        da: employeeData.da || 0,
        special_allowance: employeeData.special_allowance || 0,
        bonus_incentives: employeeData.bonus_incentives || 0,
        overtime_rate: employeeData.overtime_rate || 0,
        ctc: employeeData.ctc || 0,
        pf_number: employeeData.pf_number || null,
        esi_number: employeeData.esi_number || null,
        // Identity Information
        employee_identity_number: employeeData.employee_identity_number || null,
        aadhar_number: employeeData.aadhar_number || null,
        punching_recognition_number: employeeData.punching_recognition_number || null,
        // Personal Information
        gender: employeeData.gender || null,
        date_of_birth: employeeData.date_of_birth || null,
        marital_status: employeeData.marital_status || null,
        // Address Information
        permanent_address: employeeData.permanent_address || null,
        current_address: employeeData.current_address || null,
        // Family Information
        father_name: employeeData.father_name || null,
        mother_name: employeeData.mother_name || null,
        // Emergency Contact
        emergency_contact_name: employeeData.emergency_contact_name || null,
        emergency_contact_number: employeeData.emergency_contact_number || null,
        // Branch Reference
        branch_id: employeeData.branch_id || null,
        photo_url: employeeData.photo_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating employee:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get full details of a single employee
 */
export const getEmployeeById = async (company_id, employee_id) => {
  try {
    const { data, error } = await supabase
      .from('employee_master')
      .select('*')
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .single();

    if (error) throw error;
    return { success: true, employee: data };
  } catch (error) {
    console.error('Error fetching employee details:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update employee details
 */
export const updateCompanyEmployee = async (company_id, employee_id, employeeData) => {
  try {
    const { data, error } = await supabase
      .from('employee_master')
      .update({
        name: employeeData.name,
        email: employeeData.email,
        phone_number: employeeData.phone_number,
        role: employeeData.role,
        designation: employeeData.designation,
        department: employeeData.department,
        cadre: employeeData.cadre,
        employment_type: employeeData.employment_type,
        date_of_joining: employeeData.date_of_joining,
        basic_salary: parseFloat(employeeData.basic_salary) || 0,
        hra: parseFloat(employeeData.hra) || 0,
        da: parseFloat(employeeData.da) || 0,
        special_allowance: parseFloat(employeeData.special_allowance) || 0,
        bonus_incentives: parseFloat(employeeData.bonus_incentives) || 0,
        overtime_rate: parseFloat(employeeData.overtime_rate) || 0,
        ctc: parseFloat(employeeData.ctc) || 0,
        pf_number: employeeData.pf_number,
        esi_number: employeeData.esi_number,
        employee_identity_number: employeeData.employee_identity_number,
        aadhar_number: employeeData.aadhar_number,
        punching_recognition_number: employeeData.punching_recognition_number,
        branch_id: employeeData.branch_id,
        gender: employeeData.gender,
        date_of_birth: employeeData.date_of_birth,
        marital_status: employeeData.marital_status,
        permanent_address: employeeData.permanent_address,
        current_address: employeeData.current_address,
        father_name: employeeData.father_name,
        mother_name: employeeData.mother_name,
        emergency_contact_name: employeeData.emergency_contact_name,
        emergency_contact_number: employeeData.emergency_contact_number,
        photo_url: employeeData.photo_url || null,
      })
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating employee:', error);
    return { success: false, error: error.message };
  }
};


/**
 * Delete employee from company
 */
export const deleteCompanyEmployee = async (company_id, employee_id) => {
  try {
    const { error } = await supabase
      .from('employee_master')
      .delete()
      .eq('company_id', company_id)
      .eq('employee_id', employee_id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create customer in company
 */
export const createCompanyCustomer = async (company_id, customerData) => {
  try {
    // Validate required fields
    if (!customerData.customer_name || !customerData.customer_name.trim()) {
      throw new Error('Customer name is required');
    }
    if (!customerData.address || !customerData.address.trim()) {
      throw new Error('Address is required');
    }
    if (customerData.latitude === null || customerData.latitude === undefined || isNaN(customerData.latitude)) {
      throw new Error('Valid latitude is required');
    }
    if (customerData.longitude === null || customerData.longitude === undefined || isNaN(customerData.longitude)) {
      throw new Error('Valid longitude is required');
    }

    const { data, error } = await supabase
      .from('customer_master')
      .insert({
        company_id: company_id,
        customer_name: String(customerData.customer_name || '').trim(),
        address: String(customerData.address || '').trim(),
        latitude: customerData.latitude,
        longitude: customerData.longitude,
        radius_meters: customerData.radius_meters || 100,
        // New fields
        customer_logo: customerData.customer_logo || null,
        customer_contact_person: customerData.customer_contact_person || null,
        customer_contact_email: customerData.customer_contact_email || null,
        customer_contact_phone: customerData.customer_contact_phone || null,
        gst_number: customerData.gst_number || null,
        industry_type: customerData.industry_type || null,
        status: customerData.status || 'Active',
        customer_branch: customerData.customer_branch || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating customer:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update customer details
 */
export const updateCompanyCustomer = async (company_id, customer_id, customerData) => {
  try {
    const { data, error } = await supabase
      .from('customer_master')
      .update({
        customer_name: customerData.customer_name,
        address: customerData.address,
        latitude: customerData.latitude,
        longitude: customerData.longitude,
        radius_meters: customerData.radius_meters,
        customer_contact_person: customerData.customer_contact_person,
        customer_contact_email: customerData.customer_contact_email,
        customer_contact_phone: customerData.customer_contact_phone,
        gst_number: customerData.gst_number,
        industry_type: customerData.industry_type,
        status: customerData.status,
        customer_branch: customerData.customer_branch,
      })
      .eq('company_id', company_id)
      .eq('customer_id', customer_id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, customer: data };
  } catch (error) {
    console.error('Error updating customer:', error);
    return { success: false, error: error.message };
  }
};


/**
 * Create project in company
 */
export const createCompanyProject = async (company_id, projectData) => {
  try {
    // Validate required fields
    if (!projectData.project_code || !projectData.project_code.trim()) {
      throw new Error('Project code is required');
    }
    if (!projectData.project_name || !projectData.project_name.trim()) {
      throw new Error('Project name is required');
    }

    const { data, error } = await supabase
      .from('project_master')
      .insert({
        company_id: company_id,
        customer_id: projectData.customer_id || null,
        project_code: projectData.project_code.trim(),
        project_name: projectData.project_name.trim(),
        start_date: projectData.start_date || null,
        end_date: projectData.end_date || null,
        start_time: projectData.start_time || null,
        end_time: projectData.end_time || null,
        project_location: projectData.project_location || null,
        expected_hours_per_day: projectData.expected_hours_per_day || projectData.expected_hours,
        created_by: projectData.created_by,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating project:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// 4. EMPLOYEE-SPECIFIC QUERIES
// ===================================================================

/**
 * Get employee's allocated projects (from employee's company only)
 */
export const getEmployeeAllocations = async (company_id, employee_id) => {
  try {
    const { data, error } = await supabase
      .from('employee_project_allocation')
      .select(`
        *,
        project:project_id(project_name, project_code, start_time, end_time),
        customer:customer_id(customer_name, latitude, longitude, radius_meters)
      `)
      .eq('company_id', company_id) // CRITICAL: Company filter
      .eq('employee_id', employee_id)
      .eq('allocation_status', 'Active');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching allocations:', error);
    return [];
  }
};

/**
 * Get today's active allocation for an employee, including customer location
 */
export const getEmployeeCurrentAllocation = async (company_id, employee_id, date) => {
  try {
    const { data, error } = await supabase
      .from('employee_project_allocation')
      .select(`
        *,
        project:project_id(project_name, project_code, start_time, end_time),
        customer:customer_id(customer_name, latitude, longitude, radius_meters)
      `)
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .or('allocation_status.eq.Active,allocation_status.is.null')
      .lte('from_date', date)
      .or(`to_date.is.null,to_date.gte.${date}`)
      .order('from_date', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching current allocation:', error);
    return null;
  }
};

export const checkOutEmployee = async (company_id, employee_id, attendance_date, outData) => {
  try {
    const { data, error } = await supabase
      .from('attendance_checkin_checkout')
      .update({
        out_time: outData.out_time,
        out_latitude: outData.out_latitude,
        out_longitude: outData.out_longitude,
        out_distance: outData.out_distance,
        out_selfie: outData.out_selfie,
        total_worked_hours: outData.total_worked_hours,
        overtime_hours: outData.overtime_hours,
        attendance_status: outData.attendance_status || 'Present',
      })
      .match({
        company_id,
        employee_id,
        attendance_date,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, attendance: data };
  } catch (error) {
    console.error('Error checking out employee:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all active employee allocations for a company on a specific date
 * Used for admin review to show all employees who should be working that day
 */
export const getActiveAllocationsForDate = async (company_id, date) => {
  try {
    const { data, error } = await supabase
      .from('employee_project_allocation')
      .select(`
        employee_id,
        customer_id,
        project_id,
        employee_master!inner(name),
        customer_master!inner(customer_name),
        project_master!inner(project_name)
      `)
      .eq('company_id', company_id)
      .eq('allocation_status', 'Active')
      .lte('from_date', date)
      .or(`to_date.is.null,to_date.gte.${date}`);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching active allocations for date:', error);
    return [];
  }
};

/**
 * Get employee's timesheet data grouped by weeks
 */
export const getEmployeeTimesheet = async (company_id, employee_id, weeksBack = 4) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weeksBack * 7));

    const { data, error } = await supabase
      .from('attendance_checkin_checkout')
      .select(`
        attendance_date,
        in_time,
        out_time,
        total_worked_hours,
        project:project_id(project_name, project_code),
        customer:customer_id(customer_name)
      `)
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .gte('attendance_date', startDate.toISOString().split('T')[0])
      .lte('attendance_date', endDate.toISOString().split('T')[0])
      .order('attendance_date', { ascending: false });

    if (error) throw error;

    // Group by months
    const months = {};
    data.forEach(record => {
      const date = new Date(record.attendance_date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!months[monthKey]) {
        months[monthKey] = {
          range: monthKey,
          entries: [],
          totalHours: 0
        };
      }
      
      const inTime = record.in_time ? new Date(record.in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--';
      const outTime = record.out_time ? new Date(record.out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--';
      const total = record.total_worked_hours ? `${Math.floor(record.total_worked_hours)}:${String(Math.round((record.total_worked_hours % 1) * 60)).padStart(2, '0')}:00` : '00:00:00';
      
      months[monthKey].entries.push({
        date: date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        start: inTime,
        end: outTime,
        total: total,
        category: 'Work',
        project: record.project ? `${record.project.project_name} - ${record.customer?.customer_name || ''}` : 'No project assigned'
      });
      
      months[monthKey].totalHours += record.total_worked_hours || 0;
    });

    // Convert to array and format total hours
    const result = Object.values(months).map(month => ({
      ...month,
      summary: `${Math.floor(month.totalHours)}:${String(Math.round((month.totalHours % 1) * 60)).padStart(2, '0')}:00`
    }));

    return result;
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    return [];
  }
};
export const getEmployeeAttendance = async (company_id, employee_id, from_date, to_date) => {
  try {
    const { data, error } = await supabase
      .from('attendance_checkin_checkout')
      .select('*')
      .eq('company_id', company_id) // CRITICAL: Company filter
      .eq('employee_id', employee_id)
      .gte('attendance_date', from_date)
      .lte('attendance_date', to_date);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
};

/**
 * Check-in employee (create or update attendance record)
 */
export const checkInEmployee = async (company_id, attendanceData) => {
  try {
    const { data, error } = await supabase
      .from('attendance_checkin_checkout')
      .upsert({
        company_id: company_id, // Always include company_id
        employee_id: attendanceData.employee_id,
        customer_id: attendanceData.customer_id,
        project_id: attendanceData.project_id,
        attendance_date: attendanceData.attendance_date,
        in_time: attendanceData.in_time,
        in_latitude: attendanceData.in_latitude,
        in_longitude: attendanceData.in_longitude,
        in_distance: attendanceData.in_distance,
        in_selfie: attendanceData.in_selfie,
        gps_match_status: attendanceData.gps_match_status,
        attendance_status: 'Present',
      }, {
        onConflict: 'company_id,employee_id,attendance_date'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error checking in:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// 6. NOTIFICATION SYSTEM
// ===================================================================

/**
 * Get notifications for an employee
 */
const getNotificationStorageKey = (company_id, employee_id) => {
  return `notifications_${company_id}_${employee_id}`;
};

export const getEmployeeNotifications = async (company_id, employee_id) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, notifications: data || [] };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, notifications: [] };
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (company_id, employee_id, notification_id) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification_id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read for an employee
 */
export const markAllNotificationsAsRead = async (company_id, employee_id) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a notification
 */
export const createNotification = async (company_id, employee_id, notificationData) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        company_id,
        employee_id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, notification: data };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify company ownership before allowing operations
 * Use this before any sensitive operation
 */
export const verifyCompanyOwnership = async (company_id, admin_id) => {
  try {
    const { error } = await supabase
      .from('admin_master')
      .select('company_id')
      .eq('admin_id', admin_id)
      .eq('company_id', company_id)
      .single();

    return !error;
  } catch (err) {
    return false;
  }
};

/**
 * Verify employee belongs to company
 */
export const verifyEmployeeInCompany = async (company_id, employee_id) => {
  try {
    const { data, error } = await supabase
      .from('employee_master')
      .select('company_id')
      .eq('employee_id', employee_id)
      .eq('company_id', company_id)
      .single();

    return !error;
  } catch (err) {
    return false;
  }
};

/**
 * Allocate an employee to a project
 * Creates entry in: employee_project_allocation
 */
export const allocateEmployeeToProject = async (company_id, allocationData) => {
  try {
    const { data, error } = await supabase
      .from('employee_project_allocation')
      .insert({
        company_id: company_id,
        employee_id: allocationData.employee_id,
        customer_id: allocationData.customer_id,
        project_id: allocationData.project_id,
        from_date: allocationData.from_date,
        to_date: allocationData.to_date,
        planned_days: allocationData.planned_days,
        expected_hours_per_day: allocationData.expected_hours_per_day,
        start_time: allocationData.start_time,
        end_time: allocationData.end_time,
        created_by: allocationData.created_by,
        allocation_status: 'Active',
      })
      .select();

    if (error) throw error;

    return { success: true, allocation: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance records for admin review on a specific date
 * Returns attendance data with employee, customer, and project details
 */
export const getAttendanceForAdminReview = async (company_id, date) => {
  try {
    const { data, error } = await supabase
      .from('attendance_checkin_checkout')
      .select(`
        attendance_id,
        employee_id,
        attendance_date,
        in_time,
        out_time,
        in_selfie,
        out_selfie,
        in_latitude,
        in_longitude,
        out_latitude,
        out_longitude,
        in_distance,
        out_distance,
        gps_match_status,
        attendance_status,
        employee_remark,
        admin_remark,
        employee_master!inner(name),
        customer_master!inner(customer_name),
        project_master!inner(project_name)
      `)
      .eq('company_id', company_id)
      .eq('attendance_date', date);

    if (error) throw error;

    // Transform data to match the expected format
    const transformedData = data.map(record => ({
      id: record.employee_id,
      name: record.employee_master.name,
      status: record.attendance_status || (record.in_time ? 'Present' : 'Absent'),
      inTime: record.in_time ? new Date(record.in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
      outTime: record.out_time ? new Date(record.out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
      customer: record.customer_master.customer_name,
      project: record.project_master.project_name,
      img: `https://ui-avatars.com/api/?name=${encodeURIComponent(record.employee_master.name)}`,
      selfie: record.in_selfie || null,
      checkoutSelfie: record.out_selfie || null,
      distance: record.out_distance ? `${record.out_distance} Meters` : (record.in_distance ? `${record.in_distance} Meters` : '-'),
      latitude: record.out_latitude || record.in_latitude || '-',
      longitude: record.out_longitude || record.in_longitude || '-',
      gpsMatchStatus: record.gps_match_status
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching attendance for review:', error);
    return [];
  }
};

/**
 * Get all attendance records for a company within a date range (Monthly Review)
 */
export const getCompanyMonthlyAttendance = async (company_id, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('attendance_checkin_checkout')
      .select('employee_id, attendance_date, attendance_status, in_time, employee_master(name)')
      .eq('company_id', company_id)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate);

    if (error) throw error;
    return { success: true, attendance: data };
  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    return { success: false, attendance: [] };
  }
};

/**
 * Update attendance status (Admin action for overrides)
 */
export const updateAttendanceStatus = async (company_id, employee_id, date, status, remark) => {
  try {
    const { data, error } = await supabase
      .from('attendance_checkin_checkout')
      .update({ 
        attendance_status: status,
        admin_remark: remark,
        gps_match_status: 'Manually Approved'
      })
      .match({
        company_id,
        employee_id,
        attendance_date: date
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, attendance: data };
  } catch (error) {
    console.error('Error updating attendance status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ===================================================================
 * BRANCH MANAGEMENT
 * ===================================================================
 */

/**
 * Get all branches of a company
 */
export const getCompanyBranches = async (company_id) => {
  try {
    const { data, error } = await supabase
      .from('branch_master')
      .select('*')
      .eq('company_id', company_id)
      .eq('is_active', true);

    if (error) throw error;
    return { success: true, branches: data };
  } catch (error) {
    console.error('Error fetching branches:', error);
    return { success: false, branches: [] };
  }
};

/**
 * Create a new branch
 */
export const createBranch = async (company_id, branchData) => {
  try {
    const { data, error } = await supabase
      .from('branch_master')
      .insert({
        company_id: company_id,
        branch_name: branchData.branch_name,
        branch_code: branchData.branch_code,
        address: branchData.address,
        city: branchData.city,
        state: branchData.state,
        zip_code: branchData.zip_code,
        branch_head: branchData.branch_head,
        phone_number: branchData.phone_number,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, branch: data };
  } catch (error) {
    console.error('Error creating branch:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ===================================================================
 * LEAVE MANAGEMENT
 * ===================================================================
 */

/**
 * Allocate leave to an employee
 */
export const allocateLeave = async (company_id, leaveData) => {
  try {
    const currentYear = new Date().getFullYear();
    const { data, error } = await supabase
      .from('leave_master')
      .insert({
        company_id: company_id,
        employee_id: leaveData.employee_id,
        leave_type: leaveData.leave_type,
        allotted_days: Number(leaveData.allotted_days || 0),
        balance_days: Number(leaveData.balance_days || leaveData.allotted_days || 0),
        used_days: 0,
        approval_status: 'Approved',
        from_date: `${currentYear}-01-01`,
        to_date: `${currentYear}-12-31`,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, leave: data };
  } catch (error) {
    console.error('Error allocating leave:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all leave records for an employee
 */
export const getEmployeeLeaves = async (company_id, employee_id) => {
  try {
    const { data, error } = await supabase
      .from('leave_master')
      .select('*')
      .eq('company_id', company_id)
      .eq('employee_id', employee_id);

    if (error) throw error;
    return { success: true, leaves: data };
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return { success: false, leaves: [] };
  }
};

/**
 * Request leave by employee
 */
export const requestLeave = async (company_id, leaveData) => {
  try {
    const { data, error } = await supabase
      .from('leave_master')
      .insert({
        company_id: company_id,
        employee_id: leaveData.employee_id,
        leave_type: leaveData.leave_type,
        from_date: leaveData.from_date,
        to_date: leaveData.to_date,
        used_days: leaveData.used_days || 0,
        allotted_days: 0,
        balance_days: 0,
        reason: leaveData.reason || null,
        approval_status: 'Pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, leave: data };
  } catch (error) {
    console.error('Error requesting leave:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get ALL leave records for a company (Admin view)
 */
export const getAllCompanyLeaves = async (company_id) => {
  try {
    const { data, error } = await supabase
      .from('leave_master')
      .select('*, employee_master(name)')
      .eq('company_id', company_id)
      .order('from_date', { ascending: false });

    if (error) throw error;
    return { success: true, leaves: data };
  } catch (error) {
    console.error('Error fetching company leaves:', error);
    return { success: false, leaves: [] };
  }
};

/**
 * Update leave approval status (Admin action)
 */
export const updateLeaveStatus = async (company_id, leave_id, status) => {
  try {
    const { data, error } = await supabase
      .from('leave_master')
      .update({ approval_status: status })
      .eq('company_id', company_id)
      .eq('leave_id', leave_id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, leave: data };
  } catch (error) {
    console.error('Error updating leave status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ===================================================================
 * EMPLOYEE ID GENERATION
 * ===================================================================
 */

/**
 * Generate employee ID based on company configuration
 */
export const generateEmployeeId = async (company_id, companyPrefix = 'NES') => {
  try {
    // Get current employee count
    const { data, error: countError } = await supabase
      .from('employee_master')
      .select('employee_id', { count: 'exact' })
      .eq('company_id', company_id);

    if (countError) throw countError;

    const empCount = (data?.length || 0) + 1;
    
    // Try to get company config for format preference
    const { data: config, error: configError } = await supabase
      .from('company_configuration')
      .select('employee_id_format')
      .eq('company_id', company_id)
      .single();

    const format = config?.employee_id_format || 'SHORT';
    
    // Generate ID based on format
    if (format === 'LONG') {
      // Long format: PREFIX-TIMESTAMP-NUMBER
      return `${companyPrefix}-${Date.now()}-${empCount}`;
    } else {
      // Short format: PREFIX + 4 digits
      const zeroPadded = String(empCount).padStart(4, '0');
      return `${companyPrefix}${zeroPadded}`;
    }
  } catch (error) {
    console.error('Error generating employee ID:', error);
    // Fallback to simple format
    return `${companyPrefix}${Date.now()}`;
  }
};

/**
 * ===================================================================
 * PAYROLL MANAGEMENT
 * ===================================================================
 */

/**
 * Setup payroll integration for a company
 */
export const setupPayrollIntegration = async (company_id, payrollData) => {
  try {
    const { data, error } = await supabase
      .from('payroll_master')
      .insert({
        company_id: company_id,
        payroll_service_provider: payrollData.provider,
        api_key: payrollData.api_key,
        api_secret: payrollData.api_secret,
        integration_status: 'Active',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, payroll: data };
  } catch (error) {
    console.error('Error setting up payroll:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get payroll status for a company
 */
export const getPayrollStatus = async (company_id) => {
  try {
    const { data, error } = await supabase
      .from('payroll_master')
      .select('*')
      .eq('company_id', company_id)
      .eq('integration_status', 'Active')
      .single();

    if (error) return { success: false, payroll: null };
    return { success: true, payroll: data };
  } catch (error) {
    console.error('Error fetching payroll status:', error);
    return { success: false, payroll: null };
  }
};

/**
 * Create employee payroll record
 */
export const createPayrollRecord = async (company_id, payrollRecord) => {
  try {
    const { data, error } = await supabase
      .from('employee_payroll_record')
      .insert({
        company_id: company_id,
        employee_id: payrollRecord.employee_id,
        salary_month: payrollRecord.salary_month,
        basic_salary: payrollRecord.basic_salary,
        hra: payrollRecord.hra,
        da: payrollRecord.da,
        allowances: payrollRecord.allowances || 0,
        deductions: payrollRecord.deductions || 0,
        net_salary: payrollRecord.net_salary,
        payment_status: 'Pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, record: data };
  } catch (error) {
    console.error('Error creating payroll record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate salary for an employee for a month
 */
export const calculateEmployeeSalary = async (company_id, employee_id, salary_month) => {
  try {
    if (!salary_month) {
      throw new Error('Salary month is required');
    }

    const [year, monthString] = salary_month.split('-');
    if (!year || !monthString) {
      throw new Error('Salary month must be in YYYY-MM format');
    }

    const month = parseInt(monthString, 10);
    const monthStart = `${year}-${monthString.padStart(2, '0')}-01`;
    const monthEnd = new Date(parseInt(year, 10), month, 0).toISOString().split('T')[0];

    const { data: employee, error: empError } = await supabase
      .from('employee_master')
      .select('basic_salary, hra, da, special_allowance, bonus_incentives, overtime_rate, ctc, date_of_joining')
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .single();

    if (empError || !employee) throw empError || new Error('Employee not found');

    const { data: attendance, error: attError } = await supabase
      .from('attendance_checkin_checkout')
      .select('attendance_date, attendance_status, overtime_hours, half_day, late_entry')
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .gte('attendance_date', monthStart)
      .lte('attendance_date', monthEnd);

    if (attError) throw attError;

    const daysInMonth = new Date(parseInt(year, 10), month, 0).getDate();
    const joinedDate = employee.date_of_joining ? new Date(employee.date_of_joining) : null;
    const joinFactor = joinedDate && joinedDate > new Date(monthEnd) ? 0 : (joinedDate && joinedDate > new Date(monthStart) ? ((daysInMonth - joinedDate.getDate() + 1) / daysInMonth) : 1);

    const presentDays = attendance.filter(row => row.attendance_status === 'Present').length;
    const halfDays = attendance.filter(row => row.attendance_status === 'Half Day' || row.half_day).length;
    const absentDays = attendance.filter(row => row.attendance_status === 'Absent').length;
    const overtimeHours = attendance.reduce((sum, row) => sum + (Number(row.overtime_hours) || 0), 0);

    const basicSalary = Number(employee.basic_salary || 0);
    const hra = Number(employee.hra || 0);
    const da = Number(employee.da || 0);
    const specialAllowance = Number(employee.special_allowance || 0);
    const bonusIncentives = Number(employee.bonus_incentives || 0);
    const overtimeRate = Number(employee.overtime_rate || 0);

    const grossSalary = basicSalary + hra + da + specialAllowance + bonusIncentives;
    const overtimeAmount = overtimeHours * overtimeRate;
    const proratedGross = grossSalary * joinFactor;
    const absentDeduction = ((grossSalary / daysInMonth) * absentDays) + ((grossSalary / daysInMonth) * 0.5 * halfDays);
    const totalEarnings = proratedGross + overtimeAmount;

    const pfAmount = Number((basicSalary * 0.12).toFixed(2));
    const esiAmount = Number((totalEarnings * 0.0175).toFixed(2));
    const professionalTax = 200;
    const tdsAmount = Number((totalEarnings * 0.1).toFixed(2));
    const totalDeductions = pfAmount + esiAmount + professionalTax + tdsAmount + absentDeduction;
    const netSalary = Number((totalEarnings - totalDeductions).toFixed(2));

    return {
      success: true,
      salary_month,
      employee_id,
      ctc: Number(employee.ctc || 0),
      gross_salary: Number(grossSalary.toFixed(2)),
      prorated_gross: Number(proratedGross.toFixed(2)),
      overtime_amount: Number(overtimeAmount.toFixed(2)),
      total_earnings: Number(totalEarnings.toFixed(2)),
      pf_amount: pfAmount,
      esi_amount: esiAmount,
      professional_tax: professionalTax,
      tds_amount: tdsAmount,
      absent_deduction: Number(absentDeduction.toFixed(2)),
      total_deductions: Number(totalDeductions.toFixed(2)),
      net_salary: netSalary,
      present_days: presentDays,
      half_days: halfDays,
      absent_days: absentDays,
      overtime_hours: overtimeHours,
      join_factor: Number(joinFactor.toFixed(4))
    };
  } catch (error) {
    console.error('Error calculating salary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create payslip record for the employee
 */
export const generatePayslip = async (company_id, employee_id, salary_month, generatedBy) => {
  try {
    const salaryResult = await calculateEmployeeSalary(company_id, employee_id, salary_month);
    if (!salaryResult.success) throw new Error(salaryResult.error || 'Salary calculation failed');

    const { data, error } = await supabase
      .from('payslip_master')
      .insert({
        company_id: company_id,
        employee_id: employee_id,
        salary_month: `${salary_month}-01`,
        gross_salary: salaryResult.gross_salary,
        total_earnings: salaryResult.total_earnings,
        total_deductions: salaryResult.total_deductions,
        net_salary: salaryResult.net_salary,
        generated_by: generatedBy,
        generated_at: new Date().toISOString(),
        salary_details: JSON.stringify(salaryResult)
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for employee
    await createNotification(company_id, employee_id, {
      title: 'New Payslip Generated',
      message: `Your payslip for ${salary_month} has been posted.`,
      type: 'payslip'
    });

    return { success: true, payslip: data, salaryResult };
  } catch (error) {
    console.error('Error generating payslip:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get company payslip records for an employee
 */
export const getEmployeePayslips = async (company_id, employee_id) => {
  try {
    const { data, error } = await supabase
      .from('payslip_master')
      .select('*')
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .order('salary_month', { ascending: false });

    if (error) throw error;
    return { success: true, payslips: data };
  } catch (error) {
    console.error('Error fetching payslips:', error);
    return { success: false, payslips: [] };
  }
};

/**
 * Record an absent day for an employee
 */
export const recordEmployeeAbsence = async (company_id, attendanceData) => {
  try {
    const { data, error } = await supabase
      .from('attendance_checkin_checkout')
      .insert({
        company_id: company_id,
        employee_id: attendanceData.employee_id,
        attendance_date: attendanceData.attendance_date,
        attendance_status: 'Absent',
        leave_type: attendanceData.leave_type || null,
        absent_reason: attendanceData.absent_reason || null,
        customer_id: attendanceData.customer_id || null,
        project_id: attendanceData.project_id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, absence: data };
  } catch (error) {
    console.error('Error recording absence:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a bank transfer batch for payroll payout
 */
export const createBankTransferBatch = async (company_id, batchData) => {
  try {
    const { data, error } = await supabase
      .from('bank_transfer_batch')
      .insert({
        company_id: company_id,
        salary_month: `${batchData.salary_month}-01`,
        batch_reference: batchData.batch_reference,
        total_employees: batchData.total_employees,
        total_amount: batchData.total_amount,
        status: batchData.status || 'Pending',
        file_url: batchData.file_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, batch: data };
  } catch (error) {
    console.error('Error creating bank transfer batch:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ===================================================================
 * COMPANY CONFIGURATION
 * ===================================================================
 */

/**
 * Get or create company configuration
 */
export const getCompanyConfiguration = async (company_id) => {
  try {
    const { data, error } = await supabase
      .from('company_configuration')
      .select('*')
      .eq('company_id', company_id)
      .single();

    if (!error && data) {
      return { success: true, config: data };
    }

    // Create default configuration if not exists
    const { data: newConfig, error: createError } = await supabase
      .from('company_configuration')
      .insert({
        company_id: company_id,
        employee_id_prefix: 'NES',
        employee_id_format: 'SHORT',
        attendance_geofence_radius: 100,
        punch_in_time: '09:00',
        punch_out_time: '18:00',
        working_days_per_week: 5,
        weekend_type: 'Saturday-Sunday',
        enable_payroll_sync: false,
      })
      .select()
      .single();

    if (createError) throw createError;
    return { success: true, config: newConfig };
  } catch (error) {
    console.error('Error getting company configuration:', error);
    return { success: false, config: null };
  }
};

/**
 * Update company configuration
 */
export const updateCompanyConfiguration = async (company_id, configData) => {
  try {
    const { data, error } = await supabase
      .from('company_configuration')
      .update({
        employee_id_prefix: configData.employee_id_prefix,
        employee_id_format: configData.employee_id_format,
        attendance_geofence_radius: configData.attendance_geofence_radius,
        punch_in_time: configData.punch_in_time,
        punch_out_time: configData.punch_out_time,
        working_days_per_week: configData.working_days_per_week,
        weekend_type: configData.weekend_type,
        enable_payroll_sync: configData.enable_payroll_sync,
      })
      .eq('company_id', company_id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, config: data };
  } catch (error) {
    console.error('Error updating company configuration:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// RULE-BASED SALARY ENGINE
// ===================================================================

/**
 * Create salary rule template for company
 * Allows different salary templates per company (Basic, Senior, Contract, Intern)
 */
export const createSalaryRuleTemplate = async (companyId, templateData) => {
  try {
    const { data, error } = await supabase
      .from('salary_rule_template')
      .insert({
        company_id: companyId,
        template_name: templateData.name,
        template_type: templateData.type,
        rule_conditions: templateData.conditions, // {salary_range, rules}
        formula_config: templateData.formulas,
        is_active: true,
        created_by: templateData.createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, template: data };
  } catch (error) {
    console.error('Error creating salary rule template:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add dynamic salary calculation rule
 * Example: IF salary > 50000 THEN apply different PF rule
 */
export const addSalaryCalculationRule = async (companyId, ruleData) => {
  try {
    const { data, error } = await supabase
      .from('salary_calculation_rule')
      .insert({
        company_id: companyId,
        template_id: ruleData.templateId,
        rule_name: ruleData.name,
        rule_type: ruleData.type, // PF, ESI, TDS, Custom
        condition_json: ruleData.condition, // IF condition
        calculation_formula: ruleData.formula, // Calculation expression
        priority: ruleData.priority || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, rule: data };
  } catch (error) {
    console.error('Error adding salary calculation rule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate salary dynamically based on rules
 * Evaluates all active rules and applies them
 */
export const calculateSalaryDynamically = async (companyId, employeeId, salaryMonth) => {
  try {
    // Get employee details
    const { data: employee, error: empError } = await supabase
      .from('employee_master')
      .select('*')
      .eq('company_id', companyId)
      .eq('employee_id', employeeId)
      .single();

    if (empError) throw empError;

    // Get applicable rules
    const { data: rules, error: rulesError } = await supabase
      .from('salary_calculation_rule')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (rulesError) throw rulesError;

    // Calculate salary with rule engine
    let salaryCalculation = {
      basic_salary: employee.basic_salary,
      hra: employee.hra,
      da: employee.da,
      special_allowance: employee.special_allowance,
      gross_salary: 0,
      pf_amount: 0,
      esi_amount: 0,
      professional_tax: 0,
      tds_amount: 0,
      net_salary: 0,
      applied_rules: [],
    };

    // Apply each rule based on conditions
    rules.forEach((rule) => {
      try {
        // Evaluate condition (simplified - in production use expression evaluator)
        if (rule.rule_type === 'PF' && employee.basic_salary > 15000) {
          salaryCalculation.pf_amount = employee.basic_salary * 0.12;
          salaryCalculation.applied_rules.push(rule.rule_name);
        } else if (rule.rule_type === 'ESI' && employee.basic_salary < 21000) {
          salaryCalculation.esi_amount = employee.basic_salary * 0.0075;
          salaryCalculation.applied_rules.push(rule.rule_name);
        } else if (rule.rule_type === 'TDS' && employee.basic_salary > 50000) {
          salaryCalculation.tds_amount = employee.basic_salary * 0.1;
          salaryCalculation.applied_rules.push(rule.rule_name);
        }
      } catch (e) {
        console.warn(`Error applying rule ${rule.rule_name}:`, e);
      }
    });

    // Calculate gross and net
    salaryCalculation.gross_salary =
      salaryCalculation.basic_salary +
      salaryCalculation.hra +
      salaryCalculation.da +
      salaryCalculation.special_allowance;

    const totalDeductions =
      salaryCalculation.pf_amount +
      salaryCalculation.esi_amount +
      salaryCalculation.professional_tax +
      salaryCalculation.tds_amount;

    salaryCalculation.net_salary = salaryCalculation.gross_salary - totalDeductions;

    return { success: true, calculation: salaryCalculation };
  } catch (error) {
    console.error('Error calculating salary dynamically:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// EMPLOYEE LIFECYCLE MANAGEMENT
// ===================================================================

/**
 * Record employee lifecycle event
 * (Onboarding, Confirmation, Promotion, Salary Revision, Exit)
 */
export const recordLifecycleEvent = async (companyId, lifecycleData) => {
  try {
    const { data, error } = await supabase
      .from('employee_lifecycle')
      .insert({
        company_id: companyId,
        employee_id: lifecycleData.employeeId,
        event_type: lifecycleData.eventType,
        old_designation: lifecycleData.oldDesignation,
        new_designation: lifecycleData.newDesignation,
        old_salary: lifecycleData.oldSalary,
        new_salary: lifecycleData.newSalary,
        event_date: lifecycleData.eventDate,
        documents_uploaded: lifecycleData.documents,
        approval_status: 'Pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, event: data };
  } catch (error) {
    console.error('Error recording lifecycle event:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record employee exit and full & final settlement
 */
export const recordEmployeeExit = async (companyId, exitData) => {
  try {
    const { data, error } = await supabase
      .from('exit_settlement')
      .insert({
        company_id: companyId,
        employee_id: exitData.employeeId,
        exit_date: exitData.exitDate,
        last_working_day: exitData.lastWorkingDay,
        reason_for_exit: exitData.reason,
        final_salary: exitData.finalSalary,
        gratuity: exitData.gratuity,
        bonus_payment: exitData.bonusPayment,
        total_settlement: exitData.totalSettlement,
        settlement_status: 'Pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, settlement: data };
  } catch (error) {
    console.error('Error recording employee exit:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// LEAVE POLICY & PAYROLL WORKFLOW
// ===================================================================

/**
 * Create leave policy for company
 */
export const createLeavePolicy = async (companyId, policyData) => {
  try {
    const { data, error } = await supabase
      .from('leave_policy')
      .insert({
        company_id: companyId,
        policy_name: policyData.name,
        leave_type: policyData.leaveType,
        annual_allocation: policyData.annualAllocation,
        monthly_accrual: policyData.monthlyAccrual,
        carryforward_limit: policyData.carryforwardLimit || 5,
        encashment_allowed: policyData.encashmentAllowed || true,
        notice_period: policyData.noticePeriod || 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, policy: data };
  } catch (error) {
    console.error('Error creating leave policy:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create payroll run (Monthly payroll processing)
 */
export const createPayrollRun = async (companyId, runData) => {
  try {
    const { data, error } = await supabase
      .from('payroll_run')
      .insert({
        company_id: companyId,
        salary_month: runData.salaryMonth,
        run_type: runData.runType || 'Regular',
        status: 'Draft', // Draft → Review → Approve → Lock → Process
        total_employees: runData.totalEmployees || 0,
        created_by: runData.createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, run: data };
  } catch (error) {
    console.error('Error creating payroll run:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update payroll run status through workflow
 * Draft → Ready for Review → Approved → Locked → Processed
 */
export const updatePayrollRunStatus = async (companyId, runId, newStatus, updatedBy) => {
  try {
    let updateData = { status: newStatus };

    if (newStatus === 'Ready for Review') {
      updateData.reviewed_by = updatedBy;
      updateData.reviewed_at = new Date().toISOString();
    } else if (newStatus === 'Approved') {
      updateData.approved_by = updatedBy;
      updateData.approved_at = new Date().toISOString();
    } else if (newStatus === 'Locked') {
      updateData.locked_at = new Date().toISOString();
    } else if (newStatus === 'Processed') {
      updateData.processed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('payroll_run')
      .update(updateData)
      .eq('run_id', runId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, run: data };
  } catch (error) {
    console.error('Error updating payroll run status:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// COMPLIANCE & TAX MANAGEMENT
// ===================================================================

/**
 * Track compliance filing (PF, ESI, TDS, ITR, etc.)
 */
export const recordComplianceFiling = async (companyId, filingData) => {
  try {
    const { data, error } = await supabase
      .from('compliance_filing')
      .insert({
        company_id: companyId,
        filing_type: filingData.filingType,
        filing_month: filingData.filingMonth,
        due_date: filingData.dueDate,
        filing_status: 'Pending',
        details: filingData.details,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, filing: data };
  } catch (error) {
    console.error('Error recording compliance filing:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Submit tax declaration from employee
 * Section 80C, 80D, 80E, etc.
 */
export const submitTaxDeclaration = async (companyId, employeeId, declarationData) => {
  try {
    const { data, error } = await supabase
      .from('tax_declaration')
      .insert({
        company_id: companyId,
        employee_id: employeeId,
        financial_year: declarationData.financialYear,
        section_80c: declarationData.section80c || 0,
        section_80d: declarationData.section80d || 0,
        section_80e: declarationData.section80e || 0,
        other_deductions: declarationData.otherDeductions || 0,
        documents: declarationData.documents,
        submission_date: new Date().toISOString().split('T')[0],
        status: 'Submitted',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, declaration: data };
  } catch (error) {
    console.error('Error submitting tax declaration:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get tax declarations for a specific employee
 */
export const getEmployeeTaxDeclarations = async (company_id, employee_id) => {
  try {
    const { data, error } = await supabase
      .from('tax_declaration')
      .select('*')
      .eq('company_id', company_id)
      .eq('employee_id', employee_id)
      .order('submission_date', { ascending: false });

    if (error) throw error;
    return { success: true, declarations: data };
  } catch (error) {
    console.error('Error fetching employee tax declarations:', error);
    return { success: false, declarations: [] };
  }
};

// ===================================================================
// ROLE-BASED ACCESS CONTROL
// ===================================================================

/**
 * Check if user has permission for specific action
 * Roles: Super Admin, Company Admin, HR, Manager, Employee
 */
export const checkUserPermission = async (companyId, userId, moduleName, actionNeeded) => {
  try {
    const { data, error } = await supabase
      .from('user_role_permission')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('module_name', moduleName)
      .eq('action_allowed', actionNeeded)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, hasPermission: !!data };
  } catch (error) {
    console.error('Error checking user permission:', error);
    return { success: false, hasPermission: false };
  }
};

/**
 * Assign role to user
 */
export const assignRoleToUser = async (companyId, userId, roleName, modules = []) => {
  try {
    const permissions = [];
    const commonActions = ['Read', 'Create', 'Update'];

    modules.forEach((moduleName) => {
      let allowedActions = commonActions;
      if (roleName === 'Super Admin') {
        allowedActions = ['Read', 'Create', 'Update', 'Delete', 'Approve'];
      } else if (roleName === 'HR') {
        allowedActions = moduleName === 'Payroll' ? ['Read', 'Create', 'Update', 'Approve'] : commonActions;
      } else if (roleName === 'Manager') {
        allowedActions = moduleName === 'Leave' ? ['Read', 'Approve'] : ['Read'];
      } else if (roleName === 'Employee') {
        allowedActions = ['Read'];
      }

      allowedActions.forEach((action) => {
        permissions.push({
          company_id: companyId,
          user_id: userId,
          role_name: roleName,
          module_name: moduleName,
          action_allowed: action,
          is_active: true,
        });
      });
    });

    const { data, error } = await supabase.from('user_role_permission').insert(permissions).select();

    if (error) throw error;
    return { success: true, permissions: data };
  } catch (error) {
    console.error('Error assigning role to user:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// PAYSLIP ACCESS & CUSTOMIZATION
// ===================================================================

/**
 * Track payslip download by employee
 */
export const recordPayslipAccess = async (companyId, employeeId, payslipId) => {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('employee_payslip_access')
      .select('*')
      .eq('company_id', companyId)
      .eq('employee_id', employeeId)
      .eq('payslip_id', payslipId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('employee_payslip_access')
        .update({
          download_count: (existing.download_count || 0) + 1,
          last_downloaded_at: new Date().toISOString(),
        })
        .eq('access_id', existing.access_id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, access: data };
    } else {
      const { data, error } = await supabase
        .from('employee_payslip_access')
        .insert({
          company_id: companyId,
          employee_id: employeeId,
          payslip_id: payslipId,
          download_count: 1,
          last_downloaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, access: data };
    }
  } catch (error) {
    console.error('Error recording payslip access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get employee payslips for self-service portal
 */
export const getEmployeePayslipsForSelfService = async (companyId, employeeId) => {
  try {
    const { data, error } = await supabase
      .from('payslip_master')
      .select('*')
      .eq('company_id', companyId)
      .eq('employee_id', employeeId)
      .order('salary_month', { ascending: false });

    if (error) throw error;
    return { success: true, payslips: data };
  } catch (error) {
    console.error('Error fetching employee payslips:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Customize payslip template for company
 */
export const customizePayslipTemplate = async (companyId, customizationData) => {
  try {
    const { data, error } = await supabase
      .from('payslip_customization')
      .upsert({
        company_id: companyId,
        payslip_header: customizationData.header,
        payslip_footer: customizationData.footer,
        logo_url: customizationData.logoUrl,
        show_bank_details: customizationData.showBankDetails,
        show_uan_number: customizationData.showUAN,
        show_pan_number: customizationData.showPAN,
        custom_fields: customizationData.customFields,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, customization: data };
  } catch (error) {
    console.error('Error customizing payslip template:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// SUBSCRIPTION & INTEGRATION MANAGEMENT
// ===================================================================

/**
 * Subscribe company to a plan
 */
export const subscribeCompanyToPlan = async (companyId, planId, subscriptionData) => {
  try {
    const { data, error } = await supabase
      .from('company_subscription')
      .insert({
        company_id: companyId,
        plan_id: planId,
        start_date: subscriptionData.startDate,
        end_date: subscriptionData.endDate,
        status: 'Active',
        auto_renew: subscriptionData.autoRenew || true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, subscription: data };
  } catch (error) {
    console.error('Error subscribing company to plan:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Configure third-party integration (Accounting, Banking, Biometric, Communication)
 */
export const configureIntegration = async (companyId, integrationData) => {
  try {
    const { data, error } = await supabase
      .from('integration_config')
      .insert({
        company_id: companyId,
        integration_name: integrationData.name,
        integration_type: integrationData.type,
        api_endpoint: integrationData.endpoint,
        api_key: integrationData.apiKey,
        api_secret: integrationData.apiSecret,
        is_active: integrationData.isActive || false,
        sync_frequency: integrationData.syncFrequency || 'Daily',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, integration: data };
  } catch (error) {
    console.error('Error configuring integration:', error);
    return { success: false, error: error.message };
  }
};

// ===================================================================
// BIOMETRIC INTEGRATION
// ===================================================================

/**
 * Configure biometric device for attendance sync
 */
export const configureBiometricDevice = async (companyId, biometricData) => {
  try {
    const { data, error } = await supabase
      .from('biometric_integration')
      .insert({
        company_id: companyId,
        device_name: biometricData.deviceName,
        device_code: biometricData.deviceCode,
        device_location: biometricData.location,
        api_endpoint: biometricData.apiEndpoint,
        sync_status: 'Inactive',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, device: data };
  } catch (error) {
    console.error('Error configuring biometric device:', error);
    return { success: false, error: error.message };
  }
};

export default {
  registerCompany,
  loginAdmin,
  loginEmployee,
  getCompanyEmployees,
  getEmployeeById,
  updateCompanyEmployee,
  getCompanyCustomers,
  getCompanyProjects,
  getCompanyTaxDeclarations,
  createCompanyEmployee,
  createCompanyCustomer,
  updateCompanyCustomer,
  createCompanyProject,
  getEmployeeAllocations,
  getEmployeeCurrentAllocation,
  getActiveAllocationsForDate,
  getEmployeeAttendance,
  checkInEmployee,
  checkOutEmployee,
  allocateEmployeeToProject,
  getAttendanceForAdminReview,
  updateAttendanceStatus,
  getCompanyMonthlyAttendance,
  verifyCompanyOwnership,
  verifyEmployeeInCompany,
  getCompanyBranches,
  createBranch,
  allocateLeave,
  getEmployeeLeaves,
  requestLeave,
  getAllCompanyLeaves,
  updateLeaveStatus,
  generateEmployeeId,
  setupPayrollIntegration,
  getPayrollStatus,
  createPayrollRecord,
  calculateEmployeeSalary,
  generatePayslip,
  getEmployeePayslips,
  recordEmployeeAbsence,
  createBankTransferBatch,
  getCompanyConfiguration,
  updateCompanyConfiguration,
  // Rule-based engine
  createSalaryRuleTemplate,
  addSalaryCalculationRule,
  calculateSalaryDynamically,
  // Employee lifecycle
  recordLifecycleEvent,
  recordEmployeeExit,
  // Leave & Payroll
  createLeavePolicy,
  createPayrollRun,
  updatePayrollRunStatus,
  // Compliance & Tax
  recordComplianceFiling,
  submitTaxDeclaration,
  // Role-based access
  checkUserPermission,
  assignRoleToUser,
  // Payslip & customization
  recordPayslipAccess,
  getEmployeePayslipsForSelfService,
  customizePayslipTemplate,
  // Subscription & Integration
  subscribeCompanyToPlan,
  configureIntegration,
  // Biometric
  configureBiometricDevice,
};
