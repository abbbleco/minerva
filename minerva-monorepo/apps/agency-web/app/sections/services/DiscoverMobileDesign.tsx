import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverMobileDesign(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title">
                  <h2 className="heading-style-h2 is-centered">
                    Discover how efficient<br />mobile application design<br />services
                    can affect your business
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/fe627430143d.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Intuitive and clear mobile design
                  </h3>
                  <p className="services-page-discover_item-text">
                    Our mobile design approach prioritizes intuitive layouts,
                    clear navigation, and accessible functionality. Our goal is
                    to keep users engaged and satisfied with flawless design.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/f49a4829a083.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Engaging app user experience
                  </h3>
                  <p className="services-page-discover_item-text">
                    Our mobile UI UX design services keep your users engaged and
                    captivated, which leads to higher user retention and
                    memorable experiences.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/1adcee0dbeca.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    App design that reflects your brand
                  </h3>
                  <p className="services-page-discover_item-text">
                    We design mobile applications that strengthen recognition
                    and trust. With Abbble Co, your app becomes a powerful
                    representation of your brand in users’ hands.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
