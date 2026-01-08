import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = ({ children }) => {
  const { uid, loading } = useAuth();

  if (loading) return null;

  if (!uid) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
