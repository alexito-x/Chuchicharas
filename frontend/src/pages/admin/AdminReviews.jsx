import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Check, X, MessageSquare } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { formatDate } from '../../utils/formatters';
import Stars from '../../components/ui/Stars';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    reviewService
      .getAdminReviews({
        page,
        limit: 12,
        isApproved: filter === '' ? undefined : filter === 'approved'
      })
      .then((data) => {
        setReviews(data.reviews);
        setPagination(data.pagination);
      })
      .catch(() => toast.error('No se pudieron cargar las reseñas'))
      .finally(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (review, isApproved) => {
    try {
      await reviewService.moderate(review.id, isApproved);
      toast.success(isApproved ? 'Reseña aprobada' : 'Reseña rechazada');
      load();
    } catch {
      toast.error('No se pudo moderar la reseña');
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Reseñas</h1>
          <p>Moderá las opiniones de los compradores</p>
        </div>
        <select
          className="select-sm"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
        >
          <option value="">Todas</option>
          <option value="approved">Aprobadas</option>
          <option value="pending">Pendientes</option>
        </select>
      </div>

      <div className="admin-panel">
        {loading ? (
          <Loader text="Cargando reseñas..." />
        ) : reviews.length === 0 ? (
          <div className="admin-panel-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
            <MessageSquare size={34} style={{ marginBottom: 10, opacity: 0.5 }} />
            <p>No hay reseñas para mostrar.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Usuario</th>
                  <th>Calificación</th>
                  <th>Comentario</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td style={{ maxWidth: 200 }}>{r.productName}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{r.userName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-light)' }}>{formatDate(r.createdAt)}</div>
                    </td>
                    <td><Stars rating={r.rating} size={13} /></td>
                    <td style={{ maxWidth: 280, fontSize: 13 }}>
                      {r.title && <div style={{ fontWeight: 600 }}>{r.title}</div>}
                      <div style={{ color: 'var(--text-soft)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {r.comment || '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${r.isApproved ? 'status-delivered' : 'status-pending'}`}>
                        {r.isApproved ? 'Aprobada' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {!r.isApproved && (
                          <button className="icon-btn" onClick={() => moderate(r, true)} title="Aprobar" style={{ color: 'var(--success)' }}>
                            <Check size={15} />
                          </button>
                        )}
                        {!!r.isApproved && (
                          <button className="icon-btn danger" onClick={() => moderate(r, false)} title="Rechazar">
                            <X size={15} />
                          </button>
                        )}
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
    </div>
  );
};

export default AdminReviews;