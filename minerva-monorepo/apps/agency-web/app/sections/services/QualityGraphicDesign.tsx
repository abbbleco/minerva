import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function QualityGraphicDesign(): JSX.Element {
  return (
<section className="section_services-page-quality">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page_quality">
              <div className="services-page_quality-title-wrapper">
                <div className="services-page_quality-title">
                  <h2 className="heading-style-h2 is-centered">
                    We get things done with quality
                  </h2>
                </div>
              </div>
              <div className="services-page_quality-items">
                <div className="services-page_quality-item">
                  <img
                    src="/img/ae882d8ce43a.webp"
                    loading="lazy"
                    alt=""
                    className="services-page_quality-item-image" />
                  <h3 className="services-page_quality-item-text">
                    Flexible collaboration<br />&amp; fixed monthly rate
                  </h3>
                </div>
                <div className="services-page_quality-item">
                  <img
                    src="/img/4bd59aaea7f3.webp"
                    loading="lazy"
                    alt=""
                    className="services-page_quality-item-image" />
                  <h3 className="services-page_quality-item-text">
                    Guaranteed <br />on-time deliverables
                  </h3>
                </div>
                <div className="services-page_quality-item">
                  <img
                    src="/img/dbe9b47e7b76.webp"
                    loading="lazy"
                    alt=""
                    className="services-page_quality-item-image" />
                  <h3 className="services-page_quality-item-text">
                    Hiring system with<br />immediate start
                  </h3>
                </div>
                <div className="services-page_quality-item">
                  <img
                    src="/img/4e092cce1ed8.webp"
                    loading="lazy"
                    alt=""
                    className="services-page_quality-item-image" />
                  <h3 className="services-page_quality-item-text">
                    Work directly with <br />the designer
                  </h3>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
