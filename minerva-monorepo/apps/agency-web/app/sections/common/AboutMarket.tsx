import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function AboutMarket(): JSX.Element {
  return (
    <section className="section_about-p-market">
      <div className="w-layout-blockcontainer container w-container">
        <div className="about-p-market_main">
          <div className="about-p-market_cards home-page">
            <div className="about-p-market_cards-middle home-page">
              <a href="works" className="w-inline-block">
                <div className="about-p-market_card is-tall project-card-home-p">
                  <div className="about-p-market_card-info">
                    <h3 className="about-p-market_card-title is-medium">
                      170+
                    </h3>
                    <p className="about-p-market_card-text is-medium">
                      successful <br />
                      projects
                    </p>
                  </div>
                </div>
              </a>
              <div
                id="w-node-_5b1eb3fd-cf3f-03e7-577a-412bd9758fde-caf1abd9"
                className="about-p-market_card about-card-home-p"
              >
                <div className="about-p-market_card-info div-block">
                  <div className="about-p-market_card-label">About us</div>
                  <h3 className="about-p-market_card-title about-card-home-p">
                    Abbble Co is your perfect
                    <br />
                    choice in terms of:
                  </h3>
                  <div className="services-page-process_bottom-list">
                    <div className="services-page-process_bottom-item">
                      <img
                        src="/svg/da1e9c97957f.svg"
                        loading="lazy"
                        alt=""
                        className="services-page-process_bottom-item-icon"
                      />
                      <h4 className="services-page-process_bottom-item-text about-p-market-list-item">
                        Flexible collaboration &amp; fixed monthly rate
                      </h4>
                    </div>
                    <div className="services-page-process_bottom-item">
                      <img
                        src="/svg/da1e9c97957f.svg"
                        loading="lazy"
                        alt=""
                        className="services-page-process_bottom-item-icon"
                      />
                      <h4 className="services-page-process_bottom-item-text about-p-market-list-item">
                        Guaranteed on-time deliverables
                      </h4>
                    </div>
                    <div className="services-page-process_bottom-item">
                      <img
                        src="/svg/da1e9c97957f.svg"
                        loading="lazy"
                        alt=""
                        className="services-page-process_bottom-item-icon"
                      />
                      <h4 className="services-page-process_bottom-item-text about-p-market-list-item">
                        Hiring system with immediate start
                      </h4>
                    </div>
                  </div>
                </div>
                <a
                  href="about"
                  className="button fill-white arrow-button w-inline-block"
                >
                  <div>Discover more about us</div>
                  <div className="code-embed w-embed">
                    <svg
                      width="21"
                      height="21"
                      className="button-fill-black-arrow"
                      viewBox="0 0 21 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.8335 10.5L18.8335 10.5"
                        stroke="black"
                        strokeWidth="2"
                      ></path>
                      <path
                        d="M10.8335 18.5L18.8335 10.5L10.8335 2.5"
                        stroke="black"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                </a>
              </div>
            </div>
            <div className="about-p-market_cards-bottom home-page">
              <div className="about-p-market_card funding-card-home-p">
                <div className="about-p-market_card-info">
                  <h3 className="about-p-market_card-title is-flex">
                    <span className="about-p-market_card-title-span-l">
                      $1B+
                    </span>{" "}
                    <span className="about-p-market_card-title-span-m">
                      funding raisedby our clients
                    </span>
                  </h3>
                </div>
                <div className="about-p-market_funding-images">
                  <img
                    src="/svg/77573e5f8e86.svg"
                    loading="lazy"
                    alt="MYSO"
                    className="about-p-market_funding-image"
                  />
                  <img
                    src="/svg/bbc786c91b45.svg"
                    loading="lazy"
                    alt="4Paradigm"
                    className="about-p-market_funding-image"
                  />
                  <img
                    src="/svg/3ffc1acfe5fd.svg"
                    loading="lazy"
                    alt="Players Health"
                    className="about-p-market_funding-image"
                  />
                </div>
              </div>
              <a href="about" className="w-inline-block">
                <div className="about-p-market_card team-card-home-p">
                  <img
                    src="img\sbo_maggz.png"
                    loading="lazy"
                    sizes="(max-width: 767px) 100vw, (max-width: 987px) 95vw, 938px"
                    alt=""
                    className="about-p-market_card-image team-image home-page"
                  />
                  <div className="about-p-market_card-info">
                    <h3 className="about-p-market_card-title is-medium">55+</h3>
                    <p className="about-p-market_card-text is-medium">
                      team members
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
      <img
        src="/svg/43f4db8e4e8d.svg"
        loading="lazy"
        alt=""
        className="home-about_bg"
      />
      <div className="section-separator"></div>
    </section>
  );
}
