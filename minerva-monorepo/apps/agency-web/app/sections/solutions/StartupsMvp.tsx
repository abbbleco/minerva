import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function StartupsMvp(): JSX.Element {
  return (
<section className="section_mvp-startups">
          <div className="w-layout-blockcontainer container w-container">
            <div className="mvp_startups-main">
              <div className="mvp_startups-title-wrapper">
                <h2 className="heading-style-h2 is-centered mvp_startups-heading">
                  We fulfill the <span className="is-toxic-green">needs</span
                  ><br />of startups at all stages of company growth
                </h2>
                <div className="mvp_startups-title-line w-embed">
                  <svg
                    width="auto"
                    height="auto"
                    viewBox="0 0 195 77"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 9.27233C39.6045 1.00195 95.267 0.276465 123.745 4.62929C152.224 8.98212 193 21.3151 193 43.8047C193 66.2943 142.302 75 98.7168 75C55.1318 75 8.29762 63.0733 7.77335 41.4542C7.24909 19.8352 68.083 18.4132 68.083 18.4132"
                      stroke="#D0F601"
                      strokeWidth="4"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                    ></path>
                  </svg>
                </div>
              </div>
              <div className="mvp_startups-cards">
                <div className="mvp_startups-card is-first">
                  <img
                    src="/img/22c26e09c6d7.webp"
                    loading="lazy"
                    alt=""
                    className="mvp_startups-card-icon" />
                  <h3 className="mvp_startups-card-heading">
                    Pre-seed and seed startups
                  </h3>
                  <p className="mvp_startups-card-text">
                    To demonstrate the core idea behind your startup and check
                    its viability, form the foundation of your MVP.
                  </p>
                </div>
                <div className="mvp_startups-card">
                  <img
                    src="/img/64997c7955fc.webp"
                    loading="lazy"
                    alt=""
                    className="mvp_startups-card-icon" />
                  <h3 className="mvp_startups-card-heading">Startups A/B/C</h3>
                  <p className="mvp_startups-card-text">
                    Demonstrates your ability to execute, helps to achieve
                    product-market fit, and gets stable revenue traction.
                  </p>
                </div>
                <div className="mvp_startups-card is-gradient">
                  <img
                    src="/img/0d059a2381b7.webp"
                    loading="lazy"
                    alt=""
                    className="mvp_startups-card-icon" />
                  <h3 className="mvp_startups-card-heading">Enterprises</h3>
                  <p className="mvp_startups-card-text">
                    To create and add a new feature or a new product within the
                    framework of your existing company.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
