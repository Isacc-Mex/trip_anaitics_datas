import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/Loader";
import logoTrip from "../assets/logo_trip.png";

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <line x1="1" y1="1" x2="23" y2="23" />}
    </svg>
  );
}

function Login() {
  const { session, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  if (loading) return <PageLoader />;
  if (session) {
    return <Navigate to={profile?.role === "admin" ? "/dashboard_admin" : "/dashboard"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setSubmitting(false);
      setError(signInError.message);
      return;
    }

    // Consultamos el rol directo en la base de datos en vez de esperar a que
    // el contexto global termine de cargar el perfil, así la redirección es
    // inmediata y no depende de una carrera con el AuthContext.
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", signInData.user.id)
      .single();

    setSubmitting(false);

    navigate(profileData?.role === "admin" ? "/dashboard_admin" : "/dashboard");
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="logo"><img src={logoTrip} alt="TRIP" /></div>
        <h1>Bienvenido de nuevo</h1>
        <p>Inicia sesión para continuar tu viaje.</p>

        <form onSubmit={handleSubmit}>
          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Contraseña</label>
          <div className="password-field" style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              tabIndex={-1}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                outline: "none",
                padding: 0,
                margin: 0,
                width: "auto",
                height: "auto",
                minWidth: "unset",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8e9e99",
                zIndex: 2
              }}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>

          {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

          <Link to="/recuperar" className="forgot-password-link">
            ¿Olvidaste tu contraseña?
          </Link>

          <button type="submit" disabled={submitting}>
            {submitting ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <p>
          ¿No tienes una cuenta?
          <Link to="/registro"> Crear cuenta</Link>
        </p>

        <Link to="/">Volver al inicio</Link>
      </div>
    </main>
  );
}

export default Login;