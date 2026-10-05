import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverWebDesign(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title wd-service-title">
                  <h2 className="heading-style-h2 is-centered">
                    Discover How Efficient Web Design Services Can Affect Your
                    Product
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/107db975523e.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Get a strong web presence
                  </h3>
                  <p className="services-page-discover_item-text">
                    Improve your reputation and brand awareness, and make your
                    website memorable.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/821936f7b4e7.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Increase conversion rate
                  </h3>
                  <p className="services-page-discover_item-text">
                    Effectively convert your leads into customers and get higher
                    profits with our website design company.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/194470659ee5.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Improve retention rates
                  </h3>
                  <p className="services-page-discover_item-text">
                    Your current customers will value your product and provide a
                    sustainable revenue source.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
