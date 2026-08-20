import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AdminExportar from "./pages/AdminExportar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import About from "./pages/About";
import Store from "./pages/Store";
import Admin from "./pages/Admin";
import Terminos from "./pages/Terminos";
import Privacidad from "./pages/Privacidad";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminOverview from "./pages/AdminOverview";
import AdminSimulacion from "./pages/AdminSimulacion";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/juego" element={<Game />} />
          <Route path="/proyecto" element={<About />} />
          <Route path="/tienda" element={<Store />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/recuperar" element={<ForgotPassword />} />
          <Route path="/restablecer-contrasena" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute> }/>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route
  path="/dashboard_admin"
  element={
    <AdminRoute>
      <AdminOverview />
    </AdminRoute>
  }
/>
<Route
  path="/admin/exportar"
  element={
    <AdminRoute>
      <AdminExportar />
    </AdminRoute>
  }
/>
          <Route
            path="/admin/simulacion"
            element={
              <AdminRoute>
                <AdminSimulacion />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;