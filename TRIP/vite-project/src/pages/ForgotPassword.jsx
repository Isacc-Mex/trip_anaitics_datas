import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logoTrip from "../assets/logo_trip.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
      }
    );

    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="logo"><img src={logoTrip} alt="TRIP" /></div>
        <h1>Recuperar contraseña</h1>
        <p>Te enviaremos un enlace para restablecer tu contraseña.</p>

        {sent ? (
          <p style={{ color: "#9b70ff", textAlign: "center" }}>
            Si el correo existe en nuestro sistema, te enviamos un enlace
            para restablecer tu contraseña. Revisa tu bandeja de entrada
            (y la carpeta de spam).
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

            <button type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        <p>
          ¿Ya la recordaste?
          <Link to="/login"> Iniciar sesión</Link>
        </p>

        <Link to="/">Volver al inicio</Link>
      </div>
    </main>
  );
}

export default ForgotPassword;