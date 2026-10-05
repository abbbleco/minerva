import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function ReviewTe4(): JSX.Element {
  return (
<section className="section_review">
          <div className="w-layout-blockcontainer container w-container">
            <div
              className="review-card_main team-extension-review-main co_abbble-review"
            >
              <div className="review-card_top co_abbble-review">
                <img
                  src="/svg/7729acab9fd1.svg"
                  loading="lazy"
                  alt=""
                  className="solution-page_review-logo" />
                <div className="review-card_middle">
                  <p className="review-card_text">
                    <span className="review-card_text-wrap"
                      >We value people, whether they are our employees or our
                      clients. We put human relationships at the forefront and
                      it`s important for us to hire people that are passionate
                      about their work.</span
                    >
                  </p>
                </div>
              </div>
              <div className="review-card_bottom">
                <img
                  src="/img/2fe4535df52f.webp"
                  loading="lazy"
                  alt="Vladislav Gavriluk"
                  className="review-card_author-image" />
                <div className="review-card_author-name">Vladislav Gavriluk</div>
                <div className="review-card_author-bio">
                  Founder &amp; CEO at Abbble Co
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
