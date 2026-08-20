import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/Loader";
import logoTrip from "../assets/logo_trip.png";

function Game() {
  const { session, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <main>

      <nav className="navbar">
        <div className="logo"><img src={logoTrip} alt="TRIP" /></div>

        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/proyecto">Proyecto</Link>
          <Link to="/login">Iniciar sesión</Link>
        </div>
      </nav>

      <section className="content-page">

        <p className="subtitle">
          VIDEOJUEGO NARRATIVO 2D
        </p>

        <h1>TRIP</h1>

        <p>
          Cada decisión tiene una consecuencia.
          Cada emoción puede cambiar el camino.
        </p>

        <p>
          Acompaña a nuestro protagonista en un viaje
          marcado por decisiones, conflictos emocionales
          y situaciones que pueden transformar su historia.
        </p>

        <Link to="/registro" className="btn-primary">
          Comenzar
        </Link>

      </section>

    </main>
  );
}

export default Game;