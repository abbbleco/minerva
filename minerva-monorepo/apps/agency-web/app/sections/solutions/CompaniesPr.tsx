import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function CompaniesPr(): JSX.Element {
  return (
<section className="section_solution-page-companies">
          <div className="w-layout-blockcontainer container w-container">
            <div className="solution-page_companies-title">
              <div className="te_companies-title-wrapper">
                <h2 className="heading-style-h2 is-centered te_companies--heading">
                  Our designers stand as strategic partners for your business
                </h2>
                <p className="regular-text is-centered te_companies-subtitle">
                  Since 2016, we`ve been helping companies to create and design
                  digital products across various niches. With more than $1B
                  raised by our clients, we create products that millions love
                  and use worldwide.
                </p>
              </div>
            </div>
            <div className="solution-page_companies-main">
              <img
                src="/img/c5c58526517f.webp"
                loading="lazy"
                sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 940px"
                alt=""
                className="solution-page_companies-image is-1440" /><img
                src="/img/b52100c3543d.webp"
                loading="lazy"
                sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 940px"
                alt=""
                className="solution-page_companies-image is-1024" /><img
                src="/img/ffcbabbc34e6.webp"
                loading="lazy"
                sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 940px"
                alt=""
                className="solution-page_companies-image is-768" /><img
                src="/img/5547251a95bb.webp"
                loading="lazy"
                alt=""
                className="solution-page_companies-image is-375" />
            </div>
          </div>
          <img
            src="/svg/f6b1cc175b9d.svg"
            loading="lazy"
            alt=""
            className="te_companies-bg is-image" />
        
      <div className="section-separator"></div>
    </section>
  );
}
