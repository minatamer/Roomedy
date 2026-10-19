import Link from 'next/link';
import { Brand } from './brand';
import { ScrollRoom } from './scroll-room';
import styles from './landing.module.css';
export function Landing() {
  return (
    <>
      <header className={`site-header shell ${styles.header}`}>
        <Brand />
        <nav aria-label="Main navigation">
          <Link href="#how-it-works">How it works</Link>
          <Link className="nav-cta" href="/demo">
            Start designing <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </header>
      <div className={styles.landing}>
        <div className={styles.journey} data-landing-journey>
          <ScrollRoom />
          <main id="main-content">
            <section
              className={`${styles.chapter} ${styles.hero}`}
              data-room-chapter
            >
              <div className={styles.copy}>
                <p className="eyebrow">YOUR ROOM. REIMAGINED.</p>
                <h1>
                  Make room for
                  <br />
                  the way <em>you live.</em>
                </h1>
                <p className={styles.description}>
                  The room you have. The life you want to make room for. See
                  your ideas take shape, in 2D and 3D.
                </p>
                <Link className="button primary" href="/demo">
                  Start designing <span aria-hidden="true">↗</span>
                </Link>
                <p className="cta-note">No account needed.</p>
                <Link className={styles.scrollLink} href="#how-it-works">
                  Scroll to make room <span aria-hidden="true">↓</span>
                </Link>
              </div>
            </section>
            <section
              className={styles.chapter}
              id="how-it-works"
              aria-labelledby="how-title"
              data-room-chapter
            >
              <div className={styles.copy}>
                <p className={styles.chapterLabel}>
                  <span>01</span> START WITH WHAT’S YOURS
                </p>
                <h2 id="how-title">
                  Every room has
                  <br />
                  <em>a starting point.</em>
                </h2>
                <p className={styles.description}>
                  An empty bedroom. A desk you love. A room that has almost
                  everything, except the right arrangement.
                </p>
                <div className={styles.sketch} aria-hidden="true">
                  <svg viewBox="0 0 360 155" fill="none">
                    <path
                      d="M26 133V20h286v113H26Z"
                      stroke="#987551"
                      strokeWidth="2"
                      strokeDasharray="7 5"
                    />
                    <rect
                      x="43"
                      y="38"
                      width="85"
                      height="76"
                      rx="4"
                      fill="#d9bc96"
                    />
                    <path
                      d="M45 57h81M54 46h23m12 0h23"
                      stroke="#fff8ed"
                      strokeWidth="5"
                    />
                    <rect
                      x="202"
                      y="36"
                      width="82"
                      height="32"
                      rx="4"
                      fill="#bc9571"
                    />
                    <path d="M23 13H317m0-4v8M23 9v8" stroke="#987551" />
                    <text x="143" y="10" fontSize="9" fill="#78553d">
                      YOUR MEASUREMENTS
                    </text>
                    <path
                      d="m333 80 9 9-9 9m-12-9h21"
                      stroke="#78553d"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <p className={styles.detail}>
                  Try a ready-to-edit room, or add your own. Photos start as a
                  rough 2D sketch: review the pieces and measurements, then open
                  your studio.
                </p>
                <Link className={styles.chapterLink} href="#make-it-yours">
                  Find your flow <span aria-hidden="true">↘</span>
                </Link>
              </div>
            </section>
            <section
              className={`${styles.chapter} ${styles.right}`}
              id="make-it-yours"
              aria-labelledby="arrange-title"
              data-room-chapter
            >
              <div className={styles.copy}>
                <p className={styles.chapterLabel}>
                  <span>02</span> GIVE YOUR IDEAS SOME SPACE
                </p>
                <h2 id="arrange-title">
                  A place to work.
                  <br />
                  Room to <em>switch off.</em>
                </h2>
                <p className={styles.description}>
                  Your room does more than one thing. Find an arrangement that
                  makes sense for the way you use it.
                </p>
                <div className={styles.intentions}>
                  <div>
                    <span aria-hidden="true">☀</span>
                    <h3>Follow the daylight.</h3>
                    <p>Explore a brighter place for your work area.</p>
                  </div>
                  <div>
                    <span aria-hidden="true">↗</span>
                    <h3>Find a little breathing room.</h3>
                    <p>Try the layout before moving the heavy furniture.</p>
                  </div>
                </div>
                <p className={styles.detail}>
                  Place and rotate pieces in 3D. Use the 2D plan for precise
                  measurements. Keep what works, and change what doesn’t.
                </p>
              </div>
            </section>
            <section
              className={styles.chapter}
              id="a-fresh-angle"
              aria-labelledby="perspective-title"
              data-room-chapter
            >
              <div className={styles.copy}>
                <p className={styles.chapterLabel}>
                  <span>03</span> SEE IT FROM A FRESH ANGLE
                </p>
                <h2 id="perspective-title">
                  Your ideas.
                  <br />
                  <em>A design partner.</em>
                </h2>
                <p className={styles.description}>
                  “Bring my work area closer to the window.” Start a
                  conversation, explore a suggestion, and decide what feels
                  right.
                </p>
                <div className={styles.designerNote}>
                  <span aria-hidden="true">✦</span>
                  <p>
                    More than a pretty picture. A room you can look around,
                    measure, and keep making your own.
                  </p>
                </div>
                <p className={styles.detail}>
                  The assistant works with your room and the pieces you want to
                  keep. Review its changes before they become yours.
                </p>
                <Link href="/demo" className={styles.chapterLink}>
                  Step into your studio <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>
            <section
              className={`${styles.chapter} ${styles.why}`}
              aria-labelledby="why-title"
              data-room-chapter
            >
              <div className={styles.valueContent}>
                <div className={styles.whyIntro}>
                  <p className="eyebrow">LESS GUESSING. MORE POSSIBILITY.</p>
                  <h2 id="why-title">
                    It’s easier to love a room
                    <br />
                    you can <em>picture first.</em>
                  </h2>
                  <p>
                    Sometimes a fresh start is a better place for the furniture
                    you already have.
                  </p>
                </div>
                <div className={styles.research}>
                  <span className={styles.stat}>
                    22<span>%</span>
                  </span>
                  <p>
                    of renovating homeowners said they struggled to picture the
                    finished result, according to Houzz.
                  </p>
                  <a
                    href="https://pro.houzz.com/pro-learn/blog/sneak-peek-houzz-reveals-11-of-the-top-home-design-predictions-for-2026"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Houzz · 2026 design predictions{' '}
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
                <div className={styles.reasons}>
                  <div>
                    <span>KEEP WHAT YOU LOVE</span>
                    <h3>Start with your own pieces.</h3>
                    <p>
                      Work around the furniture you want to keep, instead of
                      starting from scratch.
                    </p>
                  </div>
                  <div>
                    <span>MAKE IT FEEL RIGHT</span>
                    <h3>See beyond the floor plan.</h3>
                    <p>
                      Try an interior view, explore finishes, and get a feel for
                      the whole room.
                    </p>
                  </div>
                  <div>
                    <span>START WITH AN IDEA</span>
                    <h3>Your browser is your studio.</h3>
                    <p>
                      No account or installation to begin. Just a room and a
                      little curiosity.
                    </p>
                  </div>
                </div>
              </div>
            </section>
            <section
              className={`${styles.chapter} ${styles.invitation}`}
              aria-labelledby="start-title"
              data-room-chapter
            >
              <div className={styles.invitationContent}>
                <span className={styles.invitationMark} aria-hidden="true">
                  ↗
                </span>
                <div>
                  <p className="eyebrow">MAKE A LITTLE ROOM FOR WHAT’S NEXT</p>
                  <h2 id="start-title">
                    A fresh perspective.
                    <br />
                    <em>Your space.</em>
                  </h2>
                </div>
                <div className={styles.invitationAction}>
                  <Link className="button primary" href="/demo">
                    Start designing <span aria-hidden="true">↗</span>
                  </Link>
                  <p>Try a room, or bring your own.</p>
                </div>
              </div>
            </section>
          </main>
          <footer className={styles.footer}>
            <Brand />
          </footer>
        </div>
      </div>
    </>
  );
}
