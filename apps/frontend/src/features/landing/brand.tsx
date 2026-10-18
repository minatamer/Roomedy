import Link from 'next/link';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Roomedy home">
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 27V6h12c6 0 10 4 10 10v11H5Z"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path d="M15 27V17h12" stroke="currentColor" strokeWidth="3.5" />
      </svg>
      <span>
        roomedy<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
