export default function Avatar({ src, name, size = 40, className = '' }: { src?: string; name?: string; size?: number; className?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = (name || 'U').slice(0, 1).toUpperCase();
  return (
    <div
      className={`grid place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 ${className}`}
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}
