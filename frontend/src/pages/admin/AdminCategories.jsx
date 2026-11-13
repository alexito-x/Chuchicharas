import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Tags, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import SafeImage from '../../components/ui/SafeImage';

const EMPTY_FORM = {
  name: '',
  description: '',
  imageUrl: '',
  parentId: '',
  sortOrder: 0
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    categoryService
      .getAll({ limit: 100 })
      .then(setCategories)
      .catch(() => toast.error('No se pudieron cargar las categorías'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleCategories = showInactive ? categories : categories.filter((category) => category.is_active);
  const parents = categories.filter((category) => !category.parent_id && (category.is_active || category.id === Number(form.parentId)));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      imageUrl: cat.image_url || '',
      parentId: cat.parent_id || '',
      sortOrder: cat.sort_order || 0
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Ingresa un nombre');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      parentId: form.parentId ? Number(form.parentId) : null,
      sortOrder: Number(form.sortOrder) || 0
    };
    try {
      setSaving(true);
      if (editing) {
        await categoryService.update(editing.id, payload);
        toast.success('Categoría actualizada');
      } else {
        await categoryService.create(payload);
        toast.success('Categoría creada');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (cat) => {
    if (cat.parent_id) {
      const parent = categories.find((category) => category.id === cat.parent_id);
      if (parent && !parent.is_active) {
        toast.error('Activa primero la categoría padre');
        return;
      }
    }
    try {
      await categoryService.update(cat.id, { isActive: true });
      toast.success('Categoría reactivada');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo reactivar');
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    try {
      await categoryService.remove(cat.id);
      toast.success('Categoría eliminada');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar');
    }
  };

  const parentName = (id) => categories.find((c) => c.id === id)?.name || '—';

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Categorías</h1>
          <p>Organizá el catálogo en categorías claras y subcategorías</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => setShowInactive((value) => !value)}>
            {showInactive ? <EyeOff size={17} /> : <Eye size={17} />}
            {showInactive ? 'Ocultar inactivas' : 'Mostrar inactivas'}
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={17} /> Nueva categoría
          </button>
        </div>
      </div>

      <div className="admin-panel">
        {loading ? (
          <Loader text="Cargando categorías..." />
        ) : visibleCategories.length === 0 ? (
          <div className="admin-panel-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
            <Tags size={34} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>No hay categorías todavía.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Categoría padre</th>
                  <th>Slug</th>
                  <th>Orden</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleCategories.map((cat) => (
                  <tr key={cat.id} style={{ opacity: cat.is_active ? 1 : 0.65 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {cat.image_url && (
                          <SafeImage
                            src={cat.image_url}
                            alt={cat.name}
                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{cat.name}</div>
                          {cat.description && (
                            <div style={{ fontSize: 11.5, color: 'var(--text-light)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{cat.parent_id ? parentName(cat.parent_id) : <span style={{ color: 'var(--text-light)' }}>Raíz</span>}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{cat.slug}</td>
                    <td>{cat.sort_order}</td>
                    <td>
                      <span className={`status-badge ${cat.is_active ? 'status-delivered' : 'status-refunded'}`}>
                        {cat.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {!cat.is_active && (
                          <button className="icon-btn primary" onClick={() => handleReactivate(cat)} title="Reactivar">
                            <RotateCcw size={15} />
                          </button>
                        )}
                        <button className="icon-btn primary" onClick={() => openEdit(cat)} title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDelete(cat)} title="Eliminar">
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-textarea" name="description" rows={2} value={form.description} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">URL de imagen</label>
            <input className="form-input" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoría padre</label>
              <select className="form-select" name="parentId" value={form.parentId} onChange={handleChange}>
                <option value="">Sin padre (categoría raíz)</option>
                {parents.filter((p) => !editing || p.id !== editing.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Orden</label>
              <input className="form-input" type="number" min="0" name="sortOrder" value={form.sortOrder} onChange={handleChange} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCategories;