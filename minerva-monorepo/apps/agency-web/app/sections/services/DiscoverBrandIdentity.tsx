import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverBrandIdentity(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title bi-service-title">
                  <h2 className="heading-style-h2 is-centered">
                    Discover how efficient Brand Identity can affect your
                    product
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/6b9819834ae5.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Recognition and trust-building
                  </h3>
                  <p className="services-page-discover_item-text">
                    Strong visual identity services build product recognition
                    and familiarity among users and establish a trustworthy
                    brand image.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/8d155f22f836.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Differentiation among competitors
                  </h3>
                  <p className="services-page-discover_item-text">
                    A unique and memorable brand helps you to gain a competitive
                    advantage and set your business apart from competitors.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/2d018d0bca86.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Adaptability to fast-pacing market
                  </h3>
                  <p className="services-page-discover_item-text">
                    A recognizable branding identity will help your business
                    stay relevant and modern in the ever-changing digital space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
