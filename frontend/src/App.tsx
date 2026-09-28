import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginView } from './views/LoginView';
import { MainLayout } from './layouts/MainLayout';
import { FinanzasView } from './views/FinanzasView';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública institucional: Pantalla de Login */}
          <Route path="/login" element={<LoginView />} />

          {/* Rutas protegidas: Requieren token válido */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<FinanzasView />} />
              {/* Rutas futuras o alias */}
              <Route path="/finanzas" element={<FinanzasView />} />
            </Route>
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}