import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function ExpertiseMobileDevelopment(): JSX.Element {
  return (
<section className="section_services-expertise">
          <div className="w-layout-blockcontainer container-new w-container">
            <div className="services-section_wrapper">
              <div className="services-section_top">
                <div
                  className="services-section_heading-wrapper is-expertise-mob-dev"
                >
                  <h2 className="heading-style-h2-new is-centered">
                    Our capabilities and what we can offer in
                    <em className="is-italic">mobile development</em>
                  </h2>
                </div>
                <p className="section_subheading">
                  From creating visually stunning and functional websites to
                  implementing dynamic features - our developers are experienced
                  to cover your needs.
                </p>
              </div>
              <div className="services-expertise_image-wrapper">
                <img
                  src="/svg/6b06a6717d90.svg"
                  loading="lazy"
                  alt=""
                  className="services-expertise_image" /><img
                  src="/svg/fb4c8bbc0321.svg"
                  loading="lazy"
                  alt=""
                  className="services-expertise_image is-desktop" /><img
                  src="/svg/2964a05b9f2c.svg"
                  loading="lazy"
                  alt=""
                  className="services-expertise_image is-tablet" /><img
                  src="/svg/0347d7a76b7c.svg"
                  loading="lazy"
                  alt=""
                  className="services-expertise_image is-mobile" />
              </div>
            </div>
          </div>
          <img
            src="/img/b4075963f3ea.avif"
            loading="lazy"
            sizes="100vw"
            alt=""
            className="services-section-bg" /><img
            src="/img/6f22a92989ff.avif"
            loading="lazy"
            sizes="100vw"
            alt=""
            className="services-section-bg is-desktop" /><img
            src="/img/4e5116051ad2.avif"
            loading="lazy"
            sizes="100vw"
            alt=""
            className="services-section-bg is-tablet" /><img
            src="/img/ddcfe12e5ad2.avif"
            loading="lazy"
            alt=""
            className="services-section-bg is-mobile" />
        
      <div className="section-separator"></div>
    </section>
  );
}
