import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverPitchDeck(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title pd-service-title">
                  <h2 className="heading-style-h2 is-centered">
                    Discover how powerful and effective pitch deck services can
                    help
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/e02d5325c45f.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Raise the desired amount of funding
                  </h3>
                  <p className="services-page-discover_item-text">
                    Our team has helped hundreds of startups and growing
                    businesses successfully present their ideas and raise funds
                    with pitch deck designing services.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/c6f73e1b9ff4.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Highlight your startup`s idea
                  </h3>
                  <p className="services-page-discover_item-text">
                    We know how to build a concise, professional pitch deck that
                    tells your business&apos;s story and drives investors to set up
                    the next meeting with you.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/cc42fedf58c4.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Rise above the competition
                  </h3>
                  <p className="services-page-discover_item-text">
                    Considering your competitors and discovering what would
                    differentiate your pitch from them is a key to competitive
                    advantage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
