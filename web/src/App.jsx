import { Routes, Route, Navigate } from "react-router-dom";
import { LoginForm } from "./pages/login/LoginForm.jsx";
import './App.css'

function App() {
  return (
    <Routes>
      {/* Redireciona a home para login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Tela de login */}
      <Route path="/login" element={<LoginForm />} />

      {/* Opcional: página de 404 */}
      <Route path="*" element={<h1>Página não encontrada</h1>} />
    </Routes>
  );
}

export default App;

