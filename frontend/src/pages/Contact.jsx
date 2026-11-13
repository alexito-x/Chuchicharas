import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Clock, Truck, RefreshCcw, ArrowRight, Store } from 'lucide-react';

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Priv.+Manuel+del+Mazo+3%2C+Centro%2C+50450+Atlacomulco+de+Fabela%2C+M%C3%A9xico';
const MAPS_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3775.716153266976!2d-99.87409292577533!3d19.79979354198807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1c4b8c8f8f8f8%3A0x8f8f8f8f8f8f8f8f!2sPriv.%20Manuel%20del%20Mazo%203%2C%20Centro%2C%2050450%20Atlacomulco%20de%20Fabela%2C%20M%C3%A9x.!5e0!3m2!1ses!2smx!4v1234567890';

const Contact = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location]);

  return (
    <div className="container fade-in">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link>
        <ArrowRight size={13} />
        <span>Contacto</span>
      </div>

      <section className="contact-hero">
        <span className="hero-badge">Chuchicharas · Atlacomulco</span>
        <h1>Quiénes somos</h1>
        <p>
          Somos una tienda multi-producto ubicada en el centro de Atlacomulco de Fabela.
          Ofrecemos tecnología, hogar, moda y más con atención cercana y envíos a todo México.
        </p>
      </section>

      <div className="contact-grid">
        <div className="contact-card">
          <h2>Nuestra tienda</h2>
          <p>
            En Chuchicharas elegimos cada producto pensando en la calidad y en el precio
            justo. Atendemos de forma personalizada para ayudarte a encontrar lo que
            necesitas, ya sea en tienda o en línea.
          </p>
          <p>
            Compra desde casa y recibe tu pedido en cualquier parte de México, o visítanos
            en nuestra sucursal en el centro de Atlacomulco.
          </p>

          <ul className="contact-details">
            <li>
              <MapPin size={19} />
              <div>
                <strong>Dirección</strong>
                <a href={MAPS_URL} target="_blank" rel="noreferrer">
                  Priv. Manuel del Mazo 3, Centro,<br />
                  50450 Atlacomulco de Fabela, Méx.
                </a>
              </div>
            </li>
            <li>
              <Clock size={19} />
              <div>
                <strong>Horarios</strong>
                Lunes a sábado: 7:00 a.m. – 8:30 p.m.<br />
                Domingo: 7:00 a.m. – 7:30 p.m.
              </div>
            </li>
            <li>
              <Store size={19} />
              <div>
                <strong>Pedidos en línea</strong>
                Disponibles las 24 horas, todos los días.
              </div>
            </li>
          </ul>

          <div className="contact-actions">
            <a href={MAPS_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
              <MapPin size={16} /> Cómo llegar
            </a>
            <Link to="/productos" className="btn btn-outline">
              Ver catálogo <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="contact-map">
          <iframe
            title="Ubicación de Chuchicharas en Atlacomulco"
            src={MAPS_EMBED_URL}
            style={{ border: 0, width: '100%', height: '100%', minHeight: 300 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className="contact-sections">
        <section id="envios" className="contact-card contact-section">
          <h2><Truck size={20} /> Envíos y entregas</h2>
          <p>
            Realizamos envíos a todo México. El costo y el tiempo de entrega se calculan
            al finalizar la compra según tu dirección y los productos elegidos.
          </p>
          <p>
            También puedes recoger tu pedido en nuestra tienda de Atlacomulco de Fabela
            dentro del horario de atención.
          </p>
        </section>

        <section id="devoluciones" className="contact-card contact-section">
          <h2><RefreshCcw size={20} /> Cambios y devoluciones</h2>
          <p>
            Si tu producto llegó con algún problema, contáctanos y visítanos en tienda con
            tu comprobante de compra para revisar el caso y darte una solución.
          </p>
          <p>
            Te recomendamos revisar tu pedido al recibirlo y conservar el empaque original
            hasta confirmar que todo está en orden.
          </p>
        </section>

        <section id="pagos" className="contact-card contact-section">
          <h2>Medios de pago</h2>
          <p>
            Aceptamos tarjeta de crédito y débito, transferencia bancaria, Mercado Pago y
            pago contra entrega, sujeto a disponibilidad en tu zona.
          </p>
        </section>

        <section id="contacto" className="contact-card contact-section">
          <h2>Contacto</h2>
          <p>
            Visítanos en Priv. Manuel del Mazo 3, Centro, 50450 Atlacomulco de Fabela, Méx.
            Nuestro equipo está disponible de lunes a sábado de 7:00 a.m. a 8:30 p.m. y los
            domingos de 7:00 a.m. a 7:30 p.m.
          </p>
          <a href={MAPS_URL} target="_blank" rel="noreferrer" className="section-link">
            Abrir ubicación en Google Maps <ArrowRight size={15} />
          </a>
        </section>
      </div>
    </div>
  );
};

export default Contact;
