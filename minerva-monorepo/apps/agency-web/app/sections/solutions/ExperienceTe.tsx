import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function ExperienceTe(): JSX.Element {
  return (
<section className="section_te-experience">
          <div className="w-layout-blockcontainer container w-container">
            <div className="te_experience-main">
              <div className="te_experience-title-wrapper">
                <div className="te_experience-heading-wrapper">
                  <h2 className="heading-style-h2 is-centered">
                    We are <span className="is-toxic-green">experienced</span> in
                    solving product design challenges
                  </h2>
                  <div className="te_experoence-heading-line w-embed">
                    <svg
                      width="auto"
                      height="auto"
                      viewBox="0 0 251 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 15C30.7309 10.1401 100.028 0.76345 147.37 2.13565C194.711 3.50785 234.849 7.56727 249 9.42545"
                        stroke="#D0F601"
                        strokeWidth="4"
                        strokeLinecap="round"
                      ></path>
                    </svg>
                  </div>
                </div>
                <p className="regular-text is-centered te_experience-subtitle">
                  Our specialists are ready to integrate into your team, helping
                  you conquer even the most complex product design challenges,
                  and ensuring your project&apos;s success.
                </p>
              </div>
              <div className="te_experience-cards">
                <div className="te_experience-card is-first is-v1">
                  <img
                    src="/img/c1d1266c3e66.png"
                    loading="lazy"
                    alt=""
                    className="te_experience-card-icon" />
                  <h3 className="te_experience-card-heading">
                    Increase the return rate and keep your users engaged with
                    human-centered designs
                  </h3>
                </div>
                <div className="te_experience-card is-v2">
                  <img
                    src="/img/8ea5a55e8a47.png"
                    loading="lazy"
                    alt=""
                    className="te_experience-card-icon" />
                  <h3 className="te_experience-card-heading">
                    Construct design systems to effectively collaborate with
                    cross-functional teams
                  </h3>
                </div>
                <div className="te_experience-card is-v3">
                  <img
                    src="/img/7cd93c3e173b.png"
                    loading="lazy"
                    alt=""
                    className="te_experience-card-icon" />
                  <h3 className="te_experience-card-heading">
                    Create user onboarding that increases loyalty, and turns
                    your users into regular customers
                  </h3>
                </div>
                <div className="te_experience-card is-gradient is-v4">
                  <img
                    src="/img/08775c9774b3.png"
                    loading="lazy"
                    alt=""
                    className="te_experience-card-icon" />
                  <h3 className="te_experience-card-heading">
                    Enhance customer satisfaction through expanding the product
                    line with new features
                  </h3>
                </div>
              </div>
            </div>
          </div>
        
      <div className="section-separator"></div>
    </section>
  );
}
