import { useId, useState } from 'react';
import styles from './capture-guide.module.css';
export function CaptureGuide() {
  const [play, setPlay] = useState(0),
    id = useId();
  return (
    <div className={styles.guide}>
      <div className={styles.top}>
        <p>TWO CORNERS. ONE WHOLE ROOM.</p>
        <button
          type="button"
          className={styles.replay}
          onClick={() => setPlay((v) => v + 1)}
          aria-label="Replay photo guide"
        >
          ↻ Replay
        </button>
      </div>
      <div className={styles.body}>
        <svg key={play} viewBox="0 -20 370 255" role="img" aria-labelledby={id}>
          <title id={id}>
            A person holds a phone in one corner, walks along the clear side of
            the room, then takes a second wide photo from the opposite corner.
          </title>
          <defs>
            <linearGradient id={id + 'floor'} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#ead4ad" />
              <stop offset="1" stopColor="#c8a77c" />
            </linearGradient>
          </defs>
          <path
            d="m40 103 150-72 140 79-150 91Z"
            fill={'url(#' + id + 'floor)'}
            stroke="#b79670"
          />
          <path d="M40 103V60l150-72v43Z" fill="#e5d8c3" />
          <path d="m190 31 140 79V67L190-12Z" fill="#dacbb4" />
          <path
            d="m65 114 150 78m-108-99 150 77m-108-97 150 76"
            fill="none"
            stroke="#bd9d75"
            opacity=".4"
          />
          <path d="m85 98 60-28 63 36-62 30Z" fill="#e8dcc6" />
          <path d="m85 98v21l61 39v-22Zm61 38v22l62-30v-22Z" fill="#b9956c" />
          <path d="m86 97 60-28V51L86 80Z" fill="#c7b18f" />
          <path
            d="m94 96 16-8 17 9-16 8Zm21-11 17-8 17 9-16 8Z"
            fill="#fff8e8"
          />
          <path d="m111 112 59-28 38 22-62 30Z" fill="#b88e6d" />
          <path d="m207 80 20-9 18 10-20 10Z" fill="#e9ddc7" />
          <path d="m207 80v19l18 11V91Zm18 11v19l20-10V81Z" fill="#c5ae8d" />
          <path
            d="m242 35 43 24v26l-43-24Z"
            fill="#b7cbc7"
            stroke="#f8f1e3"
            strokeWidth="5"
          />
          <path
            d="M180 182 76 100l210-1Z"
            fill="#f9e6b0"
            opacity=".45"
            className={styles.first}
          />
          <path
            d="m192 54-98 104 190 0Z"
            fill="#f9e6b0"
            opacity=".45"
            className={styles.second}
          />
          <path
            d="M180 182 300 118 260 73 192 54"
            fill="none"
            stroke="#9c7652"
            strokeDasharray="3 6"
            opacity=".5"
          />
          <circle cx="180" cy="182" r="13" fill="#f7eedc" stroke="#ae8965" />
          <text
            x="180"
            y="186"
            textAnchor="middle"
            fontSize="11"
            fill="#6f4c31"
          >
            1
          </text>
          <circle cx="192" cy="54" r="13" fill="#f7eedc" stroke="#ae8965" />
          <text x="192" y="58" textAnchor="middle" fontSize="11" fill="#6f4c31">
            2
          </text>
          <g className={styles.person}>
            <ellipse cy="6" rx="12" ry="5" fill="#765b3c" opacity=".2" />
            <circle cy="-25" r="7" fill="#b98260" />
            <path d="M-5-17h10l4 17H-8Z" fill="#78543e" />
            <path
              d="M-4-1-5 9M4-1l4 8"
              fill="none"
              stroke="#594737"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="m-4-13 10-3 6-9"
              fill="none"
              stroke="#b98260"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle
              cx="13"
              cy="-27"
              r="12"
              fill="#fff7d2"
              className={styles.flash}
            />
            <rect
              x="9"
              y="-32"
              width="8"
              height="13"
              rx="2"
              fill="#4e4840"
              stroke="#f2e5cb"
            />
            <rect x="11" y="-29" width="4" height="7" rx="1" fill="#b5c7bd" />
          </g>
        </svg>
      </div>
    </div>
  );
}
