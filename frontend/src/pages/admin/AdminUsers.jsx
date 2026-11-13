import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Search, Pencil, Trash2, UserX } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { formatDate, formatPrice } from '../../utils/formatters';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ role: 'user', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminService
      .getUsers({ page, limit: 12, search })
      .then((data) => {
        setUsers(data.users);
        setPagination(data.pagination);
      })
      .catch(() => toast.error('No se pudieron cargar los usuarios'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (user) => {
    setEditing(user);
    setForm({ role: user.role, isActive: user.isActive });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await adminService.updateUser(editing.id, form);
      toast.success('Usuario actualizado');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`¿Eliminar al usuario ${user.email}?`)) return;
    try {
      await adminService.deleteUser(user.id);
      toast.success('Usuario eliminado');
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
          <h1>Usuarios</h1>
          <p>Administrá las cuentas de la tienda</p>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <form onSubmit={submitSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 420 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--text-light)' }} />
              <input
                className="form-input"
                placeholder="Buscar por email o nombre..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }}
              />
            </div>
            <button className="btn btn-ghost btn-sm" type="submit">Buscar</button>
          </form>
          <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{pagination?.total || 0} {pagination?.total === 1 ? 'usuario' : 'usuarios'}</span>
        </div>

        {loading ? (
          <Loader text="Cargando usuarios..." />
        ) : users.length === 0 ? (
          <div className="admin-panel-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
            <UserX size={34} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>No hay usuarios que coincidan.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-light)' }}>{u.email}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${u.role === 'admin' ? 'status-processing' : 'status-confirmed'}`}>
                        {u.role === 'admin' ? 'Administrador' : 'Cliente'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${u.isActive ? 'status-delivered' : 'status-cancelled'}`}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-btn primary" onClick={() => openEdit(u)} title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDelete(u)} title="Eliminar">
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
        title={editing ? `Editar ${editing.email}` : 'Editar usuario'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Rol</label>
          <select
            className="form-select"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="user">Cliente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <label className="filter-option" style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Cuenta activa
        </label>
      </Modal>
    </div>
  );
};

export default AdminUsers;