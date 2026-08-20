export function FacebookIcon({ fill = "#1877F2", size = 18 }: { fill?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M11.5 18v-6h2l.4-2.6h-2.4V7.7c0-.75.2-1.26 1.28-1.26H14V4.12A17 17 0 0012.02 4C10.06 4 8.7 5.2 8.7 7.4v2H6.5V12h2.2v6z"
        fill={fill}
      />
    </svg>
  );
}
