import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProfileMenu from "../components/ProfileMenu";
import logoTrip from "../assets/logo_trip.png";


function Admin() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("mesh");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePosition, setImagePosition] = useState("center center");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const focalContainerRef = useRef(null);
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });
  const [focalContainerSize, setFocalContainerSize] = useState({ w: 1, h: 1 });
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState(100);

  const parsePosition = (str) => {
    const keywordMap = {
      "top left": [0, 0], "top center": [50, 0], "top right": [100, 0],
      "center left": [0, 50], "center center": [50, 50], "center right": [100, 50],
      "bottom left": [0, 100], "bottom center": [50, 100], "bottom right": [100, 100],
    };
    if (keywordMap[str]) {
      return { x: keywordMap[str][0], y: keywordMap[str][1] };
    }
    const parts = (str || "50% 50%").split(" ").map((v) => parseFloat(v));
    return {
      x: Number.isNaN(parts[0]) ? 50 : parts[0],
      y: Number.isNaN(parts[1]) ? 50 : parts[1],
    };
  };

  const focal = parsePosition(imagePosition);

  const updateFocalContainerSize = () => {
    if (focalContainerRef.current) {
      const rect = focalContainerRef.current.getBoundingClientRect();
      setFocalContainerSize({ w: rect.width, h: rect.height });
    }
  };

  const handlePreviewImageLoad = (e) => {
    setImgNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    updateFocalContainerSize();
  };

  const setFocalFromEvent = (e) => {
    if (!focalContainerRef.current) return;
    const rect = focalContainerRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setImagePosition(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  const handleFocalMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setFocalFromEvent(e);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => setFocalFromEvent(e);
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  useEffect(() => {
    window.addEventListener("resize", updateFocalContainerSize);
    return () => window.removeEventListener("resize", updateFocalContainerSize);
  }, []);

  // Calcula el rectángulo (en px, dentro del contenedor de vista previa) que
  // representa exactamente lo que se verá al recortar en 1:1 con el foco actual
  const imageAspect = imgNatural.w / imgNatural.h || 1 / 1;
  const targetAspect = 1 / 1;
  let cropW, cropH;
  if (imageAspect > targetAspect) {
    cropH = focalContainerSize.h;
    cropW = cropH * targetAspect;
  } else {
    cropW = focalContainerSize.w;
    cropH = cropW / targetAspect;
  }
  const cropLeft = Math.min(
    Math.max((focal.x / 100) * focalContainerSize.w - cropW / 2, 0),
    Math.max(focalContainerSize.w - cropW, 0)
  );
  const cropTop = Math.min(
    Math.max((focal.y / 100) * focalContainerSize.h - cropH / 2, 0),
    Math.max(focalContainerSize.h - cropH, 0)
  );

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts(data || []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadingImage(true);

    const safeName = file.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.]+/g, "-");
    const path = `productos/${Date.now()}-${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from("assests")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadErr) {
      setUploadingImage(false);
      setUploadError("No se pudo subir la imagen: " + uploadErr.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("assests")
      .getPublicUrl(path);

    setImageUrl(publicUrlData.publicUrl);
    setUploadingImage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (editingId) {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name,
          description,
          type,
          price: price ? parseFloat(price) : 0,
          image_url: imageUrl || null,
          image_position: imagePosition,
        })
        .eq("id", editingId);

      setLoading(false);

      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("products").insert({
        name,
        description,
        type,
        price: price ? parseFloat(price) : 0,
        image_url: imageUrl || null,
        image_position: imagePosition,
        created_by: user.id,
      });

      setLoading(false);

      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    setName("");
    setDescription("");
    setType("mesh");
    setPrice("");
    setImageUrl("");
    setImagePosition("center center");
    setEditingId(null);
    loadProducts();
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || "");
    setType(p.type);
    setPrice(p.price != null ? String(p.price) : "");
    setImageUrl(p.image_url || "");
    setImagePosition(p.image_position || "center center");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setType("mesh");
    setPrice("");
    setImageUrl("");
    setImagePosition("center center");
    setError("");
    setUploadError("");
  };

  const handleDelete = async (id) => {
    await supabase.from("products").delete().eq("id", id);
    if (editingId === id) handleCancelEdit();
    loadProducts();
  };

  return (
    <main className="admin-panel">
      <nav className="navbar admin-navbar">
        <div className="logo">
          <img src={logoTrip} alt="TRIP" /> <span className="admin-badge">ADMIN</span>
        </div>
        <div className="nav-links">
          <Link to="/dashboard_admin">Dashboard</Link>
          <Link to="/admin/simulacion">Simulación</Link>
          <Link to="/tienda">Ver tienda</Link>
          <Link to="/admin/exportar">Exportar</Link>
          <ProfileMenu />
        </div>
      </nav>

      <section className="admin-content">
        <p className="subtitle admin-subtitle">PANEL DE ADMINISTRACIÓN</p>
        <h1>Gestionar productos</h1>

        <div className="admin-layout">
          <div className="admin-form-card">
            <h2 className="admin-form-title">
              {editingId ? "Editar producto" : "Nuevo producto"}
            </h2>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-field">
                <label>Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="admin-field">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="admin-field-row">
                <div className="admin-field">
                  <label>Tipo</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="mesh">Mesh</option>
                    <option value="juego">Juego</option>
                    <option value="asset">Asset</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label>Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-field">
                <label>Imagen del producto</label>

                <div className="admin-image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <span className="admin-uploading">Subiendo...</span>}
                </div>

                <p className="admin-or-divider">o pega una URL</p>

                <input
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />

                {uploadError && <p className="admin-error">{uploadError}</p>}
              </div>

              {imageUrl && (
                <div className="admin-field">
                  <label>Ajustar encuadre (clic o arrastra sobre la foto)</label>

                  <div className="admin-zoom-controls">
                    <button
                      type="button"
                      className="admin-zoom-btn"
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="admin-zoom-slider"
                    />
                    <button
                      type="button"
                      className="admin-zoom-btn"
                      onClick={() => setZoom(Math.min(200, zoom + 10))}
                    >
                      +
                    </button>
                    <span className="admin-zoom-value">{zoom}%</span>
                  </div>

                  <div
                    className="admin-focal-wrap"
                    ref={focalContainerRef}
                    onMouseDown={handleFocalMouseDown}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <img
                      src={imageUrl}
                      alt="Vista previa"
                      className="admin-focal-image"
                      onLoad={handlePreviewImageLoad}
                      draggable={false}
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "center center",
                      }}
                    />
                    <div
                      className="admin-focal-frame"
                      style={{
                        left: `${cropLeft}px`,
                        top: `${cropTop}px`,
                        width: `${cropW}px`,
                        height: `${cropH}px`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="admin-remove-image"
                    onClick={() => setImageUrl("")}
                  >
                    Quitar imagen
                  </button>
                </div>
              )}

              {error && <p className="admin-error">{error}</p>}

              <div className="admin-form-actions">
                <button type="submit" disabled={loading || uploadingImage} className="admin-submit">
                  {loading
                    ? "Guardando..."
                    : editingId
                    ? "Guardar cambios"
                    : "+ Agregar producto"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="admin-cancel"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-list-card">
            <h2 className="admin-form-title">
              Productos existentes <span className="admin-count">{products.length}</span>
            </h2>

            {products.length === 0 && (
              <p className="admin-empty">Todavía no hay productos. Agrega el primero.</p>
            )}

            <div className="admin-grid">
              {products.map((p) => (
                <div className="admin-product-card" key={p.id}>
                  {p.image_url && (
                    <div className="admin-product-image">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        style={{ objectPosition: p.image_position || "center center" }}
                      />
                    </div>
                  )}
                  <span className={`product-type type-${p.type}`}>{p.type}</span>
                  <strong>{p.name}</strong>
                  {p.description && <p>{p.description}</p>}
                  <div className="admin-product-footer">
                    <p className="admin-price">${p.price}</p>
                    <div className="admin-product-buttons">
                      <button onClick={() => handleEdit(p)} className="btn-edit">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="btn-delete">
                        Borrar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Admin;