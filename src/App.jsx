import { Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute, ProtectedRoute } from "./components/RouteGuards";
import AttendanceReportPage from "./pages/admin/AttendanceReportPage";
import AddEventPage from "./pages/admin/AddEventPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import EditEventPage from "./pages/admin/EditEventPage";
import ManageEventsPage from "./pages/admin/ManageEventsPage";
import ParticipantsPage from "./pages/admin/ParticipantsPage";
import QrScannerPage from "./pages/admin/QrScannerPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import EventListingPage from "./pages/EventListingPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CheckEmailPage from "./pages/CheckEmailPage";
import EmailConfirmedPage from "./pages/EmailConfirmedPage";
import QrTicketPage from "./pages/QrTicketPage";
import SignupPage from "./pages/SignupPage";
import UserDashboardPage from "./pages/UserDashboardPage";

export default function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<LandingPage />} path="/landing_page" />
      <Route element={<SignupPage />} path="/signup" />
      <Route element={<SignupPage />} path="/sign_up_page" />
      <Route element={<CheckEmailPage />} path="/check-email" />
      <Route element={<EmailConfirmedPage />} path="/email-confirmed" />
      <Route element={<EmailConfirmedPage />} path="/auth/confirm" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<LoginPage />} path="/login_page" />
      <Route element={<EventListingPage />} path="/events" />
      <Route element={<EventListingPage />} path="/event_listing" />
      <Route element={<EventDetailsPage />} path="/events/:id" />
      <Route element={<EventDetailsPage />} path="/event_details/:id" />
      <Route element={<Navigate replace to="/events" />} path="/event_details" />

      <Route
        element={
          <ProtectedRoute>
            <UserDashboardPage />
          </ProtectedRoute>
        }
        path="/dashboard"
      />
      <Route
        element={
          <ProtectedRoute>
            <UserDashboardPage />
          </ProtectedRoute>
        }
        path="/user_dashboard"
      />
      <Route
        element={
          <ProtectedRoute>
            <QrTicketPage />
          </ProtectedRoute>
        }
        path="/ticket/:registrationId"
      />
      <Route element={<Navigate replace to="/dashboard" />} path="/qr_ticket" />
      <Route
        element={
          <ProtectedRoute>
            <QrTicketPage />
          </ProtectedRoute>
        }
        path="/qr_ticket/:registrationId"
      />

      <Route
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
        path="/admin"
      />
      <Route
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
        path="/admin_dashboard"
      />
      <Route
        element={
          <AdminRoute>
            <AddEventPage />
          </AdminRoute>
        }
        path="/admin/events/new"
      />
      <Route
        element={
          <AdminRoute>
            <AddEventPage />
          </AdminRoute>
        }
        path="/add_event_admin"
      />
      <Route
        element={
          <AdminRoute>
            <ManageEventsPage />
          </AdminRoute>
        }
        path="/admin/events"
      />
      <Route
        element={
          <AdminRoute>
            <EditEventPage />
          </AdminRoute>
        }
        path="/admin/events/:id/edit"
      />
      <Route
        element={
          <AdminRoute>
            <ManageEventsPage />
          </AdminRoute>
        }
        path="/manage_events_admin"
      />
      <Route
        element={
          <AdminRoute>
            <ManageEventsPage />
          </AdminRoute>
        }
        path="/eventra_event_management_flow"
      />
      <Route
        element={
          <AdminRoute>
            <ParticipantsPage />
          </AdminRoute>
        }
        path="/admin/participants"
      />
      <Route
        element={
          <AdminRoute>
            <ParticipantsPage />
          </AdminRoute>
        }
        path="/participants_admin"
      />
      <Route
        element={
          <AdminRoute>
            <AttendanceReportPage />
          </AdminRoute>
        }
        path="/admin/report"
      />
      <Route
        element={
          <AdminRoute>
            <AttendanceReportPage />
          </AdminRoute>
        }
        path="/attendance_report_admin"
      />
      <Route
        element={
          <AdminRoute>
            <QrScannerPage />
          </AdminRoute>
        }
        path="/admin/scanner"
      />
      <Route
        element={
          <AdminRoute>
            <QrScannerPage />
          </AdminRoute>
        }
        path="/qr_scanner_admin"
      />

      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
