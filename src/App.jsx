import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { authClient } from './lib/auth';
import SignIn from './pages/SignIn';
import Admin from './pages/Admin';
import Calendar from './pages/Calendar';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmailAllowed, setIsEmailAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar sesión al cargar
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setUser(session.data.user);

          // Verificación de acceso con lista local
          const allowedEmails = [
            'albertolender@gmail.com',
            'lynchjona1@gmail.com',
            'maxipadilla.unsl@gmail.com',
            'supremacyaaa@gmail.com'
          ];

          const userEmail = session.data.user.email?.toLowerCase();
          const isAllowed = allowedEmails.includes(userEmail);

          console.log('User email:', userEmail, 'Allowed:', isAllowed);
          setIsEmailAllowed(isAllowed);
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
      <Route path="/" element={<Calendar />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/admin" /> : <SignIn />}
      />
      <Route
        path="/admin/*"
        element={user ? <Admin user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;