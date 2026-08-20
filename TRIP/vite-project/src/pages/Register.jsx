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

function Register() {
  const { session, profile, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // true cuando el correo ya existe (confirmado o no, no se puede saber cuál)
  const [existingUnconfirmed, setExistingUnconfirmed] = useState(false);
  // true cuando el registro se completó y hay que decirle que revise su correo
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  if (loading) return <PageLoader />;
  if (session) {
    return <Navigate to={profile?.role === "admin" ? "/dashboard_admin" : "/dashboard"} replace />;
  }

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setResending(false);

    if (resendError) {
      setResendMessage("No se pudo reenviar el correo: " + resendError.message);
      return;
    }

    setResendMessage("Correo de confirmación reenviado. Revisa tu bandeja de entrada (y spam).");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExistingUnconfirmed(false);
    setResendMessage("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones");
      return;
    }

    if (!acceptedPrivacy) {
      setError("Debes aceptar la Política de Privacidad");
      return;
    }

    // Validar que el username no esté ya en uso antes de registrar
    setCheckingUsername(true);
    const { data: existingProfile, error: usernameCheckError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    setCheckingUsername(false);

    if (existingProfile) {
      setError("Ese nombre de usuario ya está en uso, elige otro.");
      return;
    }

    // Si la consulta de verificación falló (ej. por permisos/RLS), no lo
    // sabemos con certeza desde aquí — dejamos que el registro continúe y,
    // si el usuario ya existe, el error de más abajo lo detecta igual.
    if (usernameCheckError) {
      console.warn("No se pudo verificar el username por adelantado:", usernameCheckError.message);
    }

    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    setSubmitting(false);

    // Caso 1: Supabase devuelve error explícito de correo ya registrado
    if (signUpError) {
      const msg = signUpError.message.toLowerCase();

      if (msg.includes("already registered") || msg.includes("already exists")) {
        setExistingUnconfirmed(true);
        setError("Ese correo ya está registrado. Si ya confirmaste tu cuenta, inicia sesión. Si no, puedes reenviar el correo de confirmación.");
        return;
      }

      if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("database error saving new user")) {
        // Este es el error genérico que manda Supabase cuando el trigger que
        // crea el perfil choca con una restricción única (normalmente el
        // nombre de usuario repetido, ya que el correo se valida aparte).
        setError("Ese nombre de usuario ya está en uso, elige otro.");
        return;
      }

      setError(signUpError.message);
      return;
    }

    // Caso 2 (el más común con "Confirm email" activado): Supabase NO manda error,
    // pero si el correo ya existía (confirmado o no), regresa un array de
    // identities vacío en vez de mandar un correo nuevo. No se puede distinguir
    // desde el cliente si ya estaba confirmado, así que el mensaje es neutral.
    const identities = data?.user?.identities;
    if (identities && identities.length === 0) {
      setExistingUnconfirmed(true);
      setError("Ese correo ya está registrado. Si ya confirmaste tu cuenta, inicia sesión. Si no, puedes reenviar el correo de confirmación.");
      return;
    }

    // Registro nuevo real: Supabase ya mandó el correo de confirmación.
    setAwaitingConfirmation(true);
  };

  if (awaitingConfirmation) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="logo"><img src={logoTrip} alt="TRIP" /></div>
          <h1>Revisa tu correo</h1>
          <p>
            Te enviamos un correo de confirmación a <strong>{email}</strong>.
            Abre el enlace para activar tu cuenta antes de iniciar sesión.
          </p>

          <button type="button" onClick={handleResend} disabled={resending}>
            {resending ? "Reenviando..." : "Reenviar correo"}
          </button>

          {resendMessage && <p style={{ color: "#9be29b" }}>{resendMessage}</p>}

          <Link to="/login">Ir a iniciar sesión</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="logo"><img src={logoTrip} alt="TRIP" /></div>
        <h1>Comienza tu viaje</h1>
        <p>Crea tu cuenta para guardar tu progreso.</p>

        <form onSubmit={handleSubmit}>
          <label>Nombre de usuario</label>
          <input
            type="text"
            placeholder="Tu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

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

          <label>Confirmar contraseña</label>
          <div className="password-field" style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
              <EyeIcon off={showConfirmPassword} />
            </button>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
            />
            Acepto los{" "}
            <Link to="/terminos" target="_blank" rel="noopener noreferrer">
              Términos y Condiciones
            </Link>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              required
            />
            Acepto la{" "}
            <Link to="/privacidad" target="_blank" rel="noopener noreferrer">
              Política de Privacidad
            </Link>
          </label>

          {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

          {existingUnconfirmed && (
            <div className="already-registered-actions">
              <button type="button" onClick={handleResend} disabled={resending}>
                {resending ? "Reenviando..." : "Reenviar correo de confirmación"}
              </button>
              <Link to="/login">Ya confirmé, iniciar sesión</Link>
            </div>
          )}

          {resendMessage && <p style={{ color: "#9be29b" }}>{resendMessage}</p>}

          <button type="submit" disabled={submitting || checkingUsername || !acceptedTerms || !acceptedPrivacy}>
            {checkingUsername ? "Verificando usuario..." : submitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p>
          ¿Ya tienes una cuenta?
          <Link to="/login"> Iniciar sesión</Link>
        </p>

        <Link to="/">Volver al inicio</Link>
      </div>
    </main>
  );
}

export default Register;