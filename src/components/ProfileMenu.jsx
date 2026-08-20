import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { InlineSpinner } from "./Loader";

function initialsFrom(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ProfileMenu() {
  const { session, profile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === "admin";

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("compras"); // "compras" | "inventario"
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // ---- Edición de nombre ----
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.username || "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  // ---- Foto de perfil ----
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // ---- Compras / inventario ----
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [purchasesLoaded, setPurchasesLoaded] = useState(false);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);

  useEffect(() => {
    setNameInput(profile?.username || "");
  }, [profile?.username]);

  // Cierra el panel al hacer clic afuera o con Escape.
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Carga compras/inventario solo la primera vez que se abre el panel
  // (y solo si el usuario puede comprar, es decir, no es admin).
  useEffect(() => {
    if (!open || isAdmin || purchasesLoaded || !session) return;

    const loadPurchases = async () => {
      setLoadingPurchases(true);
      const { data } = await supabase
        .from("purchases")
        .select("*, products(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setPurchases(data || []);
      setLoadingPurchases(false);
      setPurchasesLoaded(true);
    };

    loadPurchases();
  }, [open, isAdmin, purchasesLoaded, session]);

  const handleLogout = async (e) => {
    e.preventDefault();
    setOpen(false);
    navigate("/", { replace: true });
    await logout();
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("El nombre no puede estar vacío.");
      return;
    }
    if (trimmed === profile?.username) {
      setEditingName(false);
      return;
    }

    setSavingName(true);
    setNameError("");

    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", session.user.id);

    setSavingName(false);

    if (error) {
      // El username es UNIQUE en la tabla profiles.
      setNameError(
        error.code === "23505" ? "Ese nombre ya está en uso." : "No se pudo guardar."
      );
      return;
    }

    await refreshProfile();
    setEditingName(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Elige un archivo de imagen.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setAvatarError("La imagen no puede pesar más de 3MB.");
      return;
    }

    setUploadingAvatar(true);
    setAvatarError("");

    const ext = file.name.split(".").pop();
    const filePath = `Fotos usuarios/${session.user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("Foto_perfil")
      .upload(filePath, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setUploadingAvatar(false);
      setAvatarError("No se pudo subir la imagen: " + uploadError.message);
      return;
    }

    let finalAvatarUrl = null;

    const { data: publicUrlData } = supabase.storage
      .from("Foto_perfil")
      .getPublicUrl(filePath);

    // Le agregamos un parámetro con la hora para evitar que el navegador
    // muestre la foto vieja cacheada tras subir una nueva.
    finalAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: finalAvatarUrl })
      .eq("id", session.user.id);

    setUploadingAvatar(false);

    if (updateError) {
      setAvatarError("No se pudo guardar la foto de perfil.");
      return;
    }

    await refreshProfile();
  };

  if (!session) return null;

  // Agrupa las compras por producto para el inventario. Los "mesh" se
  // pueden comprar varias veces, así que se muestran con su cantidad;
  // el resto (juego/asset/otro) son de una sola unidad.
  const inventory = (() => {
    const map = new Map();
    purchases.forEach((p) => {
      if (!p.products) return;
      const existing = map.get(p.product_id);
      if (existing) {
        existing.qty += 1;
      } else {
        map.set(p.product_id, { product: p.products, qty: 1 });
      }
    });
    return Array.from(map.values());
  })();

  // Agrupa el inventario por tipo de producto para mostrarlo en secciones
  // (Juego, Assets, Mesh, Otro), en lugar de una lista mezclada.
  const typeLabels = { juego: "Juego", asset: "Assets", mesh: "Mesh", otro: "Otro" };
  const typeOrder = ["juego", "asset", "mesh", "otro"];
  const inventoryByType = inventory.reduce((groups, item) => {
    const type = item.product.type || "otro";
    (groups[type] = groups[type] || []).push(item);
    return groups;
  }, {});

  return (
    <>
      <a href="#" onClick={handleLogout} className="nav-logout">
        Cerrar sesión
      </a>
      <div className="profile-menu" ref={menuRef}>
      <button
        className="profile-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Perfil"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="profile-avatar-img" />
        ) : (
          <span className="profile-avatar-fallback">{initialsFrom(profile?.username)}</span>
        )}
      </button>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <div
              className="profile-avatar-wrap"
              onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="profile-avatar-img-lg" />
              ) : (
                <span className="profile-avatar-fallback-lg">
                  {initialsFrom(profile?.username)}
                </span>
              )}
              <div className={`profile-avatar-overlay${uploadingAvatar ? " is-visible" : ""}`}>
                {uploadingAvatar ? <InlineSpinner size={18} /> : "Cambiar"}
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />

            <div className="profile-name-block">
              {editingName ? (
                <div className="profile-name-edit">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={30}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="profile-name-save">
                    {savingName ? "..." : "✓"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameInput(profile?.username || "");
                      setNameError("");
                    }}
                    className="profile-name-cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="profile-name-display">
                  <strong>{profile?.username || "viajero"}</strong>
                  <button className="profile-name-edit-btn" onClick={() => setEditingName(true)}>
                    Editar
                  </button>
                </div>
              )}
              {nameError && <p className="profile-error">{nameError}</p>}
              {avatarError && <p className="profile-error">{avatarError}</p>}
              {isAdmin && <span className="admin-badge">ADMIN</span>}
            </div>
          </div>

          {uploadingAvatar && (
            <p className="avatar-uploading-banner">
              <InlineSpinner size={13} /> Subiendo foto...
            </p>
          )}

          {!isAdmin && (
            <>
              <div className="profile-tabs">
                <button
                  className={tab === "compras" ? "profile-tab-active" : ""}
                  onClick={() => setTab("compras")}
                >
                  Historial de compras
                </button>
                <button
                  className={tab === "inventario" ? "profile-tab-active" : ""}
                  onClick={() => setTab("inventario")}
                >
                  Inventario
                </button>
              </div>

              <div className="profile-tab-content">
                {loadingPurchases && (
                  <p className="profile-empty" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <InlineSpinner size={14} /> Cargando...
                  </p>
                )}

                {!loadingPurchases && tab === "compras" && (
                  purchases.length === 0 ? (
                    <p className="profile-empty">Todavía no has comprado nada.</p>
                  ) : (
                    <ul className="profile-list profile-accordion">
                      {purchases.map((p) => {
                        const isExpanded = expandedPurchaseId === p.id;
                        return (
                          <li key={p.id} className="profile-accordion-item">
                            <button
                              type="button"
                              className="profile-accordion-bar"
                              aria-expanded={isExpanded}
                              onClick={() =>
                                setExpandedPurchaseId(isExpanded ? null : p.id)
                              }
                            >
                              <span className="profile-list-name">
                                {p.products?.name || "Producto eliminado"}
                              </span>
                              <span className="profile-list-meta">
                                ${p.price_paid} · {formatDate(p.created_at)}
                              </span>
                              <span
                                className={`profile-accordion-caret${
                                  isExpanded ? " is-open" : ""
                                }`}
                              >
                                ▾
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="profile-accordion-panel">
                                {p.products ? (
                                  <>
                                    <span className="product-type">{p.products.type}</span>
                                    <p>{p.products.description || "Sin descripción."}</p>
                                  </>
                                ) : (
                                  <p>Este producto ya no está disponible en la tienda.</p>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )
                )}

                {!loadingPurchases && tab === "inventario" && (
                  inventory.length === 0 ? (
                    <p className="profile-empty">Tu colección está vacía.</p>
                  ) : (
                    typeOrder
                      .filter((t) => inventoryByType[t]?.length)
                      .map((t) => (
                        <div className="inventory-group" key={t}>
                          <h4 className="inventory-group-title">{typeLabels[t]}</h4>
                          <ul className="profile-list">
                            {inventoryByType[t].map(({ product, qty }) => (
                              <li key={product.id} className="profile-list-item">
                                <span className="profile-list-name">{product.name}</span>
                                <span className="profile-list-meta">
                                  {qty > 1 ? `x${qty}` : "✓"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </>
  );
}

export default ProfileMenu;