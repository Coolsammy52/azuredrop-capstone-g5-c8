/** Route table. Providers are layered so auth can navigate, and categories/toasts can read auth. */
import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CategoriesProvider } from './context/CategoriesContext.jsx';
import AccountPage from './pages/AccountPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import FileDetailsPage from './pages/FileDetailsPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import SharedFilePage from './pages/SharedFilePage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import UploadPage from './pages/UploadPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/s/:token" element={<SharedFilePage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/files/:id" element={<FileDetailsPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CategoriesProvider>
    </AuthProvider>
  );
}
