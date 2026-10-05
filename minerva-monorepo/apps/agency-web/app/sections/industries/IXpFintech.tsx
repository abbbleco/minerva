import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function IXpFintech(): JSX.Element {
  return (
<section className="section_i-xp">
          <div className="w-layout-blockcontainer container w-container">
            <div className="i-xp_main">
              <div className="i-xp_title-wrapper">
                <div className="i-xp_title">
                  <h2 className="heading-style-h2">
                    You hire a professional designer with suitable Fintech
                    experience
                  </h2>
                  <p className="regular-text i-xp-text">
                    Our designers go beyond creating an eye-catching interface,
                    it is crucial for them to offer you a relevant and specific
                    expertise that would be a perfect match for your Fintech
                    product.
                  </p>
                </div>
              </div>
              <div className="i-xp_cards">
                <img
                  src="/img/b19ae10cceb4.webp"
                  loading="lazy"
                  alt=""
                  sizes="(max-width: 479px) 93vw, (max-width: 767px) 96vw, (max-width: 1439px) 45vw, 38vw"
                  className="i-xp_card-image" /><img
                  src="/img/adf8edfa2499.webp"
                  loading="lazy"
                  alt=""
                  sizes="(max-width: 479px) 93vw, (max-width: 767px) 96vw, (max-width: 1439px) 45vw, 38vw"
                  className="i-xp_card-image" /><img
                  src="/img/455bf183de7e.webp"
                  loading="lazy"
                  alt=""
                  sizes="(max-width: 479px) 93vw, (max-width: 767px) 96vw, (max-width: 1439px) 45vw, 38vw"
                  className="i-xp_card-image" /><img
                  src="/img/41c5fc682452.webp"
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
