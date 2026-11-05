const ProductSkeleton = ({ count = 8 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-skeleton">
          <div className="skeleton sk-image" />
          <div className="sk-body">
            <div className="skeleton" style={{ height: 11, width: '35%' }} />
            <div className="skeleton" style={{ height: 15, width: '90%' }} />
            <div className="skeleton" style={{ height: 15, width: '60%' }} />
            <div className="skeleton" style={{ height: 21, width: '50%', marginTop: 4 }} />
            <div className="skeleton" style={{ height: 12, width: '70%' }} />
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductSkeleton;