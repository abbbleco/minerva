import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function DevBenefits(): JSX.Element {
  return (
<section className="section_services-benefits">
          <div className="w-layout-blockcontainer container-new w-container">
            <div className="services-section_wrapper">
              <div className="services-section_top">
                <div className="services-section_heading-wrapper is-benefits">
                  <h2 className="heading-style-h2-new is-centered">
                    What will you <em className="is-italic">get</em> from
                    cooperating with us:
                  </h2>
                </div>
                <p className="section_subheading">
                  Our front-end and back-end developers offer long-term and
                  personalized website development solutions with a diverse tech
                  stack, responsive interfaces and safety measures.
                </p>
              </div>
              <div className="services-benefits_cards">
                <div className="services-benefits_card is-first">
                  <div className="services-benefits_card-top">
                    <h3 className="services-benefits_card-heding">
                      Expertise &amp; Experience
                    </h3>
                    <p className="services-benefits_card-text">
                      Our team brings deep industry knowledge and hands-on
                      experience in Web3, DeFi, and decentralized applications.
                    </p>
                  </div>
                  <div className="services-benefits_card-list">
                    <div className="services-benefits_card-list-item">
                      Skilled Developers
                    </div>
                    <div className="services-benefits_card-list-separtor"></div>
                    <div className="services-benefits_card-list-item">
                      Flexible Approach
                    </div>
                    <div className="services-benefits_card-list-separtor"></div>
                    <div className="services-benefits_card-list-item">
                      Performance Optimization
                    </div>
                    <div className="services-benefits_card-list-separtor"></div>
                    <div className="services-benefits_card-list-item">
                      Process Transparency
                    </div>
                  </div>
                </div>
                <div className="services-benefits_card is-second">
                  <div className="services-benefits_card-top">
                    <h3 className="services-benefits_card-heding">
                      Support &amp; Security
                    </h3>
                    <p className="services-benefits_card-text">
                      We prioritize security and support to ensure a seamless
                      user experience. With robust protocols, continuous
                      monitoring, and a dedicated team.
                    </p>
                  </div>
                  <div className="services-benefits_card-list">
                    <div className="services-benefits_card-list-item">
                      Ongoing Support
                    </div>
                    <div className="services-benefits_card-list-separtor"></div>
                    <div className="services-benefits_card-list-item">
                      Comprehensive Security
                    </div>
                    <div className="services-benefits_card-list-separtor"></div>
                    <div className="services-benefits_card-list-item">
                      Integration Services
                    </div>
                    <div className="services-benefits_card-list-separtor"></div>
                    <div className="services-benefits_card-list-item">
                      Scalability &amp; Growth
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <img
            src="/img/d142bcc08222.avif"
            loading="lazy"
            sizes="100vw"
            alt=""
            className="services-section-bg is-benefits" /><img
            src="/img/2b9987a089d7.avif"
            loading="lazy"
            sizes="100vw"
            alt=""
            className="services-section-bg is-desktop" /><img
            src="/img/2e089d5c6e29.avif"
            loading="lazy"
            sizes="100vw"
            alt=""
            className="services-section-bg is-tablet is-benefits" /><img
            src="/img/64a30aaf146b.avif"
            loading="lazy"
            alt=""
            className="services-section-bg is-mobile is-benefits" />
        
      <div className="section-separator"></div>
    </section>
  );
}
