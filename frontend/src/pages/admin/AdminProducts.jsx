import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Plus, Search, Pencil, Trash2, Eye, Package, Image as ImageIcon, X
} from 'lucide-react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { formatPrice } from '../../utils/formatters';
import { isValidImageSrc } from '../../utils/images';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';
import SafeImage from '../../components/ui/SafeImage';

const EMPTY_FORM = {
  name: '',
  shortDescription: '',
  description: '',
  price: '',
  originalPrice: '',
  stockQuantity: '',
  minStockAlert: 5,
  categoryId: '',
  sku: '',
  brand: '',
  conditionType: 'new',
  warranty: '',
  weight: '',
  dimensions: '',
  shippingFree: false,
  shippingCost: '',
  isFeatured: false,
  isActive: true,
  images: [],
  attributesText: ''
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    productService
      .getAdminProducts({ page, limit: 12, search })
      .then((data) => {
        setProducts(data.products);
        setPagination(data.pagination);
      })
      .catch(() => toast.error('No se pudieron cargar los productos'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    categoryService.getTree().then(setCategories).catch(() => {});
  }, []);

  const flatCategories = [];
  const flatten = (list, depth = 0) => {
    list.forEach((cat) => {
      flatCategories.push({ ...cat, depth });
      if (cat.children) flatten(cat.children, depth + 1);
    });
  };
  flatten(categories);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      shortDescription: product.short_description || '',
      description: product.description || '',
      price: product.price ?? '',
      originalPrice: product.original_price ?? '',
      stockQuantity: product.stock_quantity ?? '',
      minStockAlert: product.min_stock_alert ?? 5,
      categoryId: product.category_id ?? '',
      sku: product.sku || '',
      brand: product.brand || '',
      conditionType: product.condition_type || 'new',
      warranty: product.warranty || '',
      weight: product.weight ?? '',
      dimensions: product.dimensions || '',
      shippingFree: !!product.shipping_free,
      shippingCost: product.shipping_cost ?? '',
      isFeatured: !!product.is_featured,
      isActive: !!product.is_active,
      images: (product.images || []).map((image) => ({
        url: image.image_url,
        isPrimary: !!image.is_primary
      })),
      attributesText: (product.attributes || [])
        .map((attribute) => `${attribute.attribute_name}: ${attribute.attribute_value}`)
        .join('\n')
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const updateImage = (index, value) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((image, i) => (i === index ? { ...image, url: value } : image))
    }));
  };

  const addImage = () => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { url: '', isPrimary: prev.images.length === 0 }]
    }));
  };

  const setPrimaryImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((image, i) => ({ ...image, isPrimary: i === index }))
    }));
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      if (images.length > 0 && !images.some((image) => image.isPrimary)) {
        images[0] = { ...images[0], isPrimary: true };
      }
      return { ...prev, images };
    });
  };

  const buildImages = () => {
    const rows = form.images
      .map((image) => ({ ...image, url: image.url.trim() }))
      .filter((image) => image.url);
    const invalid = rows.filter((image) => !isValidImageSrc(image.url));
    if (invalid.length > 0) {
      toast.error('Una o más imágenes tienen una URL o Base64 inválido');
      return null;
    }
    const primaryIndex = rows.findIndex((image) => image.isPrimary);
    return rows.map((image, i) => ({
      imageUrl: image.url,
      altText: form.name.trim(),
      isPrimary: i === (primaryIndex >= 0 ? primaryIndex : 0)
    }));
  };

  const buildAttributes = () => {
    return form.attributesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [attributeName, ...rest] = line.split(':');
        return {
          attributeName: attributeName.trim(),
          attributeValue: rest.join(':').trim()
        };
      })
      .filter((a) => a.attributeName && a.attributeValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) {
      toast.error('Completa nombre y categoría');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error('Ingresa un precio válido');
      return;
    }
    if (form.stockQuantity === '' || Number(form.stockQuantity) < 0) {
      toast.error('Ingresa un stock válido');
      return;
    }

    const payload = {
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price),
      originalPrice: form.originalPrice !== '' ? Number(form.originalPrice) : null,
      stockQuantity: Number(form.stockQuantity),
      minStockAlert: form.minStockAlert === '' ? 5 : Number(form.minStockAlert),
      categoryId: Number(form.categoryId),
      sku: form.sku.trim() || null,
      brand: form.brand.trim() || null,
      conditionType: form.conditionType,
      warranty: form.warranty.trim() || null,
      weight: form.weight !== '' ? Number(form.weight) : null,
      dimensions: form.dimensions.trim() || null,
      shippingFree: form.shippingFree,
      shippingCost: form.shippingCost ? Number(form.shippingCost) : 0,
      isFeatured: form.isFeatured
    };

    try {
      setSaving(true);
      if (editing) {
        payload.isActive = form.isActive;
        const images = buildImages();
        if (!images) return;
        payload.images = images;
        payload.attributes = buildAttributes();
        await productService.update(editing.id, payload);
        toast.success('Producto actualizado');
      } else {
        const images = buildImages();
        if (!images) return;
        payload.images = images;
        payload.attributes = buildAttributes();
        await productService.create(payload);
        toast.success('Producto creado');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const result = await productService.remove(product.id);
      toast.success(result.message || 'Producto eliminado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar');
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Productos</h1>
          <p>Gestioná el catálogo y el stock de tu tienda</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={17} /> Nuevo producto
        </button>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <form onSubmit={submitSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 420 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--text-light)' }} />
              <input
                className="form-input"
                placeholder="Buscar por nombre o SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }}
              />
            </div>
            <button className="btn btn-ghost btn-sm" type="submit">Buscar</button>
            {search && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              >
                <X size={14} />
              </button>
            )}
          </form>
          <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
            {pagination?.total || 0} productos
          </span>
        </div>

        {loading ? (
          <Loader text="Cargando productos..." />
        ) : products.length === 0 ? (
          <div className="admin-panel-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
            <Package size={34} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>No hay productos{search ? ' que coincidan con la búsqueda' : ''}.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        <SafeImage src={p.primary_image} alt={p.name} />
                        <div className="table-product-info">
                          <div className="table-product-name">{p.name}</div>
                          <div className="table-product-sku">{p.sku || 'Sin SKU'} · {p.brand || 'Sin marca'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.category_name || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{formatPrice(p.price)}</td>
                    <td>
                      <span className={`badge-stock ${p.stock_quantity === 0 ? 'out' : p.stock_quantity <= (p.min_stock_alert || 5) ? 'low' : 'ok'}`}>
                        {p.stock_quantity} u.
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${p.is_active ? 'status-delivered' : 'status-cancelled'}`}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <a
                          href={`/producto/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="icon-btn"
                          title="Ver en tienda"
                        >
                          <Eye size={15} />
                        </a>
                        <button className="icon-btn primary" onClick={() => openEdit(p)} title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDelete(p)} title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        size="large"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del producto *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select className="form-select" name="categoryId" value={form.categoryId} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'— '.repeat(c.depth)}{c.name}
                  </option>
                ))}
              </select>
              {form.categoryId === '' && (
                <div className="form-hint" style={{ color: 'var(--warning)' }}>
                  Los productos sin categoría no se publican. Elige una categoría clara.
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Marca</label>
              <input className="form-input" name="brand" value={form.brand} onChange={handleChange} placeholder="Ej: Samsung" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Precio (MXN) *</label>
              <input className="form-input" type="number" min="0.01" step="0.01" name="price" value={form.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Precio original (MXN)</label>
              <input className="form-input" type="number" min="0" step="0.01" name="originalPrice" value={form.originalPrice} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Stock *</label>
              <input className="form-input" type="number" min="0" name="stockQuantity" value={form.stockQuantity} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Alerta de stock bajo</label>
              <input className="form-input" type="number" min="0" name="minStockAlert" value={form.minStockAlert} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SKU</label>
              <input className="form-input" name="sku" value={form.sku} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Condición</label>
              <select className="form-select" name="conditionType" value={form.conditionType} onChange={handleChange}>
                <option value="new">Nuevo</option>
                <option value="used">Usado</option>
                <option value="refurbished">Reacondicionado</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción corta</label>
            <input className="form-input" name="shortDescription" maxLength={500} value={form.shortDescription} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción completa</label>
            <textarea className="form-textarea" name="description" rows={4} value={form.description} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Garantía</label>
              <input className="form-input" name="warranty" value={form.warranty} onChange={handleChange} placeholder="Ej: 12 meses" />
            </div>
            <div className="form-group">
              <label className="form-label">Dimensiones</label>
              <input className="form-input" name="dimensions" value={form.dimensions} onChange={handleChange} placeholder="Ej: 30 x 20 x 10 cm" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Costo de envío (MXN)</label>
              <input className="form-input" type="number" min="0" step="0.01" name="shippingCost" value={form.shippingCost} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
              <label className="filter-option" style={{ fontSize: 14 }}>
                <input type="checkbox" name="shippingFree" checked={form.shippingFree} onChange={handleChange} />
                Envío gratis
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
              <label className="filter-option" style={{ fontSize: 14 }}>
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
                Producto destacado
              </label>
            </div>
            {editing && (
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                <label className="filter-option" style={{ fontSize: 14 }}>
                  <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                  Producto activo (visible en la tienda)
                </label>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <ImageIcon size={14} style={{ verticalAlign: '-2px' }} /> Imágenes del producto
            </label>
            <div className="admin-image-editor">
              {form.images.length === 0 && (
                <div className="admin-image-empty">Este producto todavía no tiene imágenes.</div>
              )}
              {form.images.map((image, index) => (
                <div className="admin-image-row" key={index}>
                  <div className="admin-image-preview">
                    <SafeImage src={image.url} alt={`Vista previa ${index + 1}`} />
                  </div>
                  <div className="admin-image-fields">
                    <input
                      className="form-input"
                      value={image.url}
                      onChange={(e) => updateImage(index, e.target.value)}
                      placeholder="https://... o data:image/...;base64,..."
                      aria-label={`URL de imagen ${index + 1}`}
                    />
                    <div className="admin-image-meta">
                      <label className="filter-option" style={{ fontSize: 13 }}>
                        <input
                          type="radio"
                          name="primaryProductImage"
                          checked={image.isPrimary}
                          onChange={() => setPrimaryImage(index)}
                        />
                        Principal
                      </label>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => removeImage(index)}
                        title="Quitar imagen"
                        aria-label={`Quitar imagen ${index + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={addImage}>
                <Plus size={15} /> Agregar imagen por URL
              </button>
            </div>
            <div className="form-hint">
              Puedes editar las URLs existentes, marcar la imagen principal o añadir nuevas. La primera imagen se usa si no marcas ninguna.
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Atributos (uno por línea, formato "Nombre: Valor")</label>
            <textarea
              className="form-textarea"
              name="attributesText"
              rows={3}
              value={form.attributesText}
              onChange={handleChange}
              placeholder={'Pantalla: 6.1" OLED\nMemoria: 128GB\nColor: Negro'}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProducts;