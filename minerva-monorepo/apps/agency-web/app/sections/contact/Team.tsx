import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function Team(): JSX.Element {
  return (
    <section className="section_contact-page-team">
      <div className="w-layout-blockcontainer container w-container">
        <div className="contact-page_team-title-wrapper">
          <div className="contact-page_team-title is-desktop">
            <img
              src="/svg/15543836249e.svg"
              loading="lazy"
              alt=""
              className="contact-page_team-title-underline is-image"
            />
            <h2 className="heading-style-h2 is-centered">
              Let`s create
              <span className="is-toxic-green">outstanding</span> digital
              products
            </h2>
            <h2 className="heading-style-h2 is-centered">together!</h2>
            <div
              className="contact-page_team-title-underline is-lottie"
              data-w-id="e5036d09-cc4d-810b-c946-07b43c805e24"
              data-animation-type="lottie"
              data-src="/lottie/outstanding_digital_products_line.json"
              data-loop="0"
              data-direction="1"
              data-autoplay="1"
              data-is-ix2-target="0"
              data-renderer="svg"
              data-default-duration="1.5166666666666666"
              data-duration="0"
            ></div>
          </div>
          <div className="contact-page_team-title is-mob">
            <img
              src="/svg/15543836249e.svg"
              loading="lazy"
              alt=""
              className="contact-page_team-title-underline is-image"
            />
            <h2 className="heading-style-h2 is-centered">
              Let`s create
              <span className="is-toxic-green">outstanding</span> digital
              products together
            </h2>
          </div>
        </div>
      </div>
      <div className="contact-page-team_main">
        <div className="contact-page-team_cards">
          <div className="contact-page-team_card is-hidden-on-mob">
            <img
              src="/img/295a59e3e1b8.webp"
              loading="eager"
              sizes="(max-width: 1761px) 100vw, 1761px"
              alt=""
              className="contact-page-team_card-image"
            />
          </div>
          <div className="contact-page-team_card">
            <img
              src="/img/324904f95e5d.webp"
              loading="eager"
              sizes="(max-width: 1762px) 100vw, 1762px"
              alt=""
              className="contact-page-team_card-image"
            />
          </div>
          <a
            data-w-id="702c04e2-e566-eb2d-780c-fa2fd6abd91e"
            href="mailto:recruiter@abbble.co.za"
            className="contact-page-team_card is-text w-inline-block"
          >
            <div className="contact-page_team-card-content">
              <h3 className="contact-page-team_card-heading">Careers</h3>
              <div className="contact-page-team_card-email-wrapper">
                <div className="contact-page-team_card-email">
                  recruiter@abbble.co.za
                </div>
                <div className="contact-hero_reach-out-info-link-underline"></div>
              </div>
            </div>
            <img
              src="/svg/8590fd63b2a0.svg"
              loading="lazy"
              alt=""
              className="contact-page_team-card-bg"
            />
            <img
              src="/svg/13f2dd630ca0.svg"
              loading="lazy"
              alt=""
              className="contact-page_team-card-bg is-desktop"
            />
            <img
              src="/img/71e3a1d3155a.webp"
              loading="lazy"
              data-w-id="b8034e4e-f31e-2397-79ca-0d90a9e77761"
              sizes="100vw"
              alt=""
              className="contact-page_team-card-bg is-hover"
            />
          </a>
        </div>
      </div>
      <img
        src="/svg/352bac901585.svg"
        loading="lazy"
        alt=""
        className="contact-page_team-bg-1440"
      />
          <div className="section-separator"></div>
    </section>
  );
}
