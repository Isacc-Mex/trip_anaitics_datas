import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import ProfileMenu from "../components/ProfileMenu";
import { InlineSpinner } from "../components/Loader";
import logoTrip from "../assets/logo_trip.png";

// Los productos tipo "mesh" se pueden comprar varias veces. El resto
// (juego, asset, otro) es de una sola compra por usuario.
function isRepeatable(type) {
  return type === "mesh";
}

function Store() {
  const { session, profile } = useAuth();

  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [boughtId, setBoughtId] = useState(null);
  const [ownedProductIds, setOwnedProductIds] = useState(new Set());

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const loadOwnedProducts = async () => {
    if (!session) {
      setOwnedProductIds(new Set());
      return;
    }
    const { data } = await supabase
      .from("purchases")
      .select("product_id")
      .eq("user_id", session.user.id);
    setOwnedProductIds(new Set((data || []).map((p) => p.product_id)));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadOwnedProducts();
  }, [session]);

  const isAdmin = profile?.role === "admin";

  const handleBuy = async (product) => {
    if (!session) {
      alert("Inicia sesión para comprar.");
      return;
    }

    if (isAdmin) {
      alert("Las cuentas de administrador no pueden comprar productos.");
      return;
    }

    // Segunda barrera además del botón deshabilitado, por si el estado
    // quedó desactualizado.
    if (!isRepeatable(product.type) && ownedProductIds.has(product.id)) {
      alert("Ya tienes este producto.");
      return;
    }

    setBuyingId(product.id);

    const { error } = await supabase.from("purchases").insert({
      user_id: session.user.id,
      product_id: product.id,
      price_paid: product.price,
    });

    setBuyingId(null);

    if (error) {
      alert("Error al comprar: " + error.message);
      return;
    }

    if (!isRepeatable(product.type)) {
      setOwnedProductIds((prev) => new Set(prev).add(product.id));
    }

    setBoughtId(product.id);
    setTimeout(() => setBoughtId(null), 2000);
  };

  const filtered = filter === "todos" ? products : products.filter((p) => p.type === filter);

  return (
    <main>
      <nav className="navbar">
        <div className="logo">
          <img src={logoTrip} alt="TRIP" />
          {isAdmin && <span className="admin-badge">ADMIN</span>}
        </div>
        <div className="nav-links">
          {session ? (
            <>
              {isAdmin && <Link to="/admin">Productos</Link>}
              <Link to={isAdmin ? "/dashboard_admin" : "/dashboard"}>Dashboard</Link>
              <ProfileMenu />
            </>
          ) : (
            <Link to="/login">Iniciar sesión</Link>
          )}
        </div>
      </nav>

      <section className="store-page">
        <p className="subtitle">TIENDA</p>
        <h1>Tienda TRIP</h1>
        <p>Mesh, assets y contenido del juego.</p>

        <div className="store-filters">
          {["todos", "mesh", "juego", "asset", "otro"].map((t) => (
            <button
              key={t}
              className={filter === t ? "filter-active" : ""}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && (
          <p className="store-loading">
            <InlineSpinner /> Cargando productos...
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <p style={{ color: "#666" }}>No hay productos en esta categoría todavía.</p>
        )}

        <div className="store-grid">
          {filtered.map((p) => {
            const alreadyOwned = !isRepeatable(p.type) && ownedProductIds.has(p.id);
            const disabled = buyingId === p.id || isAdmin || alreadyOwned;

            let label = "Comprar";
            if (isAdmin) label = "No disponible para admin";
            else if (boughtId === p.id) label = "¡Comprado! ✓";
            else if (buyingId === p.id) label = "Procesando...";
            else if (alreadyOwned) label = "Ya lo tienes ✓";

            return (
              <div className="product-card" key={p.id}>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ objectPosition: p.image_position || "center center" }}
                  />
                ) : (
                  <div className="product-no-image">Sin imagen</div>
                )}
                <span className="product-type">{p.type}</span>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <strong>${p.price}</strong>
                <button
                  onClick={() => handleBuy(p)}
                  disabled={disabled}
                  className="btn-buy"
                  title={
                    isAdmin
                      ? "Las cuentas de administrador no pueden comprar"
                      : alreadyOwned
                      ? "Este producto solo se puede comprar una vez"
                      : undefined
                  }
                >
                  {label}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Store;