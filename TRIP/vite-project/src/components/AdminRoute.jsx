import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "./Loader";

function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <PageLoader label="Verificando..." />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}

export default AdminRoute;