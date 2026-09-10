import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import InterviewSetup from './pages/InterviewSetup.jsx';
import InterviewRoom from './pages/InterviewRoom.jsx';
import Results from './pages/Results.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';
import AdminQuestions from './pages/AdminQuestions.jsx';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f3f4f6', minHeight: 'calc(100vh - 57px)' }}>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/interview/setup" element={<ProtectedRoute><Layout><InterviewSetup /></Layout></ProtectedRoute>} />
          <Route path="/interview/:id" element={<ProtectedRoute><Layout><InterviewRoom /></Layout></ProtectedRoute>} />
          <Route path="/results/:id" element={<ProtectedRoute><Layout><Results /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><Admin /></Layout></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute adminOnly><Layout><AdminQuestions /></Layout></ProtectedRoute>} />
          <Route path="*" element={<div style={{ padding: 40, textAlign: 'center' }}><h1>404 — Not Found</h1><a href="/dashboard">Go Dashboard</a></div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
