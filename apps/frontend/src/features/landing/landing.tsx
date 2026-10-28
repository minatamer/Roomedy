import Link from 'next/link';
import { Brand } from './brand';
import { ScrollRoom } from './scroll-room';
import { MedyIcon } from '../assistant/medy-icon';
import {
  CleanLandingFragment,
  SectionScroll,
} from '../navigation/section-scroll';
import styles from './landing.module.css';
import {
  landingAmount,
  landingEstimate,
  landingEstimateAt,
  landingFloorPacks,
  landingPaintCans,
} from './story-estimate';

const example = landingEstimateAt(0);
export function Landing() {
  return (
    <>
      <CleanLandingFragment />
      <header className={`site-header shell ${styles.header}`}>
        <Brand />
        <nav aria-label="Main navigation">
          <SectionScroll className={styles.howLink} target="how-it-works">
            How it works
          </SectionScroll>
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
                  The room you have. The life you want to make room for. Explore
                  the design, the finishes, and what it could cost.
                </p>
                <Link className="button primary" href="/demo">
                  Start designing <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <SectionScroll className={styles.scrollCue} target="how-it-works">
                <span className={styles.cueMouse}>
                  <svg viewBox="0 0 24 34" fill="none" aria-hidden="true">
                    <rect
                      x="4.5"
                      y="2.5"
                      width="15"
                      height="28"
                      rx="7.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <rect
                      className={styles.cueWheel}
                      x="11"
                      y="8"
                      width="2"
                      height="6"
                      rx="1"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Scroll to explore</span>
                </span>
                <span className={styles.cueTouch}>
                  <svg
                    className={styles.cueFinger}
                    viewBox="0 0 28 32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 16V6a2 2 0 0 1 4 0v7a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v4a7 7 0 0 1-7 7h-2c-3 0-4.5-1.5-6-4l-4-6a2 2 0 0 1 3-2l2 2" />
                    <path d="M13 13v4m4-2v3m4-1v2" />
                  </svg>
                  <span>Swipe up to explore</span>
                </span>
              </SectionScroll>
            </section>
            <section
              className={styles.chapter}
              data-scroll-target="how-it-works"
              aria-labelledby="how-title"
              data-room-chapter
            >
              <div className={styles.copy}>
                <p className={styles.chapterLabel}>
                  <span>01</span> Start with what’s yours
                </p>
                <h2 id="how-title">
                  Every room has
                  <br />
                  <em>a starting point.</em>
                </h2>
                <p className={styles.description}>
                  An empty bedroom. A desk you love. Start with the space and
                  pieces you already have, then picture what comes next.
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
                  Build manually, or start with photos. Adjust the measurements
                  and choose what stays. Your room is the starting point.
                </p>
                <SectionScroll
                  className={styles.chapterLink}
                  target="make-it-yours"
                >
                  Make it yours <span aria-hidden="true">↘</span>
                </SectionScroll>
              </div>
            </section>
            <section
              className={`${styles.chapter} ${styles.right}`}
              data-scroll-target="make-it-yours"
              aria-labelledby="arrange-title"
              data-room-chapter
            >
              <div className={styles.copy}>
                <p className={styles.chapterLabel}>
                  <span>02</span> Choose how it feels
                </p>
                <h2 id="arrange-title">
                  Colour. Texture.
                  <br />
                  Room for <em>you.</em>
                </h2>
                <p className={styles.description}>
                  A fresh coat of paint. A floor with a little warmth. Furniture
                  that fits the way you live. Watch your choices come together.
                </p>
                <div
                  className={styles.finishes}
                  aria-label="Example room finishes"
                >
                  <div>
                    <span className={styles.paintSwatch} aria-hidden="true" />
                    <div>
                      <h3>Soft sage walls</h3>
                      <p>A little colour changes the whole room.</p>
                    </div>
                  </div>
                  <div>
                    <span className={styles.floorSwatch} aria-hidden="true" />
                    <div>
                      <h3>Oak underfoot</h3>
                      <p>Try the texture before making the choice.</p>
                    </div>
                  </div>
                </div>
                <p className={styles.detail}>
                  Explore wall, floor and furniture finishes in 3D. Arrange the
                  pieces, then use the 2D plan to check placement and
                  dimensions.
                </p>
                <SectionScroll
                  className={styles.chapterLink}
                  target="a-fresh-angle"
                >
                  See what it could cost <span aria-hidden="true">↘</span>
                </SectionScroll>
              </div>
            </section>
            <section
              className={`${styles.chapter} ${styles.costChapter}`}
              data-scroll-target="a-fresh-angle"
              aria-labelledby="perspective-title"
              data-room-chapter
            >
              <div className={styles.copy}>
                <p className={styles.chapterLabel}>
                  <span>03</span> See the choices and the costs
                </p>
                <h2 id="perspective-title">
                  Your design.
                  <br />
                  <em>A clearer budget.</em>
                </h2>
                <p className={styles.description}>
                  Connect the room you can see to the costs behind it. Compare
                  options with Medy, and review a change before making it yours.
                </p>
                <div
                  className={styles.quote}
                  data-landing-estimate
                  data-choice="oak"
                  role="group"
                  aria-label="Illustrative room estimate in US dollars"
                >
                  <div className={styles.quoteHeading}>
                    <span>
                      Illustrative estimate · {landingEstimate.currency}
                    </span>
                    <span>{landingEstimate.floorArea.toFixed(1)} m² room</span>
                  </div>
                  <dl>
                    <div className={styles.quoteRow}>
                      <dt>
                        Flooring
                        <small>
                          <span data-example-finish>{example.finish}</span> ·{' '}
                          {landingFloorPacks} packs
                        </small>
                      </dt>
                      <dd data-example-floor>{landingAmount(example.floor)}</dd>
                    </div>
                    <div className={styles.quoteRow}>
                      <dt>
                        Walls
                        <small>{landingPaintCans} paint cans + primer</small>
                      </dt>
                      <dd>{landingAmount(example.paint)}</dd>
                    </div>
                    <div className={styles.quoteRow}>
                      <dt>
                        Furniture<small>Five selected pieces</small>
                      </dt>
                      <dd>{landingAmount(example.furniture)}</dd>
                    </div>
                    <div className={styles.quoteRow}>
                      <dt>
                        Work &amp; moving
                        <small>Fitting, painting, clear &amp; return</small>
                      </dt>
                      <dd>{landingAmount(example.work)}</dd>
                    </div>
                  </dl>
                  <div className={styles.quoteTotal}>
                    <span>Estimated total</span>
                    <span aria-live="polite">
                      {landingEstimate.currency}{' '}
                      <strong data-example-total>
                        {landingAmount(example.total)}
                      </strong>
                    </span>
                  </div>
                  <p className={styles.quoteSaving}>
                    <span data-example-saving hidden />
                  </p>
                </div>
                <div
                  className={styles.budgetConversation}
                  aria-label="An example budget conversation with Medy"
                >
                  <p>“Could we keep it under $2,100?”</p>
                  <p>
                    <MedyIcon />
                    <strong>Medy</strong> Let’s compare a lighter oak floor and
                    keep the pieces you chose.
                  </p>
                </div>
                <SectionScroll
                  className={styles.chapterLink}
                  target="plan-your-room"
                >
                  See the plan take shape <span aria-hidden="true">↘</span>
                </SectionScroll>
              </div>
            </section>
            <section
              className={`${styles.chapter} ${styles.right}`}
              data-scroll-target="plan-your-room"
              aria-labelledby="plan-title"
              data-room-chapter
            >
              <div className={styles.copy}>
                <p className={styles.chapterLabel}>
                  <span>04</span> Take the next step with a plan
                </p>
                <h2 id="plan-title">
                  Know what to buy.
                  <br />
                  <em>And what comes next.</em>
                </h2>
                <p className={styles.description}>
                  Bring the design, the quantities and the work together. Keep a
                  version you can return to, and take an itemized estimate with
                  you.
                </p>
                <div
                  className={styles.planSheet}
                  data-landing-plan
                  role="group"
                  aria-label="Shopping, work and estimate example"
                >
                  <div className={styles.planHeading}>
                    <span className={styles.sheetBrand}>Roomedy estimate</span>
                    <span>Your room plan</span>
                  </div>
                  <ol>
                    <li>
                      <span>01</span>
                      <div>
                        <h3>A useful shopping list</h3>
                        <p>
                          Floor packs, paint cans and chosen pieces, with the
                          quantities behind them.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span>02</span>
                      <div>
                        <h3>The work around the room</h3>
                        <p>
                          Painting, fitting and moving pieces, with the checks
                          still needed before work begins.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span>03</span>
                      <div>
                        <h3>A version you can keep</h3>
                        <p>
                          Compare saved estimates and download an itemized PDF
                          of the version you choose.
                        </p>
                      </div>
                    </li>
                  </ol>
                  <div className={styles.planFooter}>
                    <span className={styles.pdfMark} aria-hidden="true">
                      PDF
                    </span>
                    <span>Design · quantities · costs · work plan</span>
                  </div>
                </div>
                <Link href="/demo" className={styles.chapterLink}>
                  Design and plan your room <span aria-hidden="true">↗</span>
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
                    <span>UNDERSTAND YOUR OPTIONS</span>
                    <h3>See the trade-offs.</h3>
                    <p>
                      Compare finishes and products alongside their quantities
                      and costs, with unknowns kept visible.
                    </p>
                  </div>
                  <div>
                    <span>TAKE A CLEARER NEXT STEP</span>
                    <h3>Leave with a plan.</h3>
                    <p>
                      Bring together what to buy, the work involved and an
                      itemized estimate. No account or installation to begin.
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
                  <p>Design your room. Explore the options. Plan the cost.</p>
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
