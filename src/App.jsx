import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Login from './pages/Login'
import Register from './pages/Register'
import MyAllocation from './pages/MyAllocation'
import CheckIn from './pages/CheckIn'
import CheckOut from './pages/CheckOut'
import AttendanceResult from './pages/AttendanceResult'
import DailyTimesheet from './pages/DailyTimesheet'
import AttendanceHistory from './pages/AttendanceHistory'
import Profile from './pages/Profile'
import AdminReview from './pages/AdminReview'
import MonthlyAttendanceReview from './pages/admin/MonthlyAttendanceReview'
import AdminMenu from './pages/admin/AdminMenu'
import DailyCheckInList from './pages/admin/DailyCheckInList'
import CreateCompany from './pages/admin/CreateCompany'
import CreateCustomer from './pages/admin/CreateCustomer'
import EditCustomer from './pages/admin/EditCustomer'
import CustomerList from './pages/admin/CustomerList'
import CreateProject from './pages/admin/CreateProject'
import ProjectList from './pages/admin/ProjectList'
import EmployeeList from './pages/admin/EmployeeList'
import CreateEmployee from './pages/admin/CreateEmployee'
import EditEmployee from './pages/admin/EditEmployee'
import AllocateProject from './pages/admin/AllocateProject'
import LeaveAllocation from './pages/admin/LeaveAllocation'
import LeaveApproval from './pages/admin/LeaveApproval'
import PayrollTaxManagement from './pages/admin/PayrollTaxManagement'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeProfile from './pages/employee/EmployeeProfile'
import PayslipDownload from './pages/employee/PayslipDownload'
import LeaveApplication from './pages/employee/LeaveApplication'
import EmployeeAnalysis from './pages/employee/EmployeeAnalysis'
import AttendanceCalendar from './pages/employee/AttendanceCalendar'
import PerformanceAnalysis from './pages/admin/PerformanceAnalysis'
import BottomNav from './components/BottomNav'
import SideNav from './components/SideNav'
import './index.css'

const AppContent = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const hideNav = ['/', '/login', '/register', '/register-company', '/result'].includes(location.pathname) || location.pathname.startsWith('/admin');
  const showMenuButton = !hideNav;

  return (
    <>
      <SideNav isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      {showMenuButton && !isMenuOpen && (
        <button
          className="mobile-menu-button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}
      <div className="main-app-content" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-company" element={<CreateCompany />} />
          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/allocation" element={<MyAllocation />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/checkout" element={<CheckOut />} />
          <Route path="/result" element={<AttendanceResult />} />
          <Route path="/timesheet" element={<DailyTimesheet />} />
          <Route path="/attendance" element={<AttendanceHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminMenu />} />
          <Route path="/admin/review" element={<AdminReview />} />
          <Route path="/admin/monthly-review" element={<MonthlyAttendanceReview />} />
          <Route path="/admin/daily-checkin" element={<DailyCheckInList />} />
          <Route path="/admin/customer" element={<CustomerList />} />
          <Route path="/admin/customer/create" element={<CreateCustomer />} />
          <Route path="/admin/customer/edit/:id" element={<EditCustomer />} />
          <Route path="/admin/project" element={<ProjectList />} />
          <Route path="/admin/project/create" element={<CreateProject />} />
          <Route path="/admin/employee" element={<EmployeeList />} />
          <Route path="/admin/employee/create" element={<CreateEmployee />} />
          <Route path="/admin/employee/edit/:id" element={<EditEmployee />} />
          <Route path="/admin/allocate" element={<AllocateProject />} />
          <Route path="/admin/leave" element={<LeaveAllocation />} />
          <Route path="/admin/leave-approval" element={<LeaveApproval />} />
          <Route path="/admin/payroll-tax" element={<PayrollTaxManagement />} />
          <Route path="/admin/performance" element={<PerformanceAnalysis />} />
          <Route path="/admin/performance/employee/:id" element={<EmployeeAnalysis />} />
          {/* Employee Self-Service */}
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/analysis" element={<EmployeeAnalysis />} />
          <Route path="/employee/calendar" element={<AttendanceCalendar />} />
          <Route path="/employee/allocation" element={<MyAllocation />} />
          <Route path="/employee/checkin" element={<CheckIn />} />
          <Route path="/employee/checkout" element={<CheckOut />} />
          <Route path="/employee/timesheet" element={<DailyTimesheet />} />
          <Route path="/employee/attendance" element={<AttendanceHistory />} />
          <Route path="/employee/profile" element={<EmployeeProfile />} />
          <Route path="/employee/payslips" element={<PayslipDownload />} />
          <Route path="/employee/leave" element={<LeaveApplication />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
