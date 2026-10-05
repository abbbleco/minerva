import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverUiConcept(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title">
                  <h2 className="heading-style-h2 is-centered">
                    Discover how UI Сoncept design<br />can affect your business
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/fa5255143470.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Define your product`s style direction
                  </h3>
                  <p className="services-page-discover_item-text">
                    We create several UI design concept variations that differ
                    in style, color, fonts and allow you to choose the one
                    that`s right for you and your product.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/9d9cd68ae3da.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Stand out among competitors
                  </h3>
                  <p className="services-page-discover_item-text">
                    When you have defined the right direction and style based on
                    competitors and market trends - it gives competitive
                    advantage to your product.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/19c87c606725.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Draw user`s attention to your product
                  </h3>
                  <p className="services-page-discover_item-text">
                    Creating the UI concept design allows you to choose the
                    style that corresponds to your user`s needs and and
                    expectations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
