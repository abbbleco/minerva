import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverProductDiscovery(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title">
                  <h2 className="heading-style-h2 is-centered">
                    How our Product Discovery Company<br />can drive your
                    success
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/ff87d5b9c20c.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Get confident in your vision &amp; users
                  </h3>
                  <p className="services-page-discover_item-text">
                    We deeply research your target audience and uncover their
                    needs and pain points to craft a user-focused design that
                    truly resonates.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/13caeb571013.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Minimize design and development risks
                  </h3>
                  <p className="services-page-discover_item-text">
                    Our process helps you avoid costly setbacks by identifying
                    and resolving potential issues early, saving you time,
                    money, and effort.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/855e5aeac9e5.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Gain competitive advantage
                  </h3>
                  <p className="services-page-discover_item-text">
                    Through market research and competitive analysis, we provide
                    actionable insights into trends, demands, and opportunities
                    to differentiate your product.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
