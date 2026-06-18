import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Navbar from './components/Layout/Navbar';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ReflectionForm from './pages/TeacherDashboard/ReflectionForm.jsx';
import ObservationForm from './pages/LDMDashboard/ObservationForm.jsx';
import CompetencyMatrix from './pages/LDMDashboard/CompetencyMatrix.jsx';
import LeadershipChat from './pages/LDMDashboard/LeadershipChat.jsx';
import AiDiary from './pages/LDMDashboard/AiDiary.jsx';
import UserManagement from './pages/AdminDashboard/UserManagement.jsx';

/** Generic post-login landing — sends each role to its main work area. */
function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/ldm/observations" replace />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <ReflectionForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ldm/observations"
            element={
              <ProtectedRoute roles={['ldm', 'admin']}>
                <ObservationForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ldm/competency"
            element={
              <ProtectedRoute roles={['ldm', 'admin']}>
                <CompetencyMatrix />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ldm/chat"
            element={
              <ProtectedRoute roles={['ldm', 'admin']}>
                <LeadershipChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ldm/ai-diary"
            element={
              <ProtectedRoute roles={['ldm', 'admin']}>
                <AiDiary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
