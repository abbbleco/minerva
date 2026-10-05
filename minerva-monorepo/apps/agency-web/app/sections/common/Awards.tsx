import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function Awards(): JSX.Element {
  return (
    <section className="section_services-page-awards">
      <div className="w-layout-blockcontainer container w-container">
        <div className="services-page-awards_main">
          <div className="services-page-awards_title-wrapper">
            <div className="services-page-awards_title">
              <h2 className="heading-style-h2 is-centered">
                While growth of our clients is what matters most, <br />
                it`s nice to get awards
              </h2>
            </div>
          </div>
          <div className="services-page-awards_cards">
            <a
              href="https://clutch.co/profile/abbbleco"
              target="_blank"
              className="w-inline-block"
            >
              <div className="services-page-awards_card is-white">
                <div className="services-page-awards_item-text">
                  30+ Reviews on Clutch
                </div>
                <img
                  src="/svg/ef20b361a0fd.svg"
                  loading="lazy"
                  alt="Clutch 5 Star"
                  className="services-page-awards_item-icon"
                />
              </div>
            </a>
            <div className="services-page-awards_card">
              <img
                src="/svg/adce07752166.svg"
                loading="lazy"
                alt="Clutch Champion"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Champion Company <br />
                by Clutch
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/05ee12ff058f.svg"
                loading="lazy"
                alt="Clutch Global"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Global B2B Company <br />
                by Clutch{" "}
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/7db48e90f3d5.svg"
                loading="lazy"
                alt="Clutch Top 1000 Companies"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Global 100 B2B <br />
                UI/UX Company by Clutch
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/e8087b2b2ae9.svg"
                loading="lazy"
                alt="Upwork Top Rated"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Top Rated Plus Agency <br />
                on Upwork
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/29781d3a00ff.svg"
                loading="lazy"
                alt="Dribbble"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Top 50 Trending team <br />
                on Dribbble
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/715de10ddc97.svg"
                loading="lazy"
                alt="Clutch Top Company"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Top UX Strategy Company <br />
                by Clutch
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/2e1fcba65155.svg"
                loading="lazy"
                alt="Good Firms"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Top User Experience team <br />
                by GoodFirms
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/1f23faf7fa77.svg"
                loading="lazy"
                alt="Behance"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Projects are Featured on <br />
                Behance platform
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/8e4b78e514f0.svg"
                loading="lazy"
                alt="Clutch Top Company"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Top UX Company <br />
                by Clutch
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/e4e80320771b.svg"
                loading="lazy"
                alt="Webflow Partner"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Professional partner <br />
                by Webflow
              </div>
            </div>
            <div className="services-page-awards_card">
              <img
                src="/svg/b9e13ae4cc30.svg"
                loading="lazy"
                alt="Clutch Top Company"
                className="services-page-awards_item-icon is-proportional"
              />
              <div className="services-page-awards_item-text">
                Top Design Company in Ukraine <br />
                by Clutch
              </div>
            </div>
          </div>
        </div>
      </div>
      <img
        src="/svg/a8badf03e8f4.svg"
        loading="lazy"
        alt=""
        className="services-page_awards-bg-1440"
      />
      <div className="section-separator"></div>
    </section>
  );
}
