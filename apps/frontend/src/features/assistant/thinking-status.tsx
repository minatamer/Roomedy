import { useId } from 'react';
import styles from './assistant.module.css';

export function ThinkingStatus() {
  const gradient = useId();
  return (
    <div className={styles.thinking} role="status" aria-label="Thinking">
      <svg
        className={styles.thinkingSpinner}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={gradient}
            x1="4"
            y1="4"
            x2="20"
            y2="20"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#c6ac87" stopOpacity="0.25" />
            <stop offset="0.55" stopColor="#b08a61" />
            <stop offset="1" stopColor="currentColor" />
          </linearGradient>
        </defs>
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.16"
        />
        <path
          d="M12 4a8 8 0 1 1-8 8"
          stroke={`url(#${gradient})`}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span>Thinking</span>
    </div>
  );
}
