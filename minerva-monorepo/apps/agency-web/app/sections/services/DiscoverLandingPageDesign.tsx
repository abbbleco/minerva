import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverLandingPageDesign(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title bi-service-title">
                  <h2 className="heading-style-h2 is-centered">
                    Discover how efficient landing page design services can
                    affect your product
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/86aa9bffca56.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Get a strong digital presence
                  </h3>
                  <p className="services-page-discover_item-text">
                    Improve your reputation and brand awareness, and make your
                    product recognizable on the market and among users.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/8142d4e86aa3.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Attract quality leads and increase sales
                  </h3>
                  <p className="services-page-discover_item-text">
                    A professional landing page design will attract more leads,
                    help convert them into regular customers, and increase
                    profits.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/6db84f67a51b.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Reach your target audience
                  </h3>
                  <p className="services-page-discover_item-text">
                    Before creating the design for your landing page, we
                    research your target audience to understand their
                    preferences, needs, and goals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
