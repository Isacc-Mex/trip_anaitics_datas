import { Link } from "react-router-dom";
import logoTrip from "../assets/logo_trip.png";

function Terminos() {
  return (
    <main>
      <nav className="navbar">
        <div className="logo">
          <img src={logoTrip} alt="TRIP" />
        </div>

        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/privacidad">Política de Privacidad</Link>
          <Link to="/login">Iniciar sesión</Link>
        </div>
      </nav>

      <section className="content-page">
        <p className="subtitle">TRIP</p>

        <h1>Términos y Condiciones</h1>

        <h2>1. INFORMACIÓN GENERAL</h2>

        <p>
          Este sitio web es operado por TRIP. Al acceder, registrarse o
          realizar una compra en nuestra plataforma, el usuario acepta los
          presentes Términos y Condiciones.
        </p>

        <p>
          <strong>Sitio web:</strong> www.trip.com
          <br />
          <strong>Correo electrónico:</strong> soporte@trip.com
          <br />
          <strong>Dirección:</strong> Av. Universidad Tecnológica No. 1000,
          Tierra Negra, 73080 Xicotepec de Juárez, Puebla, México.
        </p>

        <h2>2. PRODUCTOS Y SERVICIOS</h2>

        <p>
          TRIP ofrece videojuegos en formato digital, así como información
          relacionada con cada título, incluyendo descripciones, imágenes,
          requisitos mínimos y recomendados, calificaciones y estadísticas
          de uso.
        </p>

        <p>
          Nos esforzamos por mantener la información actualizada; sin embargo,
          algunos datos, imágenes o estadísticas pueden variar conforme los
          desarrolladores publiquen nuevas versiones o actualizaciones.
        </p>

        <p>
          La compra de un videojuego otorga al usuario una licencia personal
          e intransferible para su uso conforme a las condiciones establecidas
          por el desarrollador del juego.
        </p>

        <h2>3. CUENTAS DE USUARIO</h2>

        <p>
          Para acceder a determinadas funciones de la plataforma, el usuario
          deberá crear una cuenta proporcionando información veraz y actualizada.
        </p>

        <p>
          El usuario es responsable de mantener la confidencialidad de sus
          credenciales de acceso y de todas las actividades realizadas desde
          su cuenta.
        </p>

        <p>
          TRIP podrá suspender o cancelar cuentas que incumplan estos términos
          o realicen actividades fraudulentas.
        </p>

        <h2>4. PRECIOS Y PAGOS</h2>

        <p>
          Todos los precios publicados se expresan en pesos mexicanos (MXN)
          e incluyen los impuestos aplicables cuando corresponda.
        </p>

        <p>
          Los precios pueden modificarse sin previo aviso. El precio vigente
          será el mostrado al momento de confirmar la compra.
        </p>

        <p>
          Los pagos son procesados mediante plataformas seguras de pago.
        </p>

        <h2>5. ENTREGA DIGITAL</h2>

        <p>
          Los videojuegos adquiridos serán entregados de forma digital
          mediante descarga, clave de activación o acceso desde la cuenta
          del usuario.
        </p>

        <p>
          En condiciones normales, la entrega se realiza inmediatamente
          después de confirmarse el pago.
        </p>

        <p>
          En caso de fallas técnicas o problemas con el procesamiento del
          pago, la entrega podrá retrasarse mientras se verifica la
          transacción.
        </p>

        <h2>6. POLÍTICA DE DEVOLUCIONES</h2>

        <p>
          Aceptamos solicitudes de revisión dentro de los primeros 7 días
          naturales posteriores a la compra.
        </p>

        <h3>6.1 Procedimiento de devolución</h3>

        <p>
          <strong>1.</strong> Los videojuegos digitales no son reembolsables
          una vez que hayan sido activados, descargados o utilizados.
        </p>

        <p>
          <strong>2.</strong> Si existe un problema técnico que impida el
          acceso al videojuego, el usuario deberá contactar al equipo de
          soporte proporcionando:
        </p>

        <ul>
          <li>Número de pedido.</li>
          <li>Descripción del problema.</li>
          <li>Evidencia del error (capturas de pantalla o video).</li>
        </ul>

        <p>
          <strong>3.</strong> La solicitud será revisada en un plazo de
          3 a 5 días hábiles.
        </p>

        <p>
          <strong>4.</strong> Si el problema es atribuible a TRIP, podrá
          ofrecerse:
        </p>

        <ul>
          <li>Reemplazo de la clave de activación.</li>
          <li>Corrección del problema.</li>
          <li>Reembolso parcial o total, cuando corresponda.</li>
        </ul>

        <p>
          <strong>5.</strong> No procederán devoluciones por incompatibilidad
          del equipo, compras equivocadas o cambio de opinión después de
          haber activado el producto.
        </p>

        <h3>6.2 Condiciones</h3>

        <p>
          Para solicitar una devolución deberán cumplirse las siguientes
          condiciones:
        </p>

        <ul>
          <li>Presentar el comprobante de compra.</li>
          <li>Realizar la solicitud dentro del plazo establecido.</li>
          <li>No haber utilizado indebidamente el producto.</li>
          <li>
            Proporcionar la información necesaria para verificar la compra.
          </li>
        </ul>

        <p>
          Todas las solicitudes serán evaluadas individualmente.
        </p>

        <h2>7. SEGURIDAD</h2>

        <p>
          TRIP implementa medidas de seguridad para proteger la información
          de los usuarios, incluyendo el uso de conexiones cifradas
          (HTTPS/SSL), autenticación de usuarios y protección de la
          información almacenada.
        </p>

        <p>
          Aunque aplicamos buenas prácticas de seguridad, ningún sistema
          conectado a Internet puede garantizar una protección absoluta
          contra accesos no autorizados.
        </p>

        <p>
          El usuario también es responsable de mantener segura su contraseña
          y evitar compartir sus credenciales con terceros.
        </p>

        <h2>8. PRIVACIDAD Y PROTECCIÓN DE DATOS</h2>

        <p>
          La información personal proporcionada será utilizada únicamente
          para:
        </p>

        <ul>
          <li>Crear y administrar la cuenta del usuario.</li>
          <li>Procesar compras.</li>
          <li>Brindar soporte técnico.</li>
          <li>Mostrar el historial de compras y estadísticas del usuario.</li>
          <li>Mejorar la experiencia dentro de la plataforma.</li>
        </ul>

        <p>
          Los datos personales serán tratados conforme a la legislación
          aplicable en materia de protección de datos.
        </p>

        <h2>9. PROPIEDAD INTELECTUAL</h2>

        <p>
          Todo el contenido de TRIP, incluyendo logotipos, diseño, interfaz,
          textos, imágenes, código fuente y elementos gráficos, está protegido
          por las leyes de propiedad intelectual.
        </p>

        <p>
          Queda prohibida su reproducción, distribución o modificación sin
          autorización previa.
        </p>

        <p>
          Las marcas, nombres y videojuegos pertenecen a sus respectivos
          propietarios.
        </p>

        <h2>10. LIMITACIÓN DE RESPONSABILIDAD</h2>

        <p>
          TRIP no será responsable por daños, pérdidas o perjuicios directos,
          indirectos, incidentales o consecuentes derivados del uso o la
          imposibilidad de uso de la plataforma o de los videojuegos adquiridos.
        </p>

        <p>
          En particular, TRIP no será responsable por situaciones como las
          siguientes:
        </p>

        <ul>
          <li>
            Problemas ocasionados por equipos que no cumplan con los requisitos
            mínimos o recomendados del videojuego.
          </li>

          <li>
            Errores, fallos o incompatibilidades provocados por modificaciones
            realizadas por el usuario en su sistema operativo, hardware o
            software.
          </li>

          <li>
            Interrupciones temporales del servicio debido a mantenimiento,
            actualizaciones, fallas en servidores, cortes de energía o
            problemas en la conexión a Internet.
          </li>

          <li>
            Retrasos en la entrega del producto ocasionados por fallas en
            plataformas de pago, proveedores de servicios o cualquier tercero
            ajeno a TRIP.
          </li>

          <li>
            Pérdida de información, progreso, partidas guardadas o
            configuraciones del videojuego cuando sean consecuencia de fallas
            del dispositivo del usuario, eliminación accidental de archivos
            o problemas del desarrollador del juego.
          </li>

          <li>
            Uso indebido de la cuenta por parte del usuario, incluyendo el
            intercambio de credenciales, el acceso por terceros o la falta
            de protección de la contraseña.
          </li>

          <li>
            Daños derivados del uso de software de terceros, modificaciones
            no autorizadas (mods), programas externos o herramientas que
            alteren el funcionamiento normal del videojuego.
          </li>
        </ul>

        <p>
          Asimismo, TRIP no garantiza que la plataforma esté disponible de
          forma ininterrumpida o libre de errores en todo momento, aunque
          realizará esfuerzos razonables para mantener su correcto
          funcionamiento y resolver cualquier incidencia en el menor tiempo
          posible.
        </p>

        <p>
          La responsabilidad total de TRIP, en cualquier reclamación
          relacionada con una compra realizada en la plataforma, estará
          limitada al importe efectivamente pagado por el usuario por el
          producto objeto de la reclamación.
        </p>

        <h2>11. MODIFICACIONES DE LOS TÉRMINOS</h2>

        <p>
          Nos reservamos el derecho de modificar estos Términos y Condiciones
          en cualquier momento.
        </p>

        <p>
          Las modificaciones entrarán en vigor desde su publicación en el
          sitio web.
        </p>

        <p>
          <strong>Última actualización:</strong> 26 de junio de 2026.
        </p>

        <p>
          Para más información sobre cómo tratamos tus datos, consulta nuestra{" "}
          <Link to="/privacidad">Política de Privacidad</Link>.
        </p>
      </section>
    </main>
  );
}

export default Terminos;
