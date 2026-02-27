export const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white border border-gray-200 rounded-xl ${className}`}>
    {children}
  </div>
);

export default GlassCard;
