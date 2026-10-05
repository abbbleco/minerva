import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverUiUxDesign(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title ui-ux-service">
                  <h2 className="heading-style-h2 is-centered">
                    Discover how efficient UX Design company can affect your
                    product
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/1989cac9e7a6.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Improved user retention
                  </h3>
                  <p className="services-page-discover_item-text">
                    Reduces the amount of effort needed to reach new customers
                    continually.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/0e23c5621b0b.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Higher user satisfaction
                  </h3>
                  <p className="services-page-discover_item-text">
                    Leads to higher lifetime value of your clients and a
                    stronger brand reputation.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/fdc71099db8f.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Increased conversion rates
                  </h3>
                  <p className="services-page-discover_item-text">
                    Indicates that a business is effectively converting leads
                    into customers, resulting in higher profits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
