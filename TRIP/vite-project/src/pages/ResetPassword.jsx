import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logoTrip from "../assets/logo_trip.png";

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase detecta el token de recuperación en la URL (detectSessionInUrl)
    // y dispara el evento PASSWORD_RECOVERY cuando la sesión queda lista.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Si ya había una sesión de recuperación activa al montar el componente.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        // Da un pequeño margen a que el evento PASSWORD_RECOVERY llegue
        // antes de asumir que el enlace es inválido o ya expiró.
        setTimeout(() => {
          setReady((prevReady) => {
            if (!prevReady) setInvalidLink(true);
            return prevReady;
          });
        }, 3000);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate("/dashboard"), 2000);
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="logo"><img src={logoTrip} alt="TRIP" /></div>
        <h1>Restablecer contraseña</h1>

        {invalidLink && (
          <>
            <p>
              Este enlace no es válido o ya expiró. Solicita uno nuevo para
              continuar.
            </p>
            <Link to="/recuperar">
              <button type="button" style={{ width: "100%", marginTop: 10 }}>
                Solicitar nuevo enlace
              </button>
            </Link>
          </>
        )}

        {!invalidLink && !ready && !success && (
          <p style={{ textAlign: "center", color: "#888" }}>
            Verificando enlace...
          </p>
        )}

        {ready && !success && (
          <>
            <p>Ingresa tu nueva contraseña.</p>

            <form onSubmit={handleSubmit}>
              <label>Nueva contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

              <button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          </>
        )}

        {success && (
          <p style={{ color: "#9b70ff", textAlign: "center" }}>
            Tu contraseña se actualizó correctamente. Te estamos
            redirigiendo...
          </p>
        )}

        <Link to="/">Volver al inicio</Link>
      </div>
    </main>
  );
}

export default ResetPassword;