export default function Card({ children, className = '', ...rest }) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
