import { Link } from "react-router-dom";
import logoTrip from "../assets/logo_trip.png";
import videoIntro from "../assets/video_intro.mp4";

function About() {
  return (
    <main className="game-page">

      <video
        className="game-bg-video"
        src={videoIntro}
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="game-bg-overlay" />

      <nav className="navbar">
        <div className="logo"><img src={logoTrip} alt="TRIP" /></div>

        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/juego">Videojuego</Link>
          <Link to="/login">Iniciar sesión</Link>
          
        </div>
      </nav>

      <section className="content-page">

        <p className="subtitle">
          PIXEL PATH
        </p>

        <h1>Sobre TRIP</h1>

        <p>
          TRIP es un videojuego narrativo 2D de enfoque
          psicológico y social que busca generar conciencia
          sobre las adicciones y las heridas emocionales
          que pueden existir detrás de ellas.
        </p>

        <p>
          A través de una experiencia interactiva, el jugador
          acompaña a un personaje en un viaje marcado por
          decisiones, consecuencias y cambios emocionales.
        </p>

        <p>
          TRIP no pretende sustituir la ayuda profesional
          ni ofrecer una solución médica. Su propósito es
          fomentar la reflexión, la empatía y la prevención.
        </p>

      </section>

    </main>
  );
}

export default About;