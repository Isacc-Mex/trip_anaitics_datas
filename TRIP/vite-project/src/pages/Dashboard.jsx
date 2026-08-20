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
import { useAuth } from "../context/AuthContext";
import PageLoader, { InlineSpinner } from "../components/Loader";
import ProfileMenu from "../components/ProfileMenu";
import logoTrip from "../assets/logo_trip.png";

// ---------- Config / helpers para el dashboard de estadísticas del juego ----------

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
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return "--:--";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatHoursMinutes(totalSeconds) {
  if (!totalSeconds) return "0h 0m";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function Dashboard() {
  const { session, profile, loading: authLoading } = useAuth();

  // ---------- Datos del dashboard completo de estadísticas (game_matches) ----------
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // ---------- Mis compras (historial + gasto del jugador) ----------
  const [myPurchases, setMyPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const loadPurchases = async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, price_paid, created_at, products(name, image_url)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (!error) setMyPurchases(data || []);
      setLoadingPurchases(false);
    };

    loadPurchases();

    // Tiempo real: si el jugador compra algo (en otra pestaña, o el admin
    // le agrega una compra), esta sección se actualiza sola.
    const channel = supabase
      .channel(`my_purchases_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "purchases", filter: `user_id=eq.${userId}` },
        () => loadPurchases()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const gastoTotal = useMemo(
    () => myPurchases.reduce((sum, p) => sum + Number(p.price_paid || 0), 0),
    [myPurchases]
  );

  const productoFavorito = useMemo(() => {
    const counts = {};
    myPurchases.forEach((p) => {
      const key = p.products?.name || "Producto eliminado";
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries.length ? { name: entries[0][0], veces: entries[0][1] } : null;
  }, [myPurchases]);

  useEffect(() => {
    if (!userId) return;

    // Evita que una respuesta "vieja" sobrescriba una más reciente que ya
    // llegó antes (por ejemplo si el componente se desmonta a mitad de la
    // petición).
    let cancelled = false;
    setLoadingStats(true);

    const fetchOnce = async () => {
      const { data: matchData } = await supabase
        .from("game_matches")
        .select("*")
        .eq("user_id", userId)
        .order("played_at", { ascending: true });

      const { data: leaderboardData } = await supabase
        .from("leaderboard_best_times")
        .select("*")
        .limit(10);

      return { matchData: matchData || [], leaderboardData: leaderboardData || [] };
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Justo después de iniciar sesión, la primera consulta a veces llega
    // antes de que la sesión recién creada esté del todo lista y devuelve 0
    // partidas aunque sí existan. Si la primera carga viene vacía,
    // verificamos una vez más antes de dar por bueno el estado vacío; así
    // evitamos el parpadeo de "no hay partidas" seguido del dashboard real.
    const loadStatsInitial = async () => {
      let result = await fetchOnce();

      if (!cancelled && result.matchData.length === 0) {
        await sleep(900);
        if (cancelled) return;
        result = await fetchOnce();
      }

      if (cancelled) return;
      setMatches(result.matchData);
      setLeaderboard(result.leaderboardData);
      setLoadingStats(false);
    };

    // Recargas disparadas por tiempo real (nueva partida insertada): aquí ya
    // no hace falta el reintento, la sesión lleva rato activa.
    const reloadStats = async () => {
      const result = await fetchOnce();
      if (cancelled) return;
      setMatches(result.matchData);
      setLeaderboard(result.leaderboardData);
    };

    loadStatsInitial();

    // Tiempo real: cualquier partida nueva (propia o de otro jugador, por el
    // Top 10 global) hace que el dashboard se vuelva a cargar solo.
    const channel = supabase
      .channel("game_matches_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_matches" },
        () => {
          reloadStats();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ---- KPIs ----
  const tiempoTotalSeg = useMemo(
    () => matches.reduce((sum, m) => sum + (m.duration_seconds || 0), 0),
    [matches]
  );
  const mejorTiempoSeg = useMemo(() => {
    const finished = matches.filter((m) => m.duration_seconds != null);
    if (finished.length === 0) return null;
    return Math.min(...finished.map((m) => m.duration_seconds));
  }, [matches]);
  const partidasJugadas = matches.length;
  const muertesTotal = useMemo(
    () => matches.filter((m) => m.death_type).length,
    [matches]
  );

  // ---- 3. Tiempo de uso por día ----
  const usoPorDia = useMemo(() => {
    const buckets = DAY_LABELS.map((label) => ({ dia: label, minutos: 0 }));
    matches.forEach((m) => {
      const jsDay = new Date(m.played_at).getDay(); // 0 = domingo
      const idx = jsDay === 0 ? 6 : jsDay - 1; // reordena a Lun..Dom
      buckets[idx].minutos += (m.duration_seconds || 0) / 60;
    });
    return buckets.map((b) => ({ ...b, minutos: Math.round(b.minutos) }));
  }, [matches]);

  // ---- 4. Consumos por partida (últimas 6) ----
  const consumosPorPartida = useMemo(() => {
    return matches.slice(-6).map((m, i) => ({
      partida: `P${i + 1}`,
      consumos: m.consumptions || 0,
    }));
  }, [matches]);

  // ---- Agrupación auxiliar por mapa ----
  const porMapa = useMemo(() => {
    const map = new Map();
    matches.forEach((m) => {
      if (!map.has(m.map_name)) {
        map.set(m.map_name, {
          map_name: m.map_name,
          map_number: m.map_number || 0,
          tiempos: [],
          vidas: [],
          danos: [],
          intentos: 0,
        });
      }
      const entry = map.get(m.map_name);
      entry.intentos += 1;
      if (m.duration_seconds != null) entry.tiempos.push(m.duration_seconds);
      if (m.max_health_end != null) entry.vidas.push(m.max_health_end);
      if (m.damage_received != null) entry.danos.push(m.damage_received);
    });
    return [...map.values()].sort((a, b) => a.map_number - b.map_number);
  }, [matches]);

  // ---- 5. Tiempo para completar cada mapa (mejor tiempo por mapa) ----
  const tiempoPorMapa = porMapa.map((m) => ({
    mapa: m.map_name,
    segundos: m.tiempos.length ? Math.min(...m.tiempos) : 0,
    label: m.tiempos.length ? formatMMSS(Math.min(...m.tiempos)) : "--:--",
  }));

  // ---- 6. Intentos por mapa ----
  const intentosPorMapa = porMapa.map((m) => ({ mapa: m.map_name, intentos: m.intentos }));

  // ---- 7. Vida máxima al finalizar por mapa ----
  const vidaPorMapa = porMapa.map((m) => ({
    mapa: m.map_name,
    vida: m.vidas.length
      ? Math.round(m.vidas.reduce((a, b) => a + b, 0) / m.vidas.length)
      : 0,
  }));

  // ---- 8. Daño recibido por mapa ----
  const danoPorMapa = porMapa.map((m) => ({
    mapa: m.map_name,
    dano: m.danos.length
      ? Math.round(m.danos.reduce((a, b) => a + b, 0) / m.danos.length)
      : 0,
  }));

  // ---- 11. Distribución del tiempo por mapa ----
  const distribucionTiempo = useMemo(() => {
    const total = porMapa.reduce(
      (sum, m) => sum + m.tiempos.reduce((a, b) => a + b, 0),
      0
    );
    if (!total) return [];
    return porMapa.map((m) => ({
      mapa: m.map_name,
      value: Math.round((m.tiempos.reduce((a, b) => a + b, 0) / total) * 100),
    }));
  }, [porMapa]);

  // ---- 2. Tipos de muerte ----
  const tiposDeMuerte = useMemo(() => {
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

  // ---- 10. Progreso de mejora (mejor tiempo acumulado) ----
  const progresoMejora = useMemo(() => {
    let best = Infinity;
    const points = [];
    matches.forEach((m) => {
      if (m.duration_seconds == null) return;
      if (m.duration_seconds < best) {
        best = m.duration_seconds;
        points.push({
          partida: `Partida ${points.length + 1}`,
          segundos: best,
          label: formatMMSS(best),
        });
      }
    });
    return points.slice(-8);
  }, [matches]);

  // ---- 12. Historial de partidas por semana ----
  const historialSemanal = useMemo(() => {
    if (matches.length === 0) return [];
    const first = new Date(matches[0].played_at);
    const buckets = new Map();
    matches.forEach((m) => {
      const diffDays = Math.floor((new Date(m.played_at) - first) / (1000 * 60 * 60 * 24));
      const week = Math.floor(diffDays / 7) + 1;
      buckets.set(week, (buckets.get(week) || 0) + 1);
    });
    const maxWeek = Math.max(...buckets.keys());
    const result = [];
    for (let w = 1; w <= maxWeek; w++) {
      result.push({ semana: `Semana ${w}`, partidas: buckets.get(w) || 0 });
    }
    return result;
  }, [matches]);

  const tooltipProps = {
    contentStyle: { background: "#161622", border: "1px solid #333", borderRadius: 8 },
    labelStyle: { color: "#ccc", marginBottom: 4 },
    itemStyle: { color: "#fff" },
    cursor: { fill: "rgba(255,255,255,0.04)" },
  };
  const PIE_COLORS = ["#4fc3f7", "#9b70ff", "#e8b86d", "#4fd1c5", "#f06a6a"];

  if (authLoading) {
    return <PageLoader />;
  }

  return (
    <main className="dashboard">
      <nav className="navbar">
        <div className="logo"><img src={logoTrip} alt="TRIP" /></div>
        <div className="nav-links">
          {profile?.role === "admin" && <Link to="/admin">Admin</Link>}
          <Link to="/tienda">Tienda</Link>
          <ProfileMenu />
        </div>
      </nav>

      <section className="dashboard-content">
        <p className="subtitle">PERFIL DEL JUGADOR</p>
        <h1>Hola, {profile?.username || "viajero"}</h1>

        {/* ---------- Mis compras ---------- */}
        <div className="stats-dashboard">
          <h2 className="stats-title">Mis compras</h2>

          {loadingPurchases && (
            <p style={{ color: "#999", padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <InlineSpinner /> Cargando tus compras...
            </p>
          )}

          {!loadingPurchases && myPurchases.length === 0 && (
            <div className="stats-empty">
              Todavía no has comprado ningún artículo. Visita la{" "}
              <Link to="/tienda">tienda</Link> para ver lo disponible.
            </div>
          )}

          {!loadingPurchases && myPurchases.length > 0 && (
            <>
              <div className="stats-kpis">
                <div className="stats-kpi-card">
                  <div className="kpi-icon kpi-icon-green">💰</div>
                  <div className="kpi-info">
                    <span>Gasto total</span>
                    <strong className="kpi-green">${gastoTotal.toFixed(2)}</strong>
                  </div>
                </div>
                <div className="stats-kpi-card">
                  <div className="kpi-icon kpi-icon-purple">🛍️</div>
                  <div className="kpi-info">
                    <span>Artículos comprados</span>
                    <strong className="kpi-purple">{myPurchases.length}</strong>
                  </div>
                </div>
                <div className="stats-kpi-card">
                  <div className="kpi-icon kpi-icon-blue">⭐</div>
                  <div className="kpi-info">
                    <span>Favorito</span>
                    <strong className="kpi-blue" style={{ fontSize: 15 }}>
                      {productoFavorito ? productoFavorito.name : "—"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="stats-chart-card stats-full-width">
                <h3>Historial de compras</h3>
                <table className="stats-leaderboard">
                  <thead>
                    <tr>
                      <th>Artículo</th>
                      <th>Monto pagado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPurchases.map((p) => (
                      <tr key={p.id}>
                        <td>{p.products?.name || "Producto eliminado"}</td>
                        <td>${Number(p.price_paid).toFixed(2)}</td>
                        <td>{new Date(p.created_at).toLocaleDateString("es-MX")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* ---------- Dashboard completo de estadísticas del jugador ---------- */}

        {loadingStats && (
          <p style={{ color: "#999", padding: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <InlineSpinner /> Cargando estadísticas...
          </p>
        )}

        {!loadingStats && matches.length === 0 && (
          <div className="stats-empty">
            Todavía no hay partidas registradas. Juega una partida para ver tus estadísticas aquí.
          </div>
        )}

        {!loadingStats && matches.length > 0 && (
          <div className="stats-dashboard">
            <h2 className="stats-title">Dashboard completo de estadísticas del jugador</h2>

            <div className="stats-kpis">
              <div className="stats-kpi-card">
                <div className="kpi-icon kpi-icon-blue">🕐</div>
                <div className="kpi-info">
                  <span>Tiempo total</span>
                  <strong className="kpi-blue">{formatHoursMinutes(tiempoTotalSeg)}</strong>
                </div>
              </div>
              <div className="stats-kpi-card">
                <div className="kpi-icon kpi-icon-green">⏱️</div>
                <div className="kpi-info">
                  <span>Mejor tiempo</span>
                  <strong className="kpi-green">{formatMMSS(mejorTiempoSeg)}</strong>
                </div>
              </div>
              <div className="stats-kpi-card">
                <div className="kpi-icon kpi-icon-purple">🎮</div>
                <div className="kpi-info">
                  <span>Partidas jugadas</span>
                  <strong className="kpi-purple">{partidasJugadas}</strong>
                </div>
              </div>
              <div className="stats-kpi-card">
                <div className="kpi-icon kpi-icon-red">💀</div>
                <div className="kpi-info">
                  <span>Muertes total</span>
                  <strong className="kpi-red">{muertesTotal}</strong>
                </div>
              </div>
            </div>

            <div className="stats-grid-2col">
              <div className="stats-chart-card">
                <h3>Tiempo de uso por día (minutos)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={usoPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="dia" stroke="#aaa" fontSize={12} />
                    <YAxis stroke="#aaa" fontSize={12} />
                    <Tooltip {...tooltipProps} />
                    <Area type="monotone" dataKey="minutos" stroke="#4fc3f7" fill="#4fc3f7" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-chart-card">
                <h3>Vida máxima al finalizar por mapa</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={vidaPorMapa}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="mapa" stroke="#aaa" fontSize={12} />
                    <YAxis stroke="#aaa" fontSize={12} domain={[0, 100]} />
                    <Tooltip {...tooltipProps} />
                    <Line type="monotone" dataKey="vida" stroke="#8bc34a" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-chart-card">
                <h3>Consumos por partida</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={consumosPorPartida}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="partida" stroke="#aaa" fontSize={12} />
                    <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
                    <Tooltip {...tooltipProps} />
                    <Bar dataKey="consumos" fill="#c77dff" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-chart-card">
                <h3>Tiempo para completar mapa</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={tiempoPorMapa} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis type="number" stroke="#aaa" fontSize={12} />
                    <YAxis type="category" dataKey="mapa" stroke="#aaa" fontSize={12} width={70} />
                    <Tooltip {...tooltipProps} formatter={(_, __, entry) => entry.payload.label} />
                    <Bar dataKey="segundos" fill="#e8b86d" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-chart-card">
                <h3>Porcentaje de tipos de muerte</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={tiposDeMuerte} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                      {tiposDeMuerte.map((d) => (
                        <Cell key={d.key} fill={DEATH_COLORS[d.key] || "#888"} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipProps} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-chart-card">
                <h3>Intentos por mapa</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={intentosPorMapa}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="mapa" stroke="#aaa" fontSize={12} />
                    <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
                    <Tooltip {...tooltipProps} />
                    <Bar dataKey="intentos" fill="#e07b39" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-chart-card">
                <h3>Progreso de mejora (mejor tiempo)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={progresoMejora}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="partida" stroke="#aaa" fontSize={11} />
                    <YAxis stroke="#aaa" fontSize={12} reversed />
                    <Tooltip {...tooltipProps} formatter={(_, __, entry) => entry.payload.label} />
                    <Line type="monotone" dataKey="segundos" stroke="#4fd1c5" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-chart-card">
                <h3>Daño recibido por mapa</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={danoPorMapa}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="mapa" stroke="#aaa" fontSize={12} />
                    <YAxis stroke="#aaa" fontSize={12} />
                    <Tooltip {...tooltipProps} />
                    <Bar dataKey="dano" fill="#f06a6a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-chart-card">
                <h3>Distribución del tiempo por mapa</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={distribucionTiempo}
                      dataKey="value"
                      nameKey="mapa"
                      outerRadius={80}
                      label={({ value, x, y }) => (
                        <text x={x} y={y} fill="#fff" fontSize={12} textAnchor="middle">
                          {value}%
                        </text>
                      )}
                    >
                      {distribucionTiempo.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipProps} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stats-chart-card stats-full-width">
              <h3>Historial de partidas jugadas por semana</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={historialSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="semana" stroke="#aaa" fontSize={12} />
                  <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
                  <Tooltip {...tooltipProps} />
                  <Area type="monotone" dataKey="partidas" stroke="#9b70ff" fill="#9b70ff" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="stats-chart-card stats-full-width">
              <h3>Top 10 mejores tiempos (récords globales)</h3>
              <table className="stats-leaderboard">
                <thead>
                  <tr>
                    <th>Posición</th>
                    <th>Usuario</th>
                    <th>Mapa</th>
                    <th>Mejor tiempo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => (
                    <tr key={row.id} className={row.user_id === session.user.id ? "stats-row-me" : ""}>
                      <td>{i + 1}</td>
                      <td>{row.username}</td>
                      <td>{row.map_name}</td>
                      <td>{formatMMSS(row.duration_seconds)}</td>
                      <td>{new Date(row.played_at).toLocaleDateString("es-MX")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Dashboard;