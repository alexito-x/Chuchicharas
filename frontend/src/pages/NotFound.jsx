import { Link } from 'react-router-dom';
import { PackageX } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="container">
      <div className="empty-state" style={{ marginTop: 40 }}>
        <div className="empty-icon"><PackageX size={38} /></div>
        <h2>Página no encontrada</h2>
        <p>La página que buscas no existe o fue movida.</p>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    </div>
  );
};

export default NotFound;