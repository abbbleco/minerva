import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function IXpSaas(): JSX.Element {
  return (
<section className="section_i-xp">
          <div className="w-layout-blockcontainer container w-container">
            <div className="i-xp_main">
              <div className="i-xp_title-wrapper">
                <div className="i-xp_title">
                  <h2 className="heading-style-h2">
                    You hire expert SaaS Designers with proven experience
                  </h2>
                  <p className="regular-text i-xp-text">
                    Our designers go beyond creating an eye-catching interface.
                    We know the specifics of SaaS product strategies and how to
                    optimize interfaces and create a seamless user experience
                    that adds value at every touchpoint.
                  </p>
                </div>
              </div>
              <div className="i-xp_cards">
                <img
                  src="/img/c53396edcd83.webp"
                  loading="lazy"
                  alt=""
                  sizes="(max-width: 479px) 93vw, (max-width: 767px) 96vw, (max-width: 1439px) 45vw, 38vw"
                  className="i-xp_card-image" /><img
                  src="/img/ea26d8f27367.webp"
                  loading="lazy"
                  alt=""
                  sizes="(max-width: 479px) 93vw, (max-width: 767px) 96vw, (max-width: 1439px) 45vw, 38vw"
                  className="i-xp_card-image" /><img
                  src="/img/b0fb7f8e283b.webp"
                  loading="lazy"
                  alt=""
                  sizes="(max-width: 479px) 93vw, (max-width: 767px) 96vw, (max-width: 1439px) 45vw, 38vw"
                  className="i-xp_card-image" /><img
                  src="/img/205c5719db7e.webp"
                  loading="lazy"
                  alt=""
                  sizes="100vw"
                  className="i-xp_card-image" />
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
