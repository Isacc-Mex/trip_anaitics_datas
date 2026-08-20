import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "./Loader";

function ProtectedRoute({ children }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;

  // Esperamos a que el perfil (y su rol) termine de cargar antes de decidir.
  if (!profile) return <PageLoader />;

  // Los admin no usan el dashboard de usuario normal: los mandamos al suyo.
  if (profile.role === "admin") return <Navigate to="/dashboard_admin" replace />;

  return children;
}

export default ProtectedRoute;