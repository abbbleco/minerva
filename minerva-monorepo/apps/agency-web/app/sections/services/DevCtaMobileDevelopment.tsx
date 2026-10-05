import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DevCtaMobileDevelopment(): JSX.Element {
  return (
<section className="section_services-cta">
          <div className="w-layout-blockcontainer container w-container">
            <div
              className="services-cta_wrapper w-variant-ca89ed1d-5c05-4409-193e-9b4ccdfd8680"
            >
              <div className="services-cta_content">
                <div className="services-cta_top">
                  <h2 className="services-cta_heading">
                    Let`s build <em className="is-italic">successful</em> digital
                    product!
                  </h2>
                  <p className="services-cta_text">
                    We offer you a free 3-day trial work with one of our
                    &nbsp;web developers to cover your questions about our
                    working process.
                  </p>
                </div>
                <a
                  href="/contact"
                  data-wf--primary-button--variant="base"
                  className="primary-button w-inline-block"
                  ><div className="primary-button_arrow">
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
                  <div className="primary-button_text-wrapper">
                    <div className="button-text">Book a free trial</div>
                  </div></a
                >
              </div>
            </div>
          </div>
          <img
            src="/img/1d6027fccd03.avif"
            loading="lazy"
            sizes="100vw"
            alt=""
            className="services-section-bg" /><img
            src="/img/5972a7d379bf.avif"
            loading="lazy"
            sizes="100vw"
            alt=""
            className="services-section-bg is-desktop" /><img
            src="/img/ae3d73779c7b.avif"
            loading="lazy"
            sizes="100vw"
            alt=""
            className="services-section-bg is-tablet" /><img
            src="/img/4b4228044c4b.avif"
            loading="lazy"
            alt=""
            className="services-section-bg is-mobile" />
        
      <div className="section-separator"></div>
    </section>
  );
}
