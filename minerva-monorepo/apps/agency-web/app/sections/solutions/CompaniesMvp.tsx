import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function CompaniesMvp(): JSX.Element {
  return (
<section className="section_solution-page-companies">
          <div className="w-layout-blockcontainer container w-container">
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
            src="/svg/027ae9ddc3b3.svg"
            loading="lazy"
            alt=""
            className="mvp_companies-bg is-image" />
        
      <div className="section-separator"></div>
    </section>
  );
}
