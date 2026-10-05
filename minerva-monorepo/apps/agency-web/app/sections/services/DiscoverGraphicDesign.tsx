import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverGraphicDesign(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title bi-service-title">
                  <h2 className="heading-style-h2 is-centered">
                    Discover how custom graphic design services can affect your
                    product
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/5e5fe35eb381.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Build trust &amp; loyalty
                  </h3>
                  <p className="services-page-discover_item-text">
                    Professional graphic design builds trust and loyalty among
                    users, establishing a trustworthy brand image.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/687d46e7ea81.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    High brand awareness
                  </h3>
                  <p className="services-page-discover_item-text">
                    Recognizable graphics will help your product to stay
                    relevant and modern in the ever-changing digital space.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/f892a21b56b8.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Strengthen your brand
                  </h3>
                  <p className="services-page-discover_item-text">
                    A unique and memorable brand helps you to gain a competitive
                    advantage and set your brand apart from competitors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
