const Loader = ({ text = 'Cargando...', fullScreen = false }) => {
  return (
    <div
      className="loading-screen"
      style={fullScreen ? { minHeight: '60vh' } : undefined}
    >
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
};

export default Loader;