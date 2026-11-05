import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No hay resultados',
  message = 'No encontramos lo que buscabas.',
  actionLabel,
  actionTo,
  onAction
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={36} strokeWidth={1.6} />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary">{actionLabel}</Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
};

export default EmptyState;