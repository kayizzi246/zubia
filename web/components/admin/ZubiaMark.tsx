export function ZubiaMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M4 15 16 5l12 10v13H4z" fill="#0B6B4F" />
      <path d="M11 28v-8h10v8" fill="#F2B705" />
    </svg>
  );
}
