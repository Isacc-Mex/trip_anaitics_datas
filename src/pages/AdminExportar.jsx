import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProfileMenu from "../components/ProfileMenu";
import { InlineSpinner } from "../components/Loader";
import logoTrip from "../assets/logo_trip.png";

// Supabase/PostgREST devuelve máximo 1000 filas por consulta por defecto.
// Con muchos bots + varias partidas cada uno, game_matches (y a veces
// purchases) pasa de 1000 filas fácil, así que traemos todo por páginas
// (mismo patrón que ya usa AdminOverview.jsx).
async function fetchAll(table, select) {
  const pageSize = 1000;
  let from = 0;
  let all = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1);

    if (error) throw error;

    all = all.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

// Convierte un array de objetos planos a texto CSV (separado por comas,
// con comillas dobles cuando el valor las necesita: comas, comillas o
// saltos de línea).
function toCSV(rows) {
  if (!rows || rows.length === 0) return "";

  const headers = Object.keys(rows[0]);

  const escapeCell = (value) => {
    if (value === null || value === undefined) return "";
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  });

  return lines.join("\n");
}

// Dispara la descarga del archivo en el navegador con el nombre exacto pedido.
function downloadCSV(filename, csvText) {
  const blob = new Blob(["\uFEFF" + csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const EXPORTS = [
  {
    key: "profiles",
    filename: "profiles.csv",
    title: "Usuarios (profiles)",
    desc: "Todos los perfiles: id, username, rol y fecha de registro.",
    table: "profiles",
    select: "id, username, role, created_at, avatar_url",
  },
  {
    key: "products",
    filename: "products.csv",
    title: "Productos",
    desc: "Catálogo completo de la tienda.",
    table: "products",
    select: "id, name, description, type, price, image_url, created_by, created_at",
  },
  {
    key: "purchases",
    filename: "purchases.csv",
    title: "Compras (purchases)",
    desc: "Todas las compras registradas, con el nombre del producto incluido.",
    table: "purchases",
    select: "id, user_id, product_id, price_paid, created_at, products(name)",
  },
  {
    key: "game_matches",
    filename: "game_matches.csv",
    title: "Partidas (game_matches)",
    desc: "Todas las partidas jugadas por todos los usuarios.",
    table: "game_matches",
    select:
      "id, user_id, map_name, map_number, duration_seconds, consumptions, max_health_end, damage_received, death_type, decision, completed, played_at",
  },
];

function AdminExportar() {
  const [running, setRunning] = useState(null); // key del export en curso, o "all"
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { key, count } del último export exitoso

  const exportOne = async (item) => {
    // "purchases" trae products(name) anidado — lo aplanamos a una sola
    // columna "product_name" para que el CSV quede legible en Excel/Sheets.
    let rows = await fetchAll(item.table, item.select);
    if (item.key === "purchases") {
      rows = rows.map(({ products, ...rest }) => ({
        ...rest,
        product_name: products?.name || "",
      }));
    }
    downloadCSV(item.filename, toCSV(rows));
    return rows.length;
  };

  const handleExport = async (item) => {
    setRunning(item.key);
    setError("");
    setDone(null);
    try {
      const count = await exportOne(item);
      setDone({ key: item.key, count });
    } catch (err) {
      setError(`Error exportando ${item.filename}: ${err.message}`);
    } finally {
      setRunning(null);
    }
  };

  const handleExportAll = async () => {
    setRunning("all");
    setError("");
    setDone(null);
    try {
      for (const item of EXPORTS) {
        // eslint-disable-next-line no-await-in-loop
        await exportOne(item);
      }
      setDone({ key: "all", count: EXPORTS.length });
    } catch (err) {
      setError(`Error exportando: ${err.message}`);
    } finally {
      setRunning(null);
    }
  };

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
          <Link to="/admin/simulacion">Simulación</Link>
          <Link to="/tienda">Ver tienda</Link>
          <ProfileMenu />
        </div>
      </nav>

      <section className="admin-content">
        <p className="subtitle admin-subtitle">PANEL DE ADMINISTRACIÓN</p>
        <h1>Exportar datos</h1>

        <div className="admin-dashboard-note">
          Descarga cualquiera de las tablas como CSV. Cada archivo se guarda con su nombre
          exacto (<code>profiles.csv</code>, <code>products.csv</code>, <code>purchases.csv</code>,{" "}
          <code>game_matches.csv</code>) listo para abrir en Excel/Sheets o subir a otra
          herramienta.
        </div>

        <div className="admin-form-actions" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className="admin-submit"
            disabled={running !== null}
            onClick={handleExportAll}
          >
            {running === "all" ? (
              <>
                <InlineSpinner size={14} /> Exportando todo...
              </>
            ) : (
              "Exportar todo (4 archivos)"
            )}
          </button>
        </div>

        <div className="admin-layout">
          {EXPORTS.map((item) => (
            <div className="admin-form-card" key={item.key}>
              <h2 className="admin-form-title">{item.title}</h2>
              <p style={{ color: "#999", fontSize: 13, marginBottom: 16 }}>{item.desc}</p>
              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-submit"
                  disabled={running !== null}
                  onClick={() => handleExport(item)}
                >
                  {running === item.key ? (
                    <>
                      <InlineSpinner size={14} /> Exportando...
                    </>
                  ) : (
                    `Descargar ${item.filename}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="admin-error" style={{ marginTop: 20 }}>
            {error}
          </p>
        )}

        {done && (
          <div className="admin-dashboard-note" style={{ marginTop: 20, color: "#9f9" }}>
            {done.key === "all" ? (
              <>Listo — se descargaron los {done.count} archivos.</>
            ) : (
              <>
                Listo — <strong>{EXPORTS.find((e) => e.key === done.key)?.filename}</strong> descargado
                con <strong>{done.count}</strong> filas.
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminExportar;
