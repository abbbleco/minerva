import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function Services(): JSX.Element {
  return (
    <section className="section_services">
      <div className="w-layout-blockcontainer container w-container">
        <div className="services_main">
          <div className="services_title-wrapper">
            <div className="services_title">
              <h2 className="heading-style-h2 is-centered is-large">
                Our Services
              </h2>
              <p className="regular-text is-l is-centered">
                We`ve helped many startups and companies to design high-quality
                digital products, websites, platforms, mobile apps that meet
                business goals and cover user`s needs.
              </p>
            </div>
          </div>
          <div
            data-current="Strategy"
            data-easing="ease-in-out"
            data-duration-in="300"
            data-duration-out="100"
            className="services_tabs w-tabs"
          >
            <div className="services_tabs-nav-links w-tab-menu" role="tablist">
              <a
                data-w-tab="Strategy"
                className="services_tabs-nav-link w-inline-block w-tab-link w--current"
                id="w-tabs-0-data-w-tab-0"
                href="."
                role="tab"
                aria-controls="w-tabs-0-data-w-pane-0"
                aria-selected="true"
              >
                <div className="services_tabs-nav-link-wrapper">
                  <div className="services_tabs-nav-link-text">Strategy</div>
                </div>
                <div className="services_tabs-nav-link-progress">
                  <div className="services_tabs-nav-link-progress-bar"></div>
                </div>
              </a>
              <a
                data-w-tab="Design"
                className="services_tabs-nav-link w-inline-block w-tab-link"
                tabIndex={-1}
                id="w-tabs-0-data-w-tab-1"
                href="."
                role="tab"
                aria-controls="w-tabs-0-data-w-pane-1"
                aria-selected="false"
              >
                <div className="services_tabs-nav-link-wrapper">
                  <div className="services_tabs-nav-link-text">Design</div>
                </div>
                <div className="services_tabs-nav-link-progress">
                  <div className="services_tabs-nav-link-progress-bar"></div>
                </div>
              </a>
              <a
                data-w-tab="Development"
                className="services_tabs-nav-link w-inline-block w-tab-link"
                tabIndex={-1}
                id="w-tabs-0-data-w-tab-2"
                href="."
                role="tab"
                aria-controls="w-tabs-0-data-w-pane-2"
                aria-selected="false"
              >
                <div className="services_tabs-nav-link-wrapper">
                  <div className="services_tabs-nav-link-text">Development</div>
                </div>
                <div className="services_tabs-nav-link-progress">
                  <div className="services_tabs-nav-link-progress-bar"></div>
                </div>
              </a>
            </div>
            <div className="services_tabs-content w-tab-content">
              <div
                data-w-tab="Strategy"
                className="services_tabs-content-tab w-tab-pane w--tab-active"
                id="w-tabs-0-data-w-pane-0"
                role="tabpanel"
                aria-labelledby="w-tabs-0-data-w-tab-0"
              >
                <div className="services_tabs-content-list">
                  <a
                    href="/services/product-discovery"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Product Discovery
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Research &amp; product architecture
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/proof-of-concept"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Proof of Concept
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Validate your idea &amp; viability
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/ux-audit"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        UX Audit
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Evaluate your user experience
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/ui-concept"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        UI Concept
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Define the unique style &amp; visual
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/pitch-deck"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Pitch Deck
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Winning investor presentation
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
              <div
                data-w-tab="Design"
                className="services_tabs-content-tab w-tab-pane"
                id="w-tabs-0-data-w-pane-1"
                role="tabpanel"
                aria-labelledby="w-tabs-0-data-w-tab-1"
              >
                <div className="services_tabs-content-list">
                  <a
                    href="/services/ui-ux-design"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        UI/UX Design
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Web &amp; Mobile App Design
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/web-design"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Website Design
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Custom Websites, Landing page
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/mobile-design"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Mobile Design
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        User-friendly applications
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/brand-identity"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Brand Identity
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Logo, Typography, Color
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/graphic-design"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Graphic Design
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Illustrations, Icons, Social media
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
              <div
                data-w-tab="Development"
                className="services_tabs-content-tab w-tab-pane"
                id="w-tabs-0-data-w-pane-2"
                role="tabpanel"
                aria-labelledby="w-tabs-0-data-w-tab-2"
              >
                <div className="services_tabs-content-list">
                  <a
                    href="/services/web-development"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Web Development
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        Front-End &amp; Back-End Development
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/mobile-development"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Mobile Development
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        HeIOS, Android, Cross-platformading
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="https://case.abbble.co.za/services/devops"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        DevOps
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        QA, Manual testing, Engineering
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/landing-page-design"
                    className="services_tabs-content-link w-inline-block"
                  >
                    <div className="services_tabs-content-link-text-wrap">
                      <h3 className="services_tabs-content-link-title">
                        Landing page
                      </h3>
                      <h4 className="services_tabs-content-link-subtitle">
                        High-converting website
                      </h4>
                    </div>
                    <div className="services_tabs-content-link-icon-wrap">
                      <div className="code-embed w-embed">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 10.5L18 10.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                          <path
                            d="M10 18.5L18 10.5L10 2.5"
                            stroke="#141515"
                            strokeWidth="2"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <img
        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc2OCIgaGVpZ2h0PSIxMjM3IiB2aWV3Qm94PSIwIDAgMTc2OCAxMjM3IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBvcGFjaXR5PSIwLjkiIGZpbHRlcj0idXJsKCNmaWx0ZXIwX2ZfODM4MF8yNTUyNykiPgo8ZWxsaXBzZSBjeD0iODg0IiBjeT0iNjIxLjkxMyIgcng9IjY2MSIgcnk9IjM5MiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzgzODBfMjU1MjcpIi8+CjwvZz4KPGRlZnM+CjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZl84MzgwXzI1NTI3IiB4PSIwLjA2NTc1MDEiIHk9IjYuOTc4ODQiIHdpZHRoPSIxNzY3Ljg3IiBoZWlnaHQ9IjEyMjkuODciIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0ic2hhcGUiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMTExLjQ2NyIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzgzODBfMjU1MjciLz4KPC9maWx0ZXI+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl84MzgwXzI1NTI3IiB4MT0iODg0IiB5MT0iMTQ2Ljg0NCIgeDI9Ijg4NCIgeTI9IjEyMDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzc4MjRFMiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3ODI0RTIiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo="
        loading="lazy"
        alt=""
        className="home-services_bg"
      />
      <div className="section-separator"></div>{" "}
    </section>
  );
}
