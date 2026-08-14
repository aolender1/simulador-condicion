import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { authClient } from './lib/auth';
import MainLayout from './components/MainLayout';
import SignIn from './pages/SignIn';
import Admin from './pages/Admin';
import Calendar from './pages/Calendar';
import StudyPlan from './components/StudyPlan';
import Calculadora from './components/Calculadora';
import CalendarioAcademico from './pages/CalendarioAcademico';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmailAllowed, setIsEmailAllowed] = useState(false);
  const navigate = useNavigate();

  const devLogin = () => {
    const devUser = { name: 'Dev Admin', email: 'dev@unsldatos.local' };
    setUser(devUser);
    setIsEmailAllowed(true);
    setLoading(false);
    navigate('/admin');
  };

  useEffect(() => {
    // Verificar sesión al cargar
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setUser(session.data.user);

          // Verificación de acceso realizada en el servidor (lista de emails en ALLOWED_EMAILS,
          // nunca expuesta en el código de la página)
          const token = session?.data?.session?.token;
          const res = await fetch('/api/check-access', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const data = await res.json();
          setIsEmailAllowed(data.allowed === true);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      setUser(null);
      setIsEmailAllowed(false);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  // Si hay usuario pero email no permitido, mostrar mensaje de acceso denegado
  if (user && !isEmailAllowed) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Acceso Denegado</h1>
          <p style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#ef4444' }}>
            Tu cuenta ({user.email}) no está autorizada para acceder a esta aplicación.
          </p>
          <button className="btn btn-primary" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Calendar />} />
        <Route path="correlatividades" element={<StudyPlan />} />
        <Route path="calculadora" element={<Calculadora />} />
        <Route path="calendario-academico" element={<CalendarioAcademico />} />
      </Route>
      <Route
        path="/login"
        element={user ? <Navigate to="/admin" /> : <SignIn onDevLogin={import.meta.env.DEV ? devLogin : null} />}
      />
      <Route
        path="/admin/*"
        element={user ? <Admin user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;
