import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function MatchSaas(): JSX.Element {
  return (
<section className="section_services-page-match">
            <div className="w-layout-blockcontainer container w-container">
              <div className="services-page-match_main">
                <div className="services-page-match_title-wrapper">
                  <div className="services-page-match_title">
                    <h2 className="heading-style-h1 services-page-match_heading">
                      3-day FREE trial to get to know us
                    </h2>
                    <p
                      className="regular-text is-centered services-page-match_text"
                    >
                      Ready to see the impact of expert SaaS design firsthand?
                      This trial is our way of showing you exactly how we bring
                      value — through streamlined design and our commitment to
                      your success.
                    </p>
                  </div>
                </div>
                <a
                  data-wf--yellow-fill-arrow-button--variant="base"
                  href="/contact"
                  className="button w-inline-block"
                >
                  <div className="button-arrow is-solution-page-arrow">
                    <div className="code-embed w-embed">
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 36 36"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.99805 9.00098L26.998 27.001"
                          stroke="#141515"
                          strokeWidth="2"
                        ></path>
                        <path
                          d="M8.99203 26.9923H26.9922V8.99219"
                          stroke="#141515"
                          strokeWidth="2"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div className="button-text-wrapper is-solution-page-button">
                    <div className="button-text">Book a free trial</div>
                  </div>
                </a>
              </div>
            </div>
            <img
              src="/svg/20420160cee9.svg"
              loading="lazy"
              alt=""
              className="services-page-match_bg-1440 industry-page" />
          
      <div className="section-separator"></div>
    </section>
  );
}
