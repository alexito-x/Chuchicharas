import { Link } from 'react-router-dom';

const Logo = ({ size = 'normal' }) => {
  return (
    <Link to="/" className="logo" aria-label="Chuchicharas inicio">
      <img
        src="/brand/chuchicharas-logo.jpg"
        alt="Chuchicharas"
        style={size === 'large' ? { height: 68 } : undefined}
      />
    </Link>
  );
};

export default Logo;
