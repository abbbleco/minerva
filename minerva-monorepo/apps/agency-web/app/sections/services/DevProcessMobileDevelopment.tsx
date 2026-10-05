import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DevProcessMobileDevelopment(): JSX.Element {
  return (
<section className="section_services-process">
          <div className="w-layout-blockcontainer container-new w-container">
            <div className="services-section_wrapper">
              <div className="services-section_top">
                <div
                  className="services-section_heading-wrapper is-process-mob-dev"
                >
                  <h2 className="heading-style-h2-new is-centered">
                    Our mobile development process wraps around your unique
                    <em className="is-italic">business needs</em>
                  </h2>
                </div>
                <p className="section_subheading">
                  Our developers strive to turn design into a fully functional,
                  custom and responsive website for your business.
                </p>
              </div>
              <div className="services-process_image-wrapper">
                <img
                  src="/svg/a5008299f4aa.svg"
                  loading="lazy"
                  alt=""
                  className="services-process_image" /><img
                  src="/svg/84d60b67452a.svg"
                  loading="lazy"
                  alt=""
                  className="services-process_image is-desktop" /><img
                  src="/svg/d0a6f0d88c00.svg"
                  loading="lazy"
                  alt=""
                  className="services-process_image is-tablet" /><img
                  src="/svg/b695f956ea53.svg"
                  loading="lazy"
                  alt=""
                  className="services-process_image is-mobile" />
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
