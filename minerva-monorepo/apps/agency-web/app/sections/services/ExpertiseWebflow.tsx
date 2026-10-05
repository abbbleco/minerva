import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function ExpertiseWebflow(): JSX.Element {
  return (
<section className="section_services-expertise">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-process_main">
              <div className="services-page-process_title-wrapper">
                <div className="services-page-process_title">
                  <h2 className="heading-style-h2 is-centered">
                    Our capabilities and what we can offer in Webflow
                  </h2>
                  <p className="regular-text is-centered">
                    From creating visually stunning and functional websites to
                    implementing dynamic features - our developers are
                    experienced to cover your needs.
                  </p>
                </div>
              </div>
              <div className="services-page-process-image-block">
                <img
                  src="/svg/d317cb935c76.svg"
                  loading="lazy"
                  alt=""
                  className="services-page-process_image is-1440" /><img
                  src="/svg/8e4d0c4c9131.svg"
                  loading="lazy"
                  alt=""
                  className="services-page-process_image is-1024" /><img
                  src="/svg/6bbe13038d69.svg"
                  loading="lazy"
                  alt=""
                  className="services-page-process_image is-768" /><img
                  src="/svg/c89fc013a229.svg"
                  loading="lazy"
                  alt=""
                  className="services-page-process_image is-375" />
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
