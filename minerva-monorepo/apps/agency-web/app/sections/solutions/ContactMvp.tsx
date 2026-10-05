import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function ContactMvp(): JSX.Element {
  return (
<section className="section_solution-page-contact">
          <div className="w-layout-blockcontainer container w-container">
            <div className="solution-page_contact-main">
              <div className="solution-page_contact-review-block">
                <div className="solution-page_contact-review-header">
                  <img
                    src="/svg/a5ac569afada.svg"
                    loading="lazy"
                    alt="Clutch"
                    className="solution-page_contact-review-icon is-contact" />
                  <h3 className="solution-page_contact-review-heading is-contact">
                    Clients Thoughts
                  </h3>
                </div>
                <div className="solution-page_contact-review-main">
                  <p className="solution-page_contact-review-text">
                    Abbble Co excels with meticulous attention to detail,
                    commitment to excellence, and creative problem-solving.
                    Their inventive solutions captivate visually and
                    significantly enhance the user experience.
                  </p>
                </div>
                <div className="solution-page_contact-review-bottom">
                  <img
                    src="/img/fcabe9515a72.webp"
                    loading="lazy"
                    alt="Aitienne Sardon"
                    className="solution-page_contact-review-author-image" />
                  <div className="solution-page_contact-review-author">
                    <p className="solution-page_contact-review-text is-contact">
                      Aetienne Sardon
                    </p>
                    <div
                      className="solution-page_contact-review-auhtor-bio is-solution-page"
                    >
                      Founder, MYSO Finance
                    </div>
                  </div>
                </div>
              </div>
              <div
                id="w-node-e2af447a-6b31-c19f-87e2-99f513619f66-caf1abda"
                className="solution-page_contact-cta-block"
              >
                <div className="solution-page_contact-cta-title-wrapper">
                  <img
                    src="/svg/512519bacd95.svg"
                    loading="lazy"
                    alt=""
                    className="solution-page_contact-arrow-bg" />
                  <h2 className="heading-style-h1 solution-page-contact-h1">
                    Tell us about your next project
                  </h2>
                </div>
                <div className="solution-page_contact-btn-wrapper">
                  <a
                    data-wf--yellow-fill-arrow-button--variant="base"
                    href="/contact"
                    className="button w-inline-block"
                    ><div className="button-arrow is-solution-page-arrow">
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
                      <div className="button-text">Contact us</div>
                    </div></a
                  >
                </div>
              </div>
            </div>
          </div>
          <img
            src="/svg/56b925692c2b.svg"
            loading="lazy"
            alt=""
            className="mvp_contact-bg-1440 is-image" />
        
      <div className="section-separator"></div>
    </section>
  );
}
