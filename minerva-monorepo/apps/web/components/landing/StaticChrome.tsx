import Link from "next/link";
import { ScrambleLabel } from "./ScrambleLabel";

const ARROW_PATH =
  "M4.5 1.296H1.5L1.488 0.0119998L6.756 0L6.744 5.268L5.46 5.256V2.256L0.96 6.756L0 5.796L4.5 1.296Z";

const INDEX_BASE = "FOR CONTEXT & CACHE CULTURE";
const LABEL_BASE = "CONSTELLATION";

function Arrow(): React.JSX.Element {
  return (
    <>
      <svg
        className="rel"
        width="7"
        height="7"
        viewBox="0 0 7 7"
        fill="#E2E6E3"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={ARROW_PATH} fill="#E2E6E3" />
      </svg>
      <svg
        className="abs"
        width="7"
        height="7"
        viewBox="0 0 7 7"
        fill="#E2E6E3"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={ARROW_PATH} fill="#E2E6E3" />
      </svg>
    </>
  );
}

export function StaticChrome(): React.JSX.Element {
  return (
    <>
      <Link href="/" className="main_logo" aria-label="Minerva home">
        <span className="main_logo_inner">
          <img src="/img/branding/logo.svg" alt="" draggable={false} />
          <span className="wordmark">minerva</span>
        </span>
      </Link>
      <nav className="main_links" aria-label="Primary">
        <div />
        <span className="center">
          <a href="https://abbble.co.za" className="element cursor_out">
            <ScrambleLabel text="ABBBLE CO" />
          </a>
        </span>
        <span className="nav_right cursor_out">
          <Link href="/docs" className="element cursor_out">
            <ScrambleLabel text="DOCS" />
          </Link>
          <a href="/pricing" className="element cursor_out">
            <ScrambleLabel text="PRICING" />
          </a>
          <Link href="/login" className="element cursor_out">
            <ScrambleLabel text="GET STARTED" />
          </Link>
        </span>
      </nav>
      <div className="icons_frame" aria-hidden="true">
        <div className="icons icon_home">
          <img src="/img/branding/logo.svg" alt="" draggable={false} />
        </div>
      </div>
      <div className="works_infos">
        <div className="l" aria-hidden="true">
          <p className="work_index" id="worksIndex">
            {INDEX_BASE}
          </p>
        </div>
        <div className="m" aria-hidden="true">
          <p className="work_label" id="worksLabel">
            {LABEL_BASE}
          </p>
        </div>
        <div className="r">
          <div className="jour_link">
            <Link
              href="https://abbble.co.za"
              target="blank"
              className="jour cursor_out"
              aria-label="By ABBBLE CO"
            >
              <ScrambleLabel text="ABBBLE CO" />
              <span className="arrow_c">
                <Arrow />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
