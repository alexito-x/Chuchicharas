import { Star } from 'lucide-react';

const Stars = ({ rating = 0, size = 13 }) => {
  return (
    <span className="stars" aria-label={`Calificación ${rating} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          style={{
            color: i <= Math.round(rating) ? '#ffb400' : 'var(--border)',
            fill: i <= Math.round(rating) ? '#ffb400' : 'transparent'
          }}
        />
      ))}
    </span>
  );
};

export default Stars;