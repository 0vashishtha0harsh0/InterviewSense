import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import { Icon } from './components/ui.jsx';
import Landing from './pages/Landing.jsx';
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
    <div className="app-shell app-bg">
      <Navbar />
      <main className="main">{children}</main>
    </div>
  );
}

/** Landing for visitors, straight to the workspace for signed-in users. */
function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <Layout>
      <Landing />
    </Layout>
  );
}

function NotFound() {
  return (
    <Layout>
      <div className="page container container--narrow">
        <div className="card card--pad-lg center rise">
          <div className="empty-icon" style={{ margin: '0 auto 18px' }}>
            <Icon name="target" size={24} />
          </div>
          <div className="eyebrow">Error 404</div>
          <h1 className="display-2" style={{ marginTop: 10 }}>
            This page isn’t part of the interview
          </h1>
          <p className="lead" style={{ marginTop: 12 }}>
            The link you followed doesn’t exist or has moved.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Link to="/dashboard" className="btn btn--primary">
              Back to dashboard
            </Link>
            <Link to="/interview/setup" className="btn btn--outline">
              Start a new interview
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/setup"
            element={
              <ProtectedRoute>
                <Layout>
                  <InterviewSetup />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <InterviewRoom />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <Results />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <AdminQuestions />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
