import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DiscoverProofOfConcept(): JSX.Element {
  return (
<section className="section_services-page-discover">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-discover_main">
              <div className="services-page-discover_title-wrapper">
                <div className="services-page-discover_title">
                  <h2 className="heading-style-h2 is-centered">
                    Discover how a well-executed <br />proof of concept can help
                  </h2>
                </div>
              </div>
              <div className="services-page-discover_items">
                <div className="services-page-discover_item">
                  <img
                    src="/img/e8d07ae38ade.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Get a validated &amp; formed product`s idea
                  </h3>
                  <p className="services-page-discover_item-text">
                    Proving the concept makes sure your idea is viable and gives
                    you a certain roadmap based on a solid research.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/bd336d010fe8.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Attract and amaze potential investors
                  </h3>
                  <p className="services-page-discover_item-text">
                    PoC will demonstrate that your solution covers market
                    demands and will make potential investors believe in your
                    idea based on real feedback.
                  </p>
                </div>
                <div className="services-page-discover_item">
                  <img
                    src="/img/00998cab65dc.webp"
                    loading="lazy"
                    alt=""
                    className="services-page-discover_item-icon" />
                  <h3 className="services-page-discover_item-heading">
                    Ensure the cost effectiveness
                  </h3>
                  <p className="services-page-discover_item-text">
                    Cut unnecessary budget losses, reduce risks on early stages
                    and make well-informed decisions in further direction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
