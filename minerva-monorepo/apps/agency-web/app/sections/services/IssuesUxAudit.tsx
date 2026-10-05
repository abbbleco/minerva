import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function IssuesUxAudit(): JSX.Element {
  return (
<section className="section_services-page-issues">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-page-issues_main">
              <div className="services-page-issues_title">
                <h2 className="heading-style-h2 is-centered-on-mob">
                  At some point, every product faces these issues
                </h2>
              </div>
              <div className="services-page-issues_card is-v-1">
                <div className="services-page-issues_card-top">
                  <div className="services-page-issues_card-label">issues</div>
                  <div className="services-page-issues_card-number">01</div>
                </div>
                <div className="services-page-issues_card-content">
                  <h3 className="services-page-issues_card-title">
                    Your product is confusing and complex for users
                  </h3>
                  <p className="services-page-issues_card-text">
                    Users have difficulties with navigating your product or
                    understanding its value and functionality.
                  </p>
                </div>
              </div>
              <div className="services-page-issues_card is-v-2">
                <div className="services-page-issues_card-top">
                  <div className="services-page-issues_card-label">issues</div>
                  <div className="services-page-issues_card-number">02</div>
                </div>
                <div className="services-page-issues_card-content">
                  <h3 className="services-page-issues_card-title">
                    You don`t reach your<br />business goals
                  </h3>
                  <p className="services-page-issues_card-text">
                    Attracting new users, but conversion and retention rates are
                    the same or lower, and revenue doesn’t grow.
                  </p>
                </div>
              </div>
              <div className="services-page-issues_card is-v-3">
                <div className="services-page-issues_card-top">
                  <div className="services-page-issues_card-label">issues</div>
                  <div className="services-page-issues_card-number">03</div>
                </div>
                <div className="services-page-issues_card-content">
                  <h3 className="services-page-issues_card-title">
                    You don&apos;t have time for<br />in-depth testing
                  </h3>
                  <p className="services-page-issues_card-text">
                    You want to get insights into real user experience, but
                    learning proven methods and analysis techniques is
                    time-consuming.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <img
            src="/svg/dac157eab8a5.svg"
            loading="lazy"
            alt=""
            className="services-page_issues-bg-1440" />
        
      <div className="section-separator"></div>
    </section>
  );
}
