// Spinner de página completa: reemplaza los "Cargando..." planos que
// generaban un pantallazo negro/blanco sin animación entre pantallas.
function PageLoader({ label = "Cargando..." }) {
  return (
    <div className="page-loader">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

// Spinner chico para usar en línea (dentro de botones, barras, textos)
// donde no tiene sentido ocupar toda la pantalla.
export function InlineSpinner({ size = 16 }) {
  return (
    <span
      className="inline-spinner"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export default PageLoader;