import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverUxAudit(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title uxa-service-title">
                  <h2 className="heading-style-h2 is-centered">
                    How our UX Audit agency solves these issues
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/bebff2bb5c12.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Evaluated user experience
                  </h3>
                  <p className="services-page-discover_item-text">
                    We will examine every aspect of the user journey and
                    identify their pain points to design intuitive, engaging,
                    and satisfying user experiences.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/501f195eda31.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Reduced bounce rates
                  </h3>
                  <p className="services-page-discover_item-text">
                    Our targeted improvements will help you reduce bounce rates
                    and convert users into customers thanks to a seamless
                    experience.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/c35f3afa8bdc.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Increased user satisfaction &amp; loyalty
                  </h3>
                  <p className="services-page-discover_item-text">
                    With user-centered design, your product becomes a pleasure
                    to use. Satisfied users will return and become advocates for
                    your brand.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
