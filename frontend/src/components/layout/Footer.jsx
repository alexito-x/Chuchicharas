import { Link } from 'react-router-dom';
import { MapPin, Clock, ShieldCheck, Truck, CreditCard } from 'lucide-react';

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Priv.+Manuel+del+Mazo+3%2C+Centro%2C+50450+Atlacomulco+de+Fabela%2C+M%C3%A9xico';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="Chuchicharas inicio">
              <img src="/brand/chuchicharas-logo.jpg" alt="Chuchicharas" />
            </Link>
            <p>
              Tu tienda multi-producto de confianza en Atlacomulco de Fabela.
              Tecnología, hogar, moda y mucho más, con envíos a todo México.
            </p>
            <ul className="footer-contact">
              <li>
                <MapPin size={15} />
                <a href={MAPS_URL} target="_blank" rel="noreferrer">
                  Priv. Manuel del Mazo 3, Centro, 50450 Atlacomulco de Fabela, Méx.
                </a>
              </li>
              <li>
                <Clock size={15} />
                <span>Lun–Sáb 7:00 a.m.–8:30 p.m. · Dom 7:00 a.m.–7:30 p.m.</span>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Horarios</h3>
            <p className="footer-hours">
              <strong>Lunes a sábado</strong><br />
              7:00 a.m. – 8:30 p.m.
            </p>
            <p className="footer-hours" style={{ marginTop: 10 }}>
              <strong>Domingo</strong><br />
              7:00 a.m. – 7:30 p.m.
            </p>
            <p className="footer-hours" style={{ marginTop: 10 }}>
              Pedidos en línea 24/7
            </p>
          </div>

          <div className="footer-col">
            <h3>Comprar</h3>
            <ul>
              <li><Link to="/productos">Todos los productos</Link></li>
              <li><Link to="/productos?ofertas=true">Ofertas del día</Link></li>
              <li><Link to="/carrito">Mi carrito</Link></li>
              <li><Link to="/mis-pedidos">Mis compras</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Ayuda</h3>
            <ul>
              <li><Link to="/contacto">Quiénes somos</Link></li>
              <li><Link to="/contacto#envios">Envíos y entregas</Link></li>
              <li><Link to="/contacto#devoluciones">Cambios y devoluciones</Link></li>
              <li><Link to="/contacto#contacto">Contacto</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Chuchicharas · Atlacomulco de Fabela, México. Todos los derechos reservados.</span>
          <div className="footer-payments">
            <span className="payment-pill"><ShieldCheck size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Compra protegida</span>
            <span className="payment-pill"><Truck size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Envíos</span>
            <span className="payment-pill"><CreditCard size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Pago seguro</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
