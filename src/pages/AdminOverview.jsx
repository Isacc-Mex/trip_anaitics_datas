import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { supabase } from "../lib/supabase";
import ProfileMenu from "../components/ProfileMenu";
import PageLoader from "../components/Loader";
import logoTrip from "../assets/logo_trip.png";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const DEATH_LABELS = {
  enemigos: "Enemigos",
  sobredosis: "Sobredosis",
  abstinencia: "Abstinencia",
  colapso: "Colapso",
  caidas: "Caídas",
};

const DEATH_COLORS = {
  enemigos: "#f06a6a",
  sobredosis: "#e8b86d",
  abstinencia: "#9b70ff",
  colapso: "#4fd1c5",
  caidas: "#4fc3f7",
};

function formatMMSS(totalSeconds) {
  if (!totalSeconds) return "0:00";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function last12Months() {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" }),
    });
  }
  return months;
}

function monthKeyOf(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

// Semáforos de KPI (umbrales documentados en docs/kpis.md)
function semaforoConversion(pct) {
  if (pct >= 25) return "verde";
  if (pct >= 15) return "amarillo";
  return "rojo";
}
function semaforoRetencion(pct) {
  if (pct >= 30) return "verde";
  if (pct >= 15) return "amarillo";
  return "rojo";
}

// Supabase/PostgREST devuelve máximo 1000 filas por consulta por defecto.
// Con muchos bots + varias partidas cada uno, game_matches (y a veces
// purchases) pasa de 1000 filas fácil, así que traemos todo por páginas.
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

function AdminOverview() {
  const [allProfiles, setAllProfiles] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------- Filtro de fecha (aplica a todo el dashboard) ----------
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const inDateRange = (dateStr) => {
    if (!dateFrom && !dateTo) return true;
    const t = new Date(dateStr).getTime();
    if (dateFrom && t < new Date(dateFrom).getTime()) return false;
    if (dateTo && t > new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
    return true;
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [profilesData, purchasesData, matchesData, leaderboardRes] = await Promise.all([
          fetchAll("profiles", "id, username, role, created_at"),
          fetchAll(
            "purchases",
            "id, user_id, price_paid, created_at, product_id, products(name)"
          ),
          fetchAll(
            "game_matches",
            "user_id, played_at, duration_seconds, death_type, consumptions, map_name"
          ),
          supabase.from("leaderboard_best_times").select("*").limit(10),
        ]);

        setAllProfiles(profilesData);
        setAllPurchases(purchasesData);
        setAllMatches(matchesData);
        setLeaderboard(leaderboardRes.data || []);
      } catch (err) {
        console.error("Error cargando datos del dashboard admin:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // A partir de aquí, "profiles"/"purchases"/"matches" son SOLO jugadores
  // (role = 'user'). Los admins nunca cuentan en ninguna gráfica ni KPI.
  const profiles = useMemo(() => allProfiles.filter((p) => p.role !== "admin"), [allProfiles]);
  const jugadorIds = useMemo(() => new Set(profiles.map((p) => p.id)), [profiles]);
  const purchases = useMemo(
    () => allPurchases.filter((p) => jugadorIds.has(p.user_id) && inDateRange(p.created_at)),
    [allPurchases, jugadorIds, dateFrom, dateTo]
  );
  const matches = useMemo(
    () => allMatches.filter((m) => jugadorIds.has(m.user_id) && inDateRange(m.played_at)),
    [allMatches, jugadorIds, dateFrom, dateTo]
  );

  const months = useMemo(() => last12Months(), []);

  // ---------- KPIs generales ----------
  const totalUsuarios = profiles.length;
  const totalVentas = purchases.length;
  const totalIngresos = useMemo(
    () => purchases.reduce((sum, p) => sum + Number(p.price_paid || 0), 0),
    [purchases]
  );
  
  const usuariosActivosMes = useMemo(() => {
    const key = `${new Date().getFullYear()}-${new Date().getMonth()}`;
    const uids = new Set(
      matches.filter((m) => monthKeyOf(m.played_at) === key).map((m) => m.user_id)
    );
    return uids.size;
  }, [matches]);

  const partidasJugadasTotal = matches.length;

  const productoTop = useMemo(() => {
    const counts = {};
    purchases.forEach((p) => {
      const key = p.product_id;
      if (!counts[key]) counts[key] = { name: p.products?.name || "Producto eliminado", count: 0 };
      counts[key].count += 1;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count)[0] || null;
  }, [purchases]);

  // Ticket promedio: cuánto gasta en promedio quien compra (KPI #4 del catálogo)
  const ticketPromedio = useMemo(
    () => (totalVentas > 0 ? totalIngresos / totalVentas : 0),
    [totalIngresos, totalVentas]
  );

  // Tasa de conversión a compra: % de jugadores que llegaron a comprar (KPI #6)
  const tasaConversion = useMemo(() => {
    if (totalUsuarios === 0) return 0;
    const jugadoresConCompra = new Set(purchases.map((p) => p.user_id)).size;
    return (jugadoresConCompra / totalUsuarios) * 100;
  }, [purchases, totalUsuarios]);

  const firstMatchByUser = useMemo(() => {
    const map = new Map();
    matches.forEach((m) => {
      const t = new Date(m.played_at).getTime();
      if (!map.has(m.user_id) || t < map.get(m.user_id)) map.set(m.user_id, t);
    });
    return map;
  }, [matches]);

  // ---------- Datos para Gráficos ----------
  const ventasPorAño = useMemo(() => {
    const byYear = new Map();
    purchases.forEach((p) => {
      const year = new Date(p.created_at).getFullYear();
      byYear.set(year, (byYear.get(year) || 0) + Number(p.price_paid || 0));
    });
    return [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, total]) => ({ año: String(year), ingresos: Math.round(total * 100) / 100 }));
  }, [purchases]);

  const ventasPorMes = useMemo(
    () =>
      months.map(({ key, label }) => ({
        mes: label,
        ingresos:
          Math.round(
            purchases
              .filter((p) => monthKeyOf(p.created_at) === key)
              .reduce((s, p) => s + Number(p.price_paid || 0), 0) * 100
          ) / 100,
      })),
    [months, purchases]
  );

  const usuariosPorAño = useMemo(() => {
    const byYear = new Map();
    profiles.forEach((p) => {
      const year = new Date(p.created_at).getFullYear();
      byYear.set(year, (byYear.get(year) || 0) + 1);
    });
    const years = [...byYear.keys()].sort((a, b) => a - b);
    let running = 0;
    return years.map((y) => {
      running += byYear.get(y);
      return { año: String(y), usuarios: running };
    });
  }, [profiles]);

  const usuariosActivosPorMes = useMemo(
    () =>
      months.map(({ key, label }) => {
        const uids = new Set(
          matches.filter((m) => monthKeyOf(m.played_at) === key).map((m) => m.user_id)
        );
        return { mes: label, activos: uids.size };
      }),
    [months, matches]
  );

  const nuevosVsRecurrentes = useMemo(
    () =>
      months.map(({ key, label }) => {
        const uidsMes = new Set(
          matches.filter((m) => monthKeyOf(m.played_at) === key).map((m) => m.user_id)
        );
        let nuevos = 0;
        let recurrentes = 0;
        uidsMes.forEach((uid) => {
          const firstTs = firstMatchByUser.get(uid);
          const firstKey = firstTs ? monthKeyOf(new Date(firstTs).toISOString()) : null;
          if (firstKey === key) nuevos += 1;
          else recurrentes += 1;
        });
        return { mes: label, nuevos, recurrentes };
      }),
    [months, matches, firstMatchByUser]
  );

  const tiposDeMuerteGlobal = useMemo(() => {
    const counts = {};
    matches.forEach((m) => {
      if (!m.death_type) return;
      counts[m.death_type] = (counts[m.death_type] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      key,
      name: DEATH_LABELS[key] || key,
      value,
    }));
  }, [matches]);

  const tiempoPromedioPorMes = useMemo(
    () =>
      months.map(({ key, label }) => {
        const inMonth = matches.filter(
          (m) => monthKeyOf(m.played_at) === key && m.duration_seconds != null
        );
        const avg = inMonth.length
          ? inMonth.reduce((s, m) => s + m.duration_seconds, 0) / inMonth.length
          : 0;
        return { mes: label, segundos: Math.round(avg), label2: formatMMSS(avg) };
      }),
    [months, matches]
  );

  const consumoPromedioPorMes = useMemo(
    () =>
      months.map(({ key, label }) => {
        const inMonth = matches.filter((m) => monthKeyOf(m.played_at) === key);
        const avg = inMonth.length
          ? inMonth.reduce((s, m) => s + (m.consumptions || 0), 0) / inMonth.length
          : 0;
        return { mes: label, consumo: Math.round(avg * 10) / 10 };
      }),
    [months, matches]
  );

  const retencion = useMemo(() => {
    if (profiles.length === 0) return [];
    const matchesByUser = new Map();
    matches.forEach((m) => {
      if (!matchesByUser.has(m.user_id)) matchesByUser.set(m.user_id, []);
      matchesByUser.get(m.user_id).push(new Date(m.played_at).getTime());
    });
    return [1, 7, 30].map((dias) => {
      let retenidos = 0;
      profiles.forEach((p) => {
        const reg = new Date(p.created_at).getTime();
        const userMatches = matchesByUser.get(p.id) || [];
        const tieneEnVentana = userMatches.some((t) => {
          const diff = t - reg;
          return diff >= 0 && diff <= dias * 24 * 60 * 60 * 1000;
        });
        if (tieneEnVentana) retenidos += 1;
      });
      return { dia: `Día ${dias}`, retencion: Math.round((retenidos / profiles.length) * 100) };
    });
  }, [profiles, matches]);

  const rankingMapas = useMemo(() => {
    const counts = new Map();
    matches.forEach((m) => counts.set(m.map_name, (counts.get(m.map_name) || 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([mapa, partidas]) => ({ mapa: mapa || "Sin mapa", partidas }));
  }, [matches]);

  const tiempoPorMapa = useMemo(() => {
    const map = new Map();
    matches.forEach((m) => {
      if (m.duration_seconds == null) return;
      if (!map.has(m.map_name)) map.set(m.map_name, []);
      map.get(m.map_name).push(m.duration_seconds);
    });
    return [...map.entries()].map(([mapa, arr]) => ({
      mapa: mapa || "Sin mapa",
      segundos: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
    }));
  }, [matches]);

  const heatmap = useMemo(() => {
    const grid = DAY_LABELS.map((dia) => ({ dia, horas: Array(24).fill(0) }));
    matches.forEach((m) => {
      const d = new Date(m.played_at);
      const jsDay = d.getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      grid[idx].horas[d.getHours()] += 1;
    });
    return grid;
  }, [matches]);

  const heatmapMax = Math.max(1, ...heatmap.flatMap((row) => row.horas));

  const ultimasVentas = useMemo(() => {
    const userMap = new Map(profiles.map((p) => [p.id, p.username]));
    return [...purchases]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map((p) => ({
        ...p,
        username: userMap.get(p.user_id) || "Usuario eliminado",
      }));
  }, [purchases, profiles]);

  const usuariosRecientes = useMemo(
    () =>
      [...profiles]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10),
    [profiles]
  );

  const tooltipProps = {
    contentStyle: { background: "#161622", border: "1px solid #333", borderRadius: 8 },
    labelStyle: { color: "#ccc", marginBottom: 4 },
    itemStyle: { color: "#fff" },
    cursor: { fill: "rgba(255,255,255,0.04)" },
  };

  if (loading) return <PageLoader />;

  return (
    <main className="admin-panel">
      <nav className="navbar admin-navbar">
        <div className="logo">
          <img src={logoTrip} alt="TRIP" />
          <span className="admin-badge">ADMIN</span>
        </div>
        <div className="nav-links">
          <Link to="/admin">Productos</Link>
          <Link to="/admin/simulacion">Simulación</Link>
          <Link to="/tienda">Ver tienda</Link>
          <Link to="/admin/exportar">Exportar</Link>
          <ProfileMenu />
        </div>
      </nav>

      <section className="admin-content">
        <p className="subtitle admin-subtitle">PANEL DE ADMINISTRACIÓN</p>
        <h1>Resumen general</h1>

        {/* FILTRO DE FECHA */}
        <div className="stats-filters">
          <label>
            Desde
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label>
            Hasta
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
          <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); }}>
            Limpiar filtro
          </button>
          {(dateFrom || dateTo) && (
            <span style={{ color: "#7a7a8c", fontSize: 12 }}>
              Mostrando ventas y partidas del rango seleccionado. Los KPIs y gráficos se recalculan con este filtro.
            </span>
          )}
        </div>

        {/* TARJETAS KPI */}
        <div className="stats-kpis">
          <div className="stats-kpi-card">
            <div className="kpi-icon kpi-icon-purple">🛒</div>
            <div className="kpi-info">
              <span>Ventas totales</span>
              <strong className="kpi-purple">{totalVentas}</strong>
            </div>
          </div>
          <div className="stats-kpi-card">
            <div className="kpi-icon kpi-icon-blue">👥</div>
            <div className="kpi-info">
              <span>Usuarios registrados</span>
              <strong className="kpi-blue">{totalUsuarios}</strong>
            </div>
          </div>
          <div className="stats-kpi-card">
            <div className="kpi-icon kpi-icon-teal">🟢</div>
            <div className="kpi-info">
              <span>Activos este mes</span>
              <strong className="kpi-teal">{usuariosActivosMes}</strong>
            </div>
          </div>
          <div className="stats-kpi-card">
            <div className="kpi-icon kpi-icon-green">💰</div>
            <div className="kpi-info">
              <span>Ingresos totales</span>
              <strong className="kpi-green">${totalIngresos.toFixed(2)}</strong>
            </div>
          </div>
          <div className="stats-kpi-card">
            <div className="kpi-icon kpi-icon-orange">📈</div>
            <div className="kpi-info">
              <span>Retención Día 7</span>
              <strong className="kpi-orange">
                {retencion.find((r) => r.dia === "Día 7")?.retencion ?? 0}%
              </strong>
              <span className={`kpi-semaforo kpi-semaforo-${semaforoRetencion(retencion.find((r) => r.dia === "Día 7")?.retencion ?? 0)}`}>
                {semaforoRetencion(retencion.find((r) => r.dia === "Día 7")?.retencion ?? 0)}
              </span>
            </div>
          </div>
          <div className="stats-kpi-card">
            <div className="kpi-icon kpi-icon-red">🎮</div>
            <div className="kpi-info">
              <span>Partidas jugadas</span>
              <strong className="kpi-red">{partidasJugadasTotal}</strong>
            </div>
          </div>
          <div className="stats-kpi-card">
            <div className="kpi-icon kpi-icon-blue">🎟️</div>
            <div className="kpi-info">
              <span>Ticket promedio</span>
              <strong className="kpi-blue">${ticketPromedio.toFixed(2)}</strong>
            </div>
          </div>
          <div className="stats-kpi-card">
            <div className="kpi-icon kpi-icon-purple">🔁</div>
            <div className="kpi-info">
              <span>Conversión a compra</span>
              <strong className="kpi-purple">{tasaConversion.toFixed(1)}%</strong>
              <span className={`kpi-semaforo kpi-semaforo-${semaforoConversion(tasaConversion)}`}>
                {semaforoConversion(tasaConversion)}
              </span>
            </div>
          </div>
        </div>

        {productoTop && (
          <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
            Producto más vendido:{" "}
            <strong style={{ color: "#fff" }}>
              {productoTop.name} ({productoTop.count} unidades)
            </strong>
          </p>
        )}

        {/* SECCIÓN DE GRÁFICOS */}
        <div className="stats-grid-2col">
          <div className="stats-chart-card">
            <h3>Ventas por año (ingresos)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ventasPorAño}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="año" stroke="#aaa" fontSize={12} />
                <YAxis stroke="#aaa" fontSize={12} />
                <Tooltip {...tooltipProps} />
                <Line type="monotone" dataKey="ingresos" stroke="#8bc34a" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Ventas por mes (últimos 12 meses)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ventasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="mes" stroke="#aaa" fontSize={11} />
                <YAxis stroke="#aaa" fontSize={12} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="ingresos" fill="#9b70ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Usuarios registrados (acumulado por año)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={usuariosPorAño}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="año" stroke="#aaa" fontSize={12} />
                <YAxis stroke="#aaa" fontSize={12} />
                <Tooltip {...tooltipProps} />
                <Line type="monotone" dataKey="usuarios" stroke="#4fc3f7" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Usuarios activos por mes (MAU)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={usuariosActivosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="mes" stroke="#aaa" fontSize={11} />
                <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
                <Tooltip {...tooltipProps} />
                <Area type="monotone" dataKey="activos" stroke="#4fd1c5" fill="#4fd1c5" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Nuevos vs recurrentes (por mes)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={nuevosVsRecurrentes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="mes" stroke="#aaa" fontSize={11} />
                <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="nuevos" stackId="a" fill="#8bc34a" />
                <Bar dataKey="recurrentes" stackId="a" fill="#4fc3f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Tipos de muerte (todos los jugadores)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={tiposDeMuerteGlobal}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {tiposDeMuerteGlobal.map((d) => (
                    <Cell key={d.key} fill={DEATH_COLORS[d.key] || "#888"} />
                  ))}
                </Pie>
                <Tooltip {...tooltipProps} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Tiempo promedio por partida (por mes)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={tiempoPromedioPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="mes" stroke="#aaa" fontSize={11} />
                <YAxis stroke="#aaa" fontSize={12} />
                <Tooltip {...tooltipProps} formatter={(_, __, entry) => entry.payload.label2} />
                <Line type="monotone" dataKey="segundos" stroke="#e8b86d" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Consumo promedio por partida (por mes)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={consumoPromedioPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="mes" stroke="#aaa" fontSize={11} />
                <YAxis stroke="#aaa" fontSize={12} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="consumo" fill="#c77dff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Retención de usuarios</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={retencion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="dia" stroke="#aaa" fontSize={12} />
                <YAxis stroke="#aaa" fontSize={12} unit="%" />
                <Tooltip {...tooltipProps} formatter={(v) => `${v}%`} />
                <Bar dataKey="retencion" fill="#4fc3f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Ranking de mapas más jugados</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rankingMapas} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis type="number" stroke="#aaa" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="mapa" stroke="#aaa" fontSize={12} width={70} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="partidas" fill="#e07b39" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-chart-card">
            <h3>Tiempo promedio para completar cada mapa</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tiempoPorMapa}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="mapa" stroke="#aaa" fontSize={12} />
                <YAxis stroke="#aaa" fontSize={12} />
                <Tooltip {...tooltipProps} formatter={(v) => formatMMSS(v)} />
                <Bar dataKey="segundos" fill="#f06a6a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MAPA DE CALOR */}
        <div className="stats-chart-card stats-full-width">
          <h3>Mapa de calor de actividad (día × hora)</h3>
          <div className="heatmap-scroll">
            <div className="heatmap-grid">
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="heatmap-hour-header">
                  {h}
                </div>
              ))}
              {heatmap.map((row) => (
                <div key={row.dia} style={{ display: "contents" }}>
                  <div className="heatmap-day-label">{row.dia}</div>
                  {row.horas.map((count, h) => (
                    <div
                      key={h}
                      className="heatmap-cell"
                      title={`${row.dia} ${h}:00 — ${count} partidas`}
                      style={{ opacity: count === 0 ? 0.06 : 0.15 + (count / heatmapMax) * 0.85 }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABLAS */}
        <div className="stats-chart-card stats-full-width">
          <h3>Top 10 jugadores (mejores tiempos)</h3>
          <table className="stats-leaderboard">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Usuario</th>
                <th>Mejor tiempo</th>
                <th>Mapa</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={row.id}>
                  <td>{i + 1}</td>
                  <td>{row.username}</td>
                  <td>{formatMMSS(row.duration_seconds)}</td>
                  <td>{row.map_name}</td>
                  <td>{new Date(row.played_at).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "#666", textAlign: "center" }}>
                    Todavía no hay partidas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="stats-chart-card stats-full-width">
          <h3>Últimas ventas</h3>
          <table className="stats-leaderboard">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Producto</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ultimasVentas.map((p) => (
                <tr key={p.id}>
                  <td>{p.username}</td>
                  <td>{p.products?.name || "Producto eliminado"}</td>
                  <td>${p.price_paid}</td>
                  <td>{new Date(p.created_at).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
              {ultimasVentas.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "#666", textAlign: "center" }}>
                    Todavía no hay ventas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="stats-chart-card stats-full-width">
          <h3>Usuarios recientes</h3>
          <table className="stats-leaderboard">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Fecha de registro</th>
              </tr>
            </thead>
            <tbody>
              {usuariosRecientes.map((p) => (
                <tr key={p.id}>
                  <td>{p.username || "Sin nombre"}</td>
                  <td>{p.role === "admin" ? "Admin" : "Jugador"}</td>
                  <td>{new Date(p.created_at).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
              {usuariosRecientes.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "#666", textAlign: "center" }}>
                    Todavía no hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default AdminOverview;