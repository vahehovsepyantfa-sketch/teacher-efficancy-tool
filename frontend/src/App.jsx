import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Navbar from './components/Layout/Navbar';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ReflectionForm from './pages/TeacherDashboard/ReflectionForm.jsx';
import ObservationForm from './pages/LDMDashboard/ObservationForm.jsx';
import CompetencyMatrix from './pages/LDMDashboard/CompetencyMatrix.jsx';
import AiDiary from './pages/LDMDashboard/AiDiary.jsx';
import UserManagement from './pages/AdminDashboard/UserManagement.jsx';

/** Sends a logged-in user to the right "home" page for their role. */
function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'teacher') return <ReflectionForm />;
  return <ObservationForm />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomeRedirect />
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
