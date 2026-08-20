import { Link } from "react-router-dom";
import logoTrip from "../assets/logo_trip.png";

function Privacidad() {
  return (
    <main>
      <nav className="navbar">
        <div className="logo"><img src={logoTrip} alt="TRIP" /></div>

        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/terminos">Términos y Condiciones</Link>
          <Link to="/login">Iniciar sesión</Link>
        </div>
      </nav>

      <section className="content-page">
        <p className="subtitle">TRIP</p>

        <h1>Aviso de Privacidad Integral</h1>
        <p className="legal-intro"><strong>Pixel Path - TRIP</strong></p>

        {/* Tabla resumen del responsable */}
        <div className="privacy-summary-table" style={{ marginBottom: "30px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: "bold", padding: "8px", borderBottom: "1px solid #333" }}>Responsable:</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #333" }}>Pixel Path</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", padding: "8px", borderBottom: "1px solid #333" }}>Proyecto:</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #333" }}>TRIP</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", padding: "8px", borderBottom: "1px solid #333" }}>Domicilio:</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #333" }}>Xicotepec de Juárez, Puebla, México</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", padding: "8px", borderBottom: "1px solid #333" }}>Correo de privacidad:</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #333" }}><a href="mailto:trip@pixelpath.com" style={{ color: "#a77aff" }}>trip@pixelpath.com</a></td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", padding: "8px", borderBottom: "1px solid #333" }}>Última actualización:</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #333" }}>23 de junio de 2026</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Secciones Legales */}
        <h2>1. Identidad y domicilio del responsable</h2>
        <p>
          Pixel Path es responsable del tratamiento, uso, resguardo y protección de los datos
          personales que sean proporcionados por las personas usuarias a través del sitio
          web, formularios, redes sociales, demos, encuestas, plataformas, registros,
          comunicaciones o cualquier otro medio relacionado con el videojuego TRIP.
        </p>
        <p>
          Para efectos de contacto, atención de solicitudes y ejercicio de derechos
          relacionados con datos personales, Pixel Path señala como domicilio de
          referencia: Universidad Tecnológica de Xicotepec de Juárez, Av. Universidad Tecnológica No. 1000, Tierra Negra, 73080 Xicotepec de Juárez, Pue., México.
        </p>

        <h2>2. Marco normativo de referencia</h2>
        <p>
          Este aviso de privacidad se emite tomando como referencia la Ley Federal de
          Protección de Datos Personales en Posesión de los Particulares, su Reglamento y
          los Lineamientos del Aviso de Privacidad aplicables en México. Su finalidad es
          informar de manera clara qué datos se recaban, para qué se utilizan, cómo se protegen y cuáles son los medios para ejercer los derechos de acceso, rectificación, cancelación y oposición.
        </p>

        <h2>3. Datos personales que podrán recabarse</h2>
        <p>Pixel Path podrá recabar, de forma directa o indirecta, los siguientes datos personales:</p>
        <ul>
          <li>Nombre o alias de usuario.</li>
          <li>Correo electrónico.</li>
          <li>Número telefónico, si el usuario lo proporciona voluntariamente.</li>
          <li>Edad o rango de edad.</li>
          <li>País, estado o ciudad de residencia.</li>
          <li>Comentarios, opiniones, respuestas en formularios o encuestas.</li>
          <li>Datos de navegación dentro del sitio web o plataforma.</li>
          <li>Información técnica básica, como tipo de dispositivo, sistema operativo, navegador y registros de uso.</li>
          <li>Datos relacionados con la experiencia dentro de TRIP, como progreso, puntuaciones, tiempo de juego, decisiones, eventos internos, errores y estadísticas de interacción.</li>
        </ul>

        <h2>4. Datos personales sensibles</h2>
        <p>
          Pixel Path no solicitará datos personales sensibles como requisito obligatorio para acceder a TRIP o a sus plataformas.
        </p>
        <p>
          No obstante, debido a que TRIP aborda temas relacionados con adicciones, emociones, salud mental, toma de decisiones y experiencias personales, es posible que algunas personas usuarias compartan voluntariamente información sensible en formularios, encuestas, comentarios, pruebas o procesos de retroalimentación.
        </p>
        <p>
          En caso de tratar datos personales sensibles, Pixel Path procurará solicitar el consentimiento correspondiente y utilizarlos solo para finalidades vinculadas con mejora de la experiencia, análisis estadístico, investigación interna, accesibilidad, seguridad, concientización social o desarrollo del proyecto. La regla será recolectar lo mínimo necesario: menos datos, menos riesgo.
        </p>

        <h2>5. Finalidades principales del tratamiento</h2>
        <p>Los datos personales podrán utilizarse para las siguientes finalidades necesarias:</p>
        <ul>
          <li>Registrar, identificar y administrar personas usuarias.</li>
          <li>Permitir el acceso a demos, plataformas, formularios, pruebas o versiones de TRIP.</li>
          <li>Brindar soporte técnico y atención a solicitudes.</li>
          <li>Dar seguimiento a reportes, dudas, comentarios o retroalimentación.</li>
          <li>Analizar el funcionamiento del videojuego y mejorar la experiencia de usuario.</li>
          <li>Generar estadísticas internas sobre uso, progreso, desempeño o interacción.</li>
          <li>Mejorar narrativa, mecánicas, accesibilidad, rendimiento y seguridad de TRIP.</li>
          <li>Evaluar el impacto social, educativo o de concientización del proyecto.</li>
          <li>Prevenir uso indebido, fraude, accesos no autorizados o incidentes de seguridad.</li>
          <li>Cumplir obligaciones legales aplicables.</li>
        </ul>

        <h2>6. Finalidades secundarias</h2>
        <p>De manera adicional, los datos personales podrán utilizarse para finalidades no indispensables, tales como:</p>
        <ul>
          <li>Enviar noticias, actualizaciones o avances de Pixel Path y TRIP.</li>
          <li>Invitar a pruebas beta, encuestas, eventos, lanzamientos o actividades académicas.</li>
          <li>Compartir comunicados promocionales, informativos o de comunidad.</li>
          <li>Realizar estudios internos de satisfacción o preferencia.</li>
        </ul>
        <p>
          La persona titular puede negarse al tratamiento de sus datos para finalidades secundarias enviando una solicitud al correo: <a href="mailto:trip@pixelpath.com" style={{ color: "#a77aff" }}>trip@pixelpath.com</a>.
        </p>

        <h2>7. Transferencias de datos personales</h2>
        <p>
          Pixel Path no venderá, rentará ni comercializará los datos personales de las personas usuarias.
        </p>
        <p>
          Los datos podrán compartirse únicamente cuando sea necesario con proveedores de servicios tecnológicos, plataformas de alojamiento web, almacenamiento, analítica, distribución digital, soporte técnico o autoridades competentes cuando exista una obligación legal.
        </p>
        <p>
          Cuando se realicen transferencias que requieran consentimiento, Pixel Path procurará solicitarlo previamente y limitar la información compartida a lo estrictamente necesario.
        </p>

        <h2>8. Medidas de seguridad</h2>
        <p>
          Pixel Path implementará medidas administrativas, técnicas y físicas razonables para proteger los datos personales contra pérdida, alteración, destrucción, acceso no autorizado, uso indebido o divulgación.
        </p>
        <p>
          Entre estas medidas podrán incluirse controles de acceso, contraseñas seguras, restricción de permisos, respaldos, cifrado cuando sea aplicable, revisión de seguridad, minimización de datos, separación de información sensible y eliminación o anonimización cuando ya no sea necesaria.
        </p>

        <h2>9. Derechos ARCO</h2>
        <p>
          La persona titular tiene derecho a acceder a sus datos personales, rectificarlos cuando sean inexactos o incompletos, cancelarlos cuando considere que no son necesarios y oponerse a su uso para finalidades específicas. Estos derechos son conocidos como derechos ARCO.
        </p>
        <p>
          Para ejercerlos, la persona titular deberá enviar una solicitud al correo: <a href="mailto:trip@pixelpath.com" style={{ color: "#a77aff" }}>trip@pixelpath.com</a>.
        </p>
        <p>
          La solicitud deberá incluir nombre completo o alias registrado, medio de contacto, derecho que desea ejercer, descripción clara de la solicitud y, cuando sea necesario, documento o elemento que permita acreditar identidad o titularidad de la cuenta. Pixel Path dará respuesta en un plazo máximo de 20 días hábiles.
        </p>

        <h2>10. Revocación del consentimiento</h2>
        <p>
          La persona titular podrá revocar en cualquier momento el consentimiento otorgado para el tratamiento de sus datos personales mediante solicitud enviada al correo de privacidad.
        </p>
        <p>
          La revocación podrá limitar el acceso a ciertas funciones, servicios, pruebas, encuestas o beneficios relacionados con TRIP cuando el tratamiento de datos sea necesario para prestarlos.
        </p>

        <h2>11. Uso de cookies y tecnologías similares</h2>
        <p>
          El sitio web o plataforma de Pixel Path podrá utilizar cookies, píxeles, etiquetas, identificadores o tecnologías similares para recordar preferencias, mejorar la navegación, analizar uso, medir rendimiento y generar estadísticas internas.
        </p>
        <p>
          La persona usuaria puede deshabilitar cookies desde la configuración de su navegador. Sin embargo, algunas funciones podrían operar de forma limitada.
        </p>

        <h2>12. Conservación, bloqueo y eliminación de datos</h2>
        <p>
          Los datos personales serán conservados durante el tiempo necesario para cumplir con las finalidades descritas en este aviso o mientras exista una relación activa con la persona usuaria.
        </p>
        <p>
          Una vez cumplidas dichas finalidades, los datos podrán ser eliminados, bloqueados o anonimizados, salvo que exista una obligación legal para conservarlos por un periodo mayor.
        </p>

        <h2>13. Menores de edad</h2>
        <p>
          Si TRIP o sus plataformas fueran utilizados por personas menores de edad, Pixel Path procurará recabar solamente los datos indispensables y, cuando corresponda, solicitar autorización de madre, padre, tutor o representante legal.
        </p>
        <p>
          El proyecto no buscará explotar información de menores ni utilizarla para fines ajenos a la experiencia, seguridad, soporte o mejora del servicio.
        </p>

        <h2>14. Cambios al aviso de privacidad</h2>
        <p>
          Pixel Path podrá modificar este aviso de privacidad por cambios legales, técnicos, operativos, académicos o por mejoras en TRIP y sus plataformas.
        </p>
        <p>
          Las actualizaciones se pondrán a disposición por medios digitales, sitio web, plataforma, formulario o cualquier otro canal oficial de Pixel Path.
        </p>

        <h2>15. Contacto</h2>
        <p>
          <strong>Responsable:</strong> Pixel Path<br />
          <strong>Proyecto:</strong> TRIP<br />
          <strong>Domicilio de referencia:</strong> Universidad Tecnológica de Xicotepec de Juárez, Av. Universidad Tecnológica No. 1000 Tierra Negra, 73080 Xicotepec de Juárez, Pue., México.<br />
          <strong>Correo de privacidad:</strong> <a href="mailto:trip@pixelpath.com" style={{ color: "#a77aff" }}>trip@pixelpath.com</a>
        </p>

        <p style={{ marginTop: "40px" }}>
          También puedes consultar nuestros{" "}
          <Link to="/terminos" style={{ color: "#a77aff" }}>Términos y Condiciones</Link>.
        </p>
      </section>
    </main>
  );
}

export default Privacidad;