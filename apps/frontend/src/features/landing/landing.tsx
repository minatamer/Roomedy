import Link from 'next/link';
import { Brand } from './brand';
import { RoomStory } from './room-story';
import { createRoomFixture } from '../session/fixtures/rooms';
export function Landing() {
  return (
    <>
      <header className="site-header shell">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link className="nav-cta" href="/demo">
            Start designing <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </header>
      <main id="main-content">
        <section className="hero shell">
          <div className="hero-copy">
            <p className="eyebrow">A little space. A lot of possibility.</p>
            <h1>
              Make room for
              <br />
              the way <em>you live.</em>
            </h1>
            <p className="hero-description">
              A fresh perspective on the room you have. Explore it in 2D and 3D,
              arrange it yourself, or ask for a little help.
            </p>
            <Link className="button primary" href="/demo">
              Start designing <span aria-hidden="true">↗</span>
            </Link>
            <p className="cta-note">No account needed.</p>
            <a className="hero-scroll" href="#how-it-works">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero-art">
            <RoomStory room={createRoomFixture()} />
          </div>
        </section>
        <section
          className="how shell"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <div className="section-intro">
            <p className="eyebrow">FROM FIRST LOOK TO FRESH START</p>
            <h2 id="how-title">
              See what your room
              <br />
              could become.
            </h2>
            <p>An empty room, a few pieces, or everything you already own.</p>
          </div>
          <ol className="steps">
            <li>
              <span className="step-number">01</span>
              <h3>Start with your space.</h3>
              <p>Try a sample, or begin with your own bedroom or workspace.</p>
            </li>
            <li>
              <span className="step-number">02</span>
              <h3>Make it yours.</h3>
              <p>
                Photos begin as a rough 2D sketch. Review the pieces and
                measurements before you enter the editor.
              </p>
            </li>
            <li>
              <span className="step-number">03</span>
              <h3>Find a better arrangement.</h3>
              <p>
                Explore in 2D and 3D. Review an assistant’s changes, Apply them,
                and Undo the whole change.
              </p>
            </li>
          </ol>
        </section>
      </main>
      <footer className="site-footer shell">
        <Brand />
        <span>tryroomedy.com</span>
      </footer>
    </>
  );
}
