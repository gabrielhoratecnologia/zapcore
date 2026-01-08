import { Routes, Route, Navigate } from "react-router-dom";
import { LoginForm } from "./pages/login/LoginForm.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import "./App.css";
import PrivateRoute from "./routes/Privateroute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginForm />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<h1>Página não encontrada</h1>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
