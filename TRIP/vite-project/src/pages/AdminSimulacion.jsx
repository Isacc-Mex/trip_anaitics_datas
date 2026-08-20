import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProfileMenu from "../components/ProfileMenu";
import { InlineSpinner } from "../components/Loader";
import logoTrip from "../assets/logo_trip.png";

function AdminSimulacion() {
  const [botCount, setBotCount] = useState(500);
  const [running, setRunning] = useState(null); // "full" | "matches" | "purchases" | null
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runRpc = async (name, args, label) => {
    setRunning(label);
    setError("");
    setResult(null);

    const { data, error: rpcError } = await supabase.rpc(name, args);

    setRunning(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setResult({ label, data });
  };

  const handleFullRun = () =>
    runRpc("admin_run_full_simulation", { p_bot_count: botCount }, "full");

  const handleFillMatches = () => runRpc("admin_fill_missing_gameplay", {}, "matches");

  const handleFillPurchases = () => runRpc("admin_fill_missing_purchases", {}, "purchases");

  return (
    <main className="admin-panel">
      <nav className="navbar admin-navbar">
        <div className="logo">
          <img src={logoTrip} alt="TRIP" />
          <span className="admin-badge">ADMIN</span>
        </div>
        <div className="nav-links">
          <Link to="/dashboard_admin">Dashboard</Link>
          <Link to="/admin">Productos</Link>
          <Link to="/tienda">Ver tienda</Link>
          <Link to="/admin/exportar">Exportar</Link>
          <ProfileMenu />
        </div>
      </nav>

      <section className="admin-content">
        <p className="subtitle admin-subtitle">PANEL DE ADMINISTRACIÓN</p>
        <h1>Simulación de datos</h1>

        <div className="admin-dashboard-note">
          Esto llama funciones que ya viven en la base de datos (no borra nada de usuarios
          reales que ya tengan partidas o compras propias). "Regenerar todo" sí borra y
          vuelve a crear los bots (cuentas <code>bot1@gmail.com</code>...) para que puedas
          correrlo las veces que quieras sin ir acumulando basura.
        </div>

        <div className="admin-layout">
          <div className="admin-form-card">
            <h2 className="admin-form-title">Regenerar todo (bots + partidas + compras)</h2>

            <div className="admin-field">
              <label>Cantidad de bots</label>
              <input
                type="number"
                min={1}
                max={2000}
                value={botCount}
                onChange={(e) => setBotCount(Number(e.target.value))}
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-submit"
                disabled={running !== null}
                onClick={handleFullRun}
              >
                {running === "full" ? (
                  <>
                    <InlineSpinner size={14} /> Generando...
                  </>
                ) : (
                  "Regenerar todo"
                )}
              </button>
            </div>
          </div>

          <div className="admin-form-card">
            <h2 className="admin-form-title">Rellenos parciales</h2>
            <p style={{ color: "#999", fontSize: 13, marginBottom: 16 }}>
              Solo agregan datos a usuarios (bots o reales) que todavía no tienen ninguno.
              No tocan a nadie que ya tenga historial.
            </p>

            <div className="admin-form-actions" style={{ flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                className="admin-submit"
                disabled={running !== null}
                onClick={handleFillMatches}
              >
                {running === "matches" ? (
                  <>
                    <InlineSpinner size={14} /> Generando partidas...
                  </>
                ) : (
                  "Rellenar partidas faltantes"
                )}
              </button>

              <button
                type="button"
                className="admin-submit"
                disabled={running !== null}
                onClick={handleFillPurchases}
              >
                {running === "purchases" ? (
                  <>
                    <InlineSpinner size={14} /> Generando compras...
                  </>
                ) : (
                  "Rellenar compras faltantes"
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p className="admin-error" style={{ marginTop: 20 }}>
            {error}
          </p>
        )}

        {result && (
          <div className="admin-dashboard-note" style={{ marginTop: 20, color: "#9f9" }}>
            {result.label === "full" && (
              <>
                Listo — bots creados: <strong>{result.data.bots_creados}</strong>, usuarios
                con partidas generadas: <strong>{result.data.usuarios_con_partidas_generadas}</strong>,
                usuarios con compras generadas:{" "}
                <strong>{result.data.usuarios_con_compras_generadas}</strong>.
              </>
            )}
            {result.label === "matches" && (
              <>
                Listo — usuarios con partidas generadas: <strong>{result.data}</strong>.
              </>
            )}
            {result.label === "purchases" && (
              <>
                Listo — usuarios con compras generadas: <strong>{result.data}</strong>.
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminSimulacion;
