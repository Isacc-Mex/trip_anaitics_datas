import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/Loader";
import logoTrip from "../assets/logo_trip.png";
import personajeTrip from "../assets/personaje_trip.png";

function Home() {
  const { session, profile, loading } = useAuth();

  if (loading) return <PageLoader />;

  // Si hay sesión, esperamos a que el perfil (y su rol) termine de cargar
  // antes de decidir a dónde mandarlo.
  if (session && !profile) return <PageLoader />;

  if (session && profile) {
    return (
      <Navigate to={profile.role === "admin" ? "/dashboard_admin" : "/dashboard"} replace />
    );
  }

  return (
    <main className="home">

      <nav className="navbar">
        <div className="logo"><img src={logoTrip} alt="TRIP" /></div>
        <div className="nav-links">
    
          <Link to="/proyecto">Proyecto</Link>
          <Link to="/juego">Videojuego</Link>
          <Link to="/login">Iniciar sesión</Link>
        </div>
      </nav>

      <section className="hero">

        <div className="hero-content">

          <p className="subtitle">
            PIXEL PATH PRESENTA
          </p>

          <h1>TRIP</h1>

          <h2>
            Un viaje que puede cambiarlo todo.
          </h2>

          <p>
            Una experiencia narrativa 2D donde cada decisión
            puede cambiar la historia, las emociones y el camino
            de nuestro protagonista.
          </p>

          <div className="hero-buttons">
            <Link to="/juego" className="btn-primary">
              Conocer TRIP
            </Link>

            <Link to="/registro" className="btn-secondary">
              Crear cuenta
            </Link>
          </div>

        </div>

        <div className="hero-image">
          <img src={personajeTrip} alt="Personaje de TRIP" />
        </div>

      </section>

    </main>
  );
}

export default Home;