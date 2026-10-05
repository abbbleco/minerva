import type { JSX } from "react";
import Link from "next/link";
// import { LiquidGlassCanvas } from "./LiquidGlassCta";

/* eslint-disable @next/next/no-img-element */

export default function Navbar(): JSX.Element {
  return (
    <nav
      id="navbar"
      data-wf--navbar--variant="base"
      className="navbar"
      style={{
        willChange: "background",
        backgroundColor: "rgba(11, 11, 11, 0)",
      }}
    >
      <div className="w-layout-blockcontainer container is-relative w-container">
        <div className="navbar_main">
          <Link
            href="/"
            aria-current="page"
            className="navbar_logo-wrapper w-inline-block w--current"
          >
            <div className="nabar_logo-white">
              <img src="/img/logo.png" alt="Abbble Co" />
            </div>
          </Link>
          <div className="navbar_links-desktop">
            <a
              data-w-id="1597cced-062b-7e8d-be80-6dd33e03e61e"
              href="/works"
              className="navbar_link-main is-desktop w-inline-block"
            >
              <div className="navbar_link-title-wrapper">
                <div className="navbar_link-titles-content">
                  <div className="navbar_link-title">Works</div>
                  <div className="navbar_link-title is-green">Works</div>
                </div>
              </div>
            </a>
            <div
              data-hover="true"
              data-delay="250"
              data-w-id="1597cced-062b-7e8d-be80-6dd33e03e621"
              className="navbar_link-main is-dekstop w-dropdown"
            >
              <div
                className="navbar_dropdown-toggle w-dropdown-toggle"
                id="w-dropdown-toggle-0"
                aria-controls="w-dropdown-list-0"
                aria-haspopup="menu"
                aria-expanded="false"
                role="button"
                tabIndex={0}
              >
                <div className="navbar_link-title-wrapper">
                  <div
                    className="navbar_link-titles-content"
                    style={{
                      transform:
                        "translate3d(0px, 0%, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <div className="navbar_link-title">Services</div>
                    <div className="navbar_link-title is-green">Services</div>
                  </div>
                </div>
                <div
                  className="navbar_dropdown-toggle-icon-wrapper"
                  style={{
                    transform:
                      "translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div className="navbar_dropdown-toggle-icon w-embed">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6.39284 8.82426C6.17588 9.05858 5.82412 9.05858 5.60716 8.82426L1.16272 4.02426C0.94576 3.78995 0.94576 3.41005 1.16272 3.17574C1.37968 2.94142 1.73143 2.94142 1.94839 3.17574L6 7.55147L10.0516 3.17574C10.2686 2.94142 10.6203 2.94142 10.8373 3.17574C11.0542 3.41005 11.0542 3.78995 10.8373 4.02426L6.39284 8.82426Z"
                        fill="white"
                      ></path>
                    </svg>
                  </div>
                  <div
                    className="navbar_dropdown-toggle-icon is-green w-embed"
                    style={{ opacity: "0" }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6.39284 8.82426C6.17588 9.05858 5.82412 9.05858 5.60716 8.82426L1.16272 4.02426C0.94576 3.78995 0.94576 3.41005 1.16272 3.17574C1.37968 2.94142 1.73143 2.94142 1.94839 3.17574L6 7.55147L10.0516 3.17574C10.2686 2.94142 10.6203 2.94142 10.8373 3.17574C11.0542 3.41005 11.0542 3.78995 10.8373 4.02426L6.39284 8.82426Z"
                        fill="var(--solution--mvp--toxic-green)"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
              <nav
                className="navbar_dropmenu is-deskotp w-dropdown-list"
                style={{ opacity: "0" }}
                id="w-dropdown-list-0"
                aria-labelledby="w-dropdown-toggle-0"
              >
                <div className="navbar_dropmenu-separator"></div>
                <div className="w-layout-blockcontainer container is-relative is-desktop-dropmenu w-container">
                  <div
                    className="navbar_dropmenu-desktop"
                    style={{ width: "1286px", height: "0px" }}
                  >
                    <div className="navbar_dropmenu-desktop-section-wrapper is-services">
                      <div className="navbar_dropmenu-desktop-label is-alt">
                        Services
                      </div>
                      <div className="navbar_dropmenu-desktop-section is-3-col">
                        <div className="navbar_dropmenu-section">
                          <div className="navbar_dropmenu-label">Strategy</div>
                          <a
                            href="/services/product-discovery"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRqwEAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSGICAAABkBXbdthWgmAIgmAGDYOGgc0gZZBAMAOHgctAEAJBDJ4YXM9E55x7lffXr4hg4EhqG8AF3A7ikjekP3fOb/4oTdfbfpRybLfLG8S61xP4tS/TZyy30lEagm2lnZr38Wnzs73bet75RP5kZbo3ox7cFulalwGaK8zbMxwb5nuYlkaAIUPN2IVS6rjcaW7SaKjRoJpTXuuYLBRr1qjfSYt1SUlUrpEldXANMzEEq1OHd9C2mvxUaTUT/alJLXoAwict6tKTHDwd5u5OvAqCuHg2FSJnarGPwQ6mNOGALVK+NSoIKsKQjQ8AuUaaM6EVQEWG3hAgawjzBahWryQztCFYETIZji+gn0DnSt9Jj3AhILJdbrUqzx7Ao+YIM6C3RipeLYp+ziFGZ4wky4mzoIPCQ+DkPJgTgA5kwU3sUpFwHR+ExXipO3rqUiUyE/3ik+1SmRQxzoE+amCwS0Vo1vNoZ54OacbHQW6/EXfRFxNNe3ADvxglQiS81tuIxDIP5ei3PkHRQo+jft/qEKfYBjbfwFuXp5v7nRc4gpeBrw7CObn7QkzOu9ZiGTSTgVH9pmmPXaUb+2m0id2VRNOSqV6zQxftLZEJj5U37c4x2pLHRcea6qbUEC8pWAA5uqFm43IoElXjaJJuY5LV/4vTxghkW6tBubCb1E9qjsftMeWoPEJbT/Q1VUspfUIMBUPORSsbPKOfEppJhLO5T3B4QBV19R3AWHJKUbm6/4ZEWHD9X/8RCkv18ZRTtUGGH2xEIoCe1aAD/dRBbURK8Ddz3UqptRzbOvZPnV9wG/xfnuf0h8AJVlA4ICQCAACQDgCdASpBAEEAPm0ukkYkIqGhL1K8SIANiWIA0EgBLJ+00ynOAedppnfoAeWB+1XwT/tx6Q4RSQCu3CNhHH2hYEJTpynvEcpo7msBj8LN6MF2dar7jvW0M/ZgsXKMdOz89z33u8S74astmprfji+yenNNOdWWMBplKUWMQAD+/zm9X//pQglXMNFzfDI9oZQG7m0MT93YU80xOMsYPZbqY4C+lTND/q2oq0DBzmT1v9NHw+U3ola/19np/noH7F+0H5z4nOZMWhcqB9P/KhpppGgkhIrj07pPJBs72okQWt0LdaMjj4lVsmr+XkvGOjjGHBUcPAoheAGjqv0GMFvfz/P2nPsFJ/9qW4yNFuDePZgAHnuKmhMyIKTaH26hvehJ5QOaC3qY+Myt1PP8vtxLV5yLMzXCdqh9290imMnTBL/+KxT15SgJ7//5WxLv9z+KmboTHMEA7YBmQe6lKWzw0AlX3LmDuvLi7FCcmeTSIw9tMbHzXLQRBWWhWWitOhIgJkGz0TFnBxam7JomiqsYd/dE9RWjIRoG2TD21NQTZzIDf9EEDdgCiVZaAIJliEF2FTO1Lt/lC9SrZQjfSg9+DayRGL/lXRf3+H/NJTOu+OnLrqQsMKhvrP//+L5//ikz//xWcUaw1BSJWv+GU/UEYG1QySWcox8P5MI9ibUUH57/GOqQJ879O8UGceCRcg5lBNzyjnPxRzmLHzkM27O6AAAAAA=="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Product Discovery
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Research &amp; product architecture
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/proof-of-concept"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRpIDAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSNEBAAABkJZte902giAIglAIZrAwSBgkDBIGKwOHQcbAEAbBDGoGz/NDsg7p+V9ETED4/Yz3bfv/uE3v6O7uckzvI1o9T+8h1ekyvTud07vT6/tzSe/ONb07t8O70+P78/D+tpd355qeI50GuIyL58fm2MugdN9UEZROWxoR/1oJdl8GTKv7KLlKm1O3syoqGeaAHZdeV1UyMxFE6eDU5yqoIIKZZipNjy6TlaAUwDItW+yQVoGSikUEoYOXDnfVAopFBBVQWpa2JIrViIgiYvMWm+4WyUBRRBEUaHJqiYJKhkWsxJ6XlpNYCZijKHaeWx6KKNk+qHRbW1ZbyUQUpcvWEM1RMgSRis4NU6Eec8zpM/dAEFBRRQHFrktsOGUqKmKOKFL3L+3G0HrIEPcBEVGsnUP3SQRBBQe+9kvm4A4oBaTq0i+8KaKAOYKIWD8NWNSCkJWxKQ647CiQkSkNSxgYMxVVLKLYeBwRFhVUUJQ+aciE+yA7rXMYu+whiKg0bGlQeoOCWMTmWxh9VhApgM1LGH9HM7Hrmp4g3EHcpWVN4SlnFUUU6tYUnvRqEWxdUnjatAqqVG2X8NTHVazfbjE8+5/5rWY5x/AuXw63eZ5fz1MMP+IAVlA4IJoBAAAQDACdASpBAEEAPmUqkkW/oqIY/AYt+AZEoA0HW7oAPOk00neOP2o9HTMAPoADGLshn96WMg8MjTcth39yObEHkGw2nKgU7bHancic5xquLklyu1ugZf6EMeZL/EhjHl9Xq8qTLLZ4TYAA/v02pn+7H//79bJ98M//3k+jqvK7//R59Y3/E79CKy5kvENr/uTfuv+VVKTbHvyE926ceKXAb2/PbY12bXUuSZbDbv/Q6C9vPFP8DX/xf6gnRNHWzEoM+Y4x6T/5t5m5L7DmIS9wxwk8v2CgsfafyGVYa+LB0esd80+VZui7hVOseFkZpBDC5MhPj+fe/Y29dEHGuaFu38ydBvyaP5/4/1AwU/+BDVFDRoFDePD/0/it8ZA1p2p55xo1Oo1DsYCYABPOenUasK/FUR7nIgy7vRNHIegQVBK74o23H5r+XrcAZ1JY/vzORe9jP+aIX3BvvmKOuC0i0M29ZzCHuMTBIoZ/M7VMnn5dgB9ilpZd+o8mVrDsL2TpYxiZbI+OuWoojCH1Zf9h0Hsrcy8gAAAAAA=="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Proof of Concept
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Validate your idea &amp; viability
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/ux-audit"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRqgCAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSO4AAAABN0AQCLLq6CNMkEZERJgXsiJJsiTnKHjKBCCLgZ4AxOBNQCb+IHZvukZf9xnR/wl4eWP+4/jv0Tv0WQTfjzxOiyLsUJKJbrWd0WrWFB2PK9NqIPHqh2sdlY6mr7mmMlpGllLCxNUDycCYbJWMCd16bFzfQJB7rv9300aUbmkqDWaL0GZkqUIbky49TVB3PG1uu3g0IRW69Th6S2mlsZVpH+gWIeSO873uddoKXXtesTZCRrPWJomrZ6g09+jE5JYQry+ExNWNojprrU5d/HBGGK2X0wujZrgBU9W9qiJH7y+ENL4dfX3tafh39EYKVlA4IJQBAAAwCgCdASpBAEEAPmkskkWkIqGYW7YAQAaEoAzpGhj0T9gALM/gJ8IVyiD1xXzveRF35kxLUE/dx0ckS6b9pDnqIDLwGDI6T+2hS/S1xV20OCxJafSn+Dwau8AA/v71sX//4pJKDRWoUV8N9sFz/qpMUTzAjfEVq7LGZKblp/wAmq0LZLUovGJSLZSek/+flCuhiEbSjyVv+nVjuKlVdRNk77KwyiLrqUs88svklFlPEDiuwkdO77HRdSOPWhCS1p3HXREZ6N37WGAMEVlGKz5o1ymzoPa5A7cBrIxY3/JpG5v8EatfS5Cf5EU/pWy/of01fk7+TfmdY3pq/J38gN9KF/cWriFHzWftOQ9X7mxYt0IcqPb2eHfbXnE2daRUpfxnqNlim1VGmRWWEzG+qZnBb+fynTJq0/zaxwU8EgtOscFRx1DjmJ/4I1jYYI70mAx8tzAFzmgYcD7/lXv+hNNZYFx4Y3n2MG8Vbfd7Rv1U2C5dsv/uJR3h50DQLDBcPx77z/E7+P+f9+u9+ncuaKHIAAAAAA=="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  UX Audit
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Make your product competitive
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/ui-concept"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRogDAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSN8BAAABkJVte942HwRBEIMFghm0DGIGHoOGwcIgZZAxMIQwmBlMDJ7nQP6RnKPtKCImIP7vzOPnO6XhvqhLfpPLNBdFdX6DNN6LKiri2Yav2Rq3lzOl8VFUcRv1cZrh/nITVLY+TpGnubgXBQHr1C0N98VNZAVFsZ6j72WaiyqggqJaIVS3Dmm8F1UqK0FxHWscWg1fs9tYA26yxxIt0/go7sVNUEAVlZXfLabiUQQFXEWpFPXaINsU3I0VVLnBZwuUWkXFGkVf0XBsgzXgOgqC9xZpaSKCKBXWqA4tIj+PWWmlooKrJRqPSxtwHbRCn60ifx9TEQTFGtVrs4hxOYSgAsoKSO4Q6bYLEVFEVFBgib657BBRBAVUUXl0Gm2LO/GjT172oSiugoqa+nx7AJUtRWWOrqkcEFEUrAGd+nzaqgZrLn3uh8SaFVf/RN+5AShiTfXo9DomsoKbHydDFFdRkdTpeWgdRRVljs73FggqVPjVa2izjerQK0obWFEs0f3WAlRAlGe/tByrcfvaLy6lyTpqPkGMLVAB9RWnvCwHlslt+HWOyN97yi3FrIj1cJKIPM1VmacUEfmvmyVOnXOOzUlU9Pe59s8qyvV9flRofp+4qbLEG6dF9ec7RZ4tU/zLBgBWUDggggEAAJAKAJ0BKkEAQQA+bSySRiQioaEws7wAgA2JQA83M+6/VX4LQi0gTPSQ6WanJy1XaEb3mnxv+0MLDYV78BtErzqvBni3wy3PKRHIdnxhNboAVF1OfEj0kWvum/DuAAD+/TZ6H//ocCAPdGIIF/rgLmxTZJ0LjmPM/UCyDK2M2///kPTFabRVPs0cLgesPtPe//rtY1H//hPkBtwk2d91LcsdfizkftPy0eDwAv+Tpr1G9ltuLhCQAVRWrGIHBKH1lDAtGRri1dRFBrmusuBgDX8TKZoB+X5hf/IxuivPgs56WDerGeABC3XmPSw/Nf/x/x/zcfwcb5lPxT0XDH7v6BQTP0wW7nIClpodY3QQ3wYvZAxTBVVarAInebn10/tnp6iEYWabEkQxnuAHCLIP3oDpeJM3/IyY2e///Ig0OT5H0yf1kqma7E8v7hP83/iA+PXj5BJuWx+2K1QdWrqrfrKnqpUPKyHveOcRIVjmdT9uT8Ckwdv/9znl9dQRjQAAAAAA"
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  UI Concept
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Define the unique style &amp; visual
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/pitch-deck"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRoIEAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSP4BAAABoFXbtva2EQRBEARDMIOUQcMgZhAxaBg4DArBEMyggiAGaz7c+333k/r/FhETcPof9fzy9frj/frt9fznOH/7uNv+/H55uvP3u9X3y3P9cnfk92f6zcG3y7OcPx1+e3mO86cH3i9P8buH3i5rlx8fq58e/LH0q3me923hcteQklA70hH38743lFAhokLRAa77fgohIoUMig64r8gYEWSsbLbidWV3UjaLyoE/FiqpIEhRmXbAbUGR1bI7LTgvKGpXNCJkbNdlXykZQ0PGyjxqz+s+IWODQUo0ZHxEQ6GkDAwIZf+S/UWTMi+GdrwsKFUzZBoUGbP3tDKfRKaZVjSprc+1IruTaRKKauN9bd5QRKZFBWHrywGhyTw7szPz2+mAgyPTQravx0RLtEVodrscc2AiyljR5O10TButjWVM+DwddGTGJvbcLo+o0BAVydgg7i+n40IyJtIkm+X+cnrAzkoSmYbEH5fTo8pqBFG8n56iaJJCDfEEZUxJsp1pD1PDPENNiHicGhqoQiVCT0CmkTHbyVOINrLd0HOUNqah8oi3FSWhku0yHvK6NM/YkEzTMafrEYWGsnjM6evH7Xa77ZuXENrooOnlgJggQk+VMWoIqmfazjwlHnG6r5XaIsX1ER9rMq0J4vURl9uaolBpuJ4eevl5X1rN7dvpv2hWUDggXgIAAPANAJ0BKkEAQQA+aSyRRaQioZerV2BABoSxAGS6n3C7Sxtw+eA9Eu8e8+v+x3wq/uD6Sz53UXG6rXq+xjm8FJqUrHaBUSsv+XKrYvxo7Z/t2DlJw5hw7SCF+wrg9nf67fqsYg9bjd58/GRJPjomOzi7S14i2A0kgAD+0k8//7uzrisX8IF5WLTAP4Pb6JZEBM1RL/sBg74HVjB//Ir1e/8QCHjWvO3kov+lCc7qOj18Xanr+kH9Q/4xUIfmj+of8YqBwA2TWaATueb/uJIVpAUdhNBleLz15HH/xu6OlVXTCzj491/42In4/9ne3HRfA5l1SWZuHwXyjVmXau5ZcpKWv4rlxm7zLZulL7QIQEgHrfeuJlWA9toPK2Y2ruarK2IyctNJseeZc9Ydrv0WeyNZmISDvWRUd0Qor230ah8va6VhR+1AnTeesiULzAl1Oof8CSc8w85sZ9bbC5jx6Qf9qtkONXnK1p11bUX/UPR12F5wkPAquaK3p0ajVH/6Wr8abyyOvANPkGG2KU0GsnGBkA8fmRYdlaBdDvC7fLA7nMuZRmHO90D6hhQvmKX+XWTRCaevqqg00uy3HaGa4AM+CMTLm/wxNPqhvOQAItOZv7y8rFKe7hhSXA70ig41Gyxle8PnvBMgJoXM8jkRf/tC30KCfebVx9n/8Mrn4WZRu1tRLB55gq8CKrFL/4leZSl8VwCkI8JEa8uKK6BlJUqra4qARVGj5lXz6l/bocfalG2FZhj5YSOM/I7PMbkHFQj/aY6P2hyAHa1QL4BxjguLuPPf/chQ99aiigAAAA=="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Pitch Deck
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Winning investor presentation
                              </div>
                            </div>
                          </a>
                        </div>
                        <div className="navbar_dropmenu-section">
                          <div className="navbar_dropmenu-label">Design</div>
                          <a
                            href="/services/ui-ux-design"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRkIFAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSGYCAAABgFZrj56oEiphJOBg62BxAA7AQeuAOgAHONiRgANGQh1kzmnzvkmm+/UzIhxIkhIxkDJ4kV3BI1/o/jztz/P9Pl8Ou8khV6VSy2mfEbeKKnUPox+XaulXaisXYomo2obg3tAYSmXDKIN6S42sXKlaFN7XBpK4JboGCFR7OIr9aLI1mjSE99Aw5KxFDBz+KJ6L3bKVIuYS+BNhyLalwYqCQIHocWNqFnIRI5S4FOaeSA/PXMMfKUSbpnFanPmmbARMvphrqfde217fpl+eDgTOTcnDnfF2h1BBUuor+/o0XrAdv0dAHTZ5escLziVYAAICIcUAEnMITOyEeuppU6BDNgWypFXI8IJZfCyOugBTzZVT0bVVlrH37j+FkzQIIYv9oHNvnQAvoR/tzwRMBiouH52h4+LxDzUxoCAW0YcJaXbuWaS51RAHwcWN0ZF6hoWEBKgBNjbtHEg/KNFTVVOFxiJ3ZAf4eqCF4mVTAWDy7kGhnjwQVA14DJvMdmGsD6EJUaBUcA8elugmFGF+TXc33EGRY0jB1V30Z6HhETiLZUO6liCwDISLRpGH6HEu9jypXMqn4zJmHghUXCwHi2WKXGgUp/pgyQMaudDEcCzQAJiQU/BC4/mCYEiXaEwOI5mORANkbqQiEIvSFY9Bb+Zh1QBkSAa5WlKra8M59YXHqPdOxnXUdV/XxDoiNvNjy3I1XkUBcQ+rU28/rPydTsmex1Waam3XwPev9UBqpCXywExPS9wxi+mxhK01ZmE9x4y575roVFqGvHNHMRLy3Yxd/myl3CBmLaLIrZ30+HitLXm1/rvaAVZQOCC2AgAA0BEAnQEqQQBBAD5tLpJGpCKhoSuTnfiADYliANHsYCv7eQdqGZt++fF88D0meoA3jb9yvSAzABT/znh12qsba9zS87oWgGBl360dB6mQUj+mx8JPYVwg7GCzEduBDVn2Nokwh6z/9xvTf0Pf5KoSibfiRbNoNrRRwtyKaxYwcjZIBcl++6hBF9iItBhWoADD7Xc8B8exsAD+9n4P/2R3vI6FVhkePSum7fPYB/ilaqi3hWuqZS6n9I+Yv+367t0oAQTRrRrqPVIzCvD17qQo7WYr6pX8qm0bKM8vGr+AKbZaJKTGSJ8m7UTsAjH9wFpA/vXLuvRIlTr5+P+ny/0vHlZo4RCYqXxr+xDm2fspe4fFreGy/lufacaBNAO+FwCGiaDO79ZlP/1pLaq8OdLZNeNggv3rmaI6tXYBVj6g2ud2yk4zEe0IDx3xriaNQuktEV0ZlpszI7L4l34i8ofG0o2nnVMGunjaijEZ/7Fks9JFSzbv4CG6nDL5+NVUUT9O88/2XqqP4Xn7JTj3CGnrO5lK2/ar78nz/9fnTPDinH+mv8eb+xv1QvyQtmLfSPfWJnYpbyKLXkP7i1xlPnU/BLXdYIGaIAjy9v+jv/0sBbqgDmz4BQqNOJ5834W+trFzH8G1lsTpz2UYmnYyPeCgTCPj4udDXAEmYqh7kOPabX8Y2NX03nhU+P1vK95PjQAsioFq7QhFzy8SRk7NifiwO/0aH/8Ui/+f/9C17bJ8cyMXzg3HL6oC/PP6Xut/xgOjU3U9UgC3NF88Jdvqvze4OoulufcwO2P/5kooYvyrkv6GzFXEPLbK73+JsT6ICa8Yr3+FEn3SgeBO0cUWh9Yi/8Sy+1/8Q6wj+nMrd0w5y0s4b33097P07snorcncjgMsL+Ou0Jh1NrlooajzEvbKqYAAAAAAAA=="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  UI/UX Design
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Web &amp; Mobile App Design
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/web-design"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRqADAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSJUBAAABoFRbe9hICoRAMISGMAxmGMxAGAbdEJpBNZOC0AxiCMXg3YUkV1nLXkXEBDz+OHwe+3/iePeluR5SELw9LxynW0MUJQXl93P1y54JQiLfF0/3N4y53O/FcVMQsm7m3ARlCK3aJ+solXm7IE0icnGbIhhSCO2jyDxjhvaoLPtEsgdFBaHFuEdlGg1kWptczlALvHaoQsgYk4Zzh7Eyj1Jqm5RoyJiL7cGAUMY08dqjzIshSqpzA6QUGbOO1w4pVDQpDeG8LUkkoaisXrdJpKggFBnP23IxFyNqCyIyLWS5TWhFKGTcQSLKWBGhDdKFsYwJ2iBjxiauja+bEBXJ2CBjcd6WSJMsS+Y3VZLINCSiNrgeQZSrF/qKokkKNQQ1yWvlS1OSrDPNpJyLx8eXzDPUhIjK9G31/9c0UIVKhJDKsXp870JDppEx62T58e/j6vHz7eJv63z2/e3yj+fjq799XPj8eTx2PE53nscGx+ne87jvdPf7bf+4/9td/23w911/bXDc9Xi/7efj9uevj1s+fjz+XAQAVlA4IOQBAABwDACdASpBAEEAPmkqkUWkIqGYXO5UQAaEoAzIyp1yrHL17ecA0WbrQAIjl/PYvexHv0XKhvCtxwRslbgxAGX2mViGoXgGDhEjC7ZF2wZvB35Q5LBk2IgWVm1F0fqBij3Mgg2L6IMsFSjhZAAA/v6fYf/bEYV8e4R+7a4FNZQL3J3N4vmIzASR51gkhzlXWK1jf2IB+4v37WPM7uI8QiKW7qG1Kd6Sz21u4GvuHJV4pOkH8OdrBFc5FOtMR+rJ/SmEnk0fCj9uKJ0bqgf9J7V6ZpvEQQfhZRVjjmu+eXwP8j8jPNUlwmXZPJjq4YLhbF3Iag/fAjP59a75P2XZ5Oc4DwSu2dl5ofRfy4R76FloBXhZt6btyIXduuxOLpfkEFDYqzx7dCi0NpsPpRvCx7g+n80hrD3KAucW2GEwhkuvqdIUBmmLqhgzBCtqePpWP8tvhxcAD9bP0CNGKXXJzppwL8zHaIWTOXZRMIQDGUnn7Dp+/L9bAY9XNyhPO5TAfCZK8XjX9Op8DRj/oYv/7lP/9g2//3EVXTXZfaFfnBPusqBDh+7r0UfR+LhN9/+a/UPgr8kDJ9/vBX5IatMBewKJZSSpAXvpW2/qG1ysdKffv+LU3d3cqIldm4NpPWAkwAA5QAAA"
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Website Design
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Custom Websites, Landing page
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/mobile-design"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRrYDAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSMoBAAABoFXb1vW2+SEIgiCYQQTBDGIGKQMJQhk4DAIhEMKgYlAzWPPh+y/+v14fI2IClv8dr69vx7++rb6+THH9aW9BVsPzet716Wg7Vv98Oe27T0xKCX9cTro6XpDNup30eijJ/h4nvR1ajQjR/a8gZPOvIasNj7kakgrCfS5VSCjzZb2G9cmoYTX9BSIqFOExl0IGRfORsbL5fp2rbBaV8df9Og8pKqsNeL/Og/KZz5d5ohGhDb7O0ZCxcvDjZQqDlOiA52WClIEB7fKYIVop6+36uJyHrKbUEW8TZDWFysH3CcYkkXTgeVoRiRTVPqetZ2cOn1YZI/KZp20X+pRfMzRIRB15Py0l7Tj+9bQxY8YOPZcJgqhIR347L2MirbTruZyHShI5+nE9rRyN9ny8LFMUraRQG8/rct5qSpL9H4/LMkHDeoZa+/jx7bJ8+oGGBqpQ/X5ZTt1HViNj8FjmiWgjmzMpbayGuk+UklDJ+mMi2d2Q3CfKkTI+/ioJ4T7RZogV9JgnEmWMGu4nve4Zy96sPk667CpIlNq4nbT82BHZzmp5LmdfnltUQ1AUH9fTlut3rQRtbf68LjNebrfb7cvt8Jfb7Xa7LP9vAlZQOCDGAQAAcAsAnQEqQQBBAD5pLJJFpCKhmFsWVEAGhKANC4+OOqLgXdV7PPlHAKrHwVyQM/coFxqxL2ACcRogU9OQwRdUftysbv5R5lbJ6j/GMYQc5nkC8dmk0uEb0gonGB4R40SVD5DUAAD+/qAj/0It5U69065Yr6kMzfrCfO2PBkDcEbb5GY5T5d/LjJfr+rVl3AbGXGgX4WL87L8GaSI3Qc1TTggqGpP/WFvmXjfcJeLkSs2HsSNnKfqtbdx9PP3oeh1K5zK0BmkPmT1s3Qzu4XssFkyE9228ZoU+fTJh9D3FozsEfxfLArsF4eUcXy++15vOGea6uUKvqkEAie7P6f7+GSw4Vklta6g+LzFzKQJaCY13/+i5ltT/rhf3/bH9bfw1fGl0Qc0Mzl36XElxrc8QhNTXDSL1d0UX+4YK6MQ9nh/cdZ++DD+y9ViYcV/zpVNU+8zPeMqYHvq1n2eD+JRvF3yzhf3NhrrmU48KusnYhnfakePXCBlHa6g8f23bhauLCQr4OzsPD/ix609+su0ABmAE89FsZzq8ITnbBBpYCklGWYzOfwUI085yb7PiLGO59xFWGPscXjP57sNuv/4M0QJ4AAAAAA=="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Mobile Design
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                User-friendly applications
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/brand-identity"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRmgFAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSFgCAAABsJZt29i2mSAEQiCUwcxgYxAxSBkYwsagEDoGgRAGFoOFwXX+eF/Jsrt939+ImIDl/8aX94/t/s8f3w5c/ty22207fNs+3l4PvG5Ovu5cjTmYcXvd25z+Plmb3J/tZbY6/5+XYXNq4jr7+QC/L8vyrXMon7OPR6zLslycG2xP8HZapk/QOnRfUE/hbXBvSPTLHO326zSzPcF6Qns9yRe2Q6Uy7ylOjBx8ghrai1IIPYUTM2boCe7tjuRp2iG0Mz5Bk3k0kGk9GxlqB7fHHQwZY9KwPa5JMo9S6lnm0ZAxB9v56xkQypgmfs6+PWy3GKKkusyW7w9LkTH7uS7763agITpERZPS0Nf35fBlnX95wnX+28ty7vYMy4P9etuvc1nXdX1b169nWOeXY+9fTuyOmlREuH0/cHVmaS/TMiYo151XJ+doE8fGy+yvc4J2krFBxuLv2ccZGTNtkt2S+fYAVJrINCSiHlPujSDK0ccU7RRqCGqS2zmVMe3tZ5pJ2U5Sw/GaEFGZnkQ1tFeoRAipzgoybYLsJwdvJxSK6NC8oUjCdsJu6VioHFF0XkriC1/ZL2Omud1VTWSadVmWy5BMk0TY7ghKmpSdcmcFdSxjDDJ/myC0U4mcomS3Q4iQhOJI0hSRKOtADUEjSkcS5GAZ3yaZp2QeBypBFQrSrD3SLNJt9hMh88j892VZvkFNMEnwOXtvEhRUQ9vLsizLl0KlWZG8z5bPIWQMGq7L+IejkSbZXndet0zGIOK6zK+0g0rJ7XU5+Paxnfjjsuy//vjc7v+4viz/NwJWUDgg6gIAABARAJ0BKkEAQQA+bSqQRaQioZmd3GhABsSxIjuQIP9aNjxm/lF6hmbffnkv7l00HU6bzn+4xawC74lOiDBeMXogTCT57AZGKaXDGMEnD/+7yaYM7cV8jDhpQ9n7S6TM55RIUWyeC6X+DtkVOL5Y5+ieSPa9YF+e71SW0RZ9aSOrSF+WVf4NrF1lV1jczY0Tv4AA/vi57AtjvI4fzc+xgOKaaQMPHJSDyX/3+K3VT0KAN4iv6z84cFNreIXuVJ7Xmf52WwJlHCGmt71sWqFhzUUIqAIYoC48pvsSqpd2OyXTHllcpU6Z633c+ueTQnj79bNKwBHl4eAteAmTznp7Nwuddjj+8IZaLE9fDMBerrTSnPy4bcI1fXZggOeyyZ0Vlv2Ivz/culV6JtkAtdbJ0Ej9h/Nq9Fmdk9mesUFrAJzKP+NHjE/E6u1ajuS97RMwJsy1Ofcuvf71O3AOzlYKbUrqBwwrQS/fOTu5TAWyyr5IwRm6YM0O7s1m6/ipe/f8Uyvz32Ei/4MfHcn4PEAVQ7JPDGD009CpDsRtqTExUf4ndLFRFWt0x9gIgqPfHcClGC66xHXrP1oDOOWOrEkRFsBVNeOf8/7Cmnod9w+hDyl+tQt117rb+4DhlFKe6qqmcRQekAjAut3n7UPK8CEI+fWIghBSCadwmavVKmd+YqjKpDduiMjcWwcVqO2T/ofEN4MqauYCr/zbwV4dbjZiGpAmlE/l39v0qRn0YSP+lPozBPDaSZgupzEs2RKTK11FbVi/+FdVPN90SBdqAE3f4HjiMUySzei7S0n8josx4q7MxXSvOWO5p+5+7Web9orqZVZJ+M0kQln/loEUvWP/dvIN58nSaJta/hOG7u48QGpDu2K23u0gPqYCXjEgG3PTa2VOIcYD1k8Ptxa2jkJrw+Ky/Memixi5OUWSA5G4wmbUSng1+nzXYwD99rux3oZ/pFrBslV7owUnlNC2hOQOOaaZq/2GaAAAAAAA"
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Brand Identity
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Logo, Typography, Color
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/graphic-design"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRkQEAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSIgBAAABkFXbtt02giAIhhAIYhAzuJeJy0BlkDIoBEMQgxqCGaz1cZ/j3L4+I2ICtv+T++N6+36m2yr7afuxxn7Z+7XEZf+5wMPRI95r6Bnu7vgR6vj+8zXhes4+jwkPg2LzHMrGRj1HXnFosfd9GBUErOa+I4wo1tMqCCrriCVqXo60BCoN8woUitW0ABbQyPGwRCusoKIgCJgWwBKbORwqWCJLKFqgIEtUsZ2WASmIhhQoYCUHE1BFBUWjYSeKQrQSVGySItGwCiqag4GdKMYroYKokiIpFZsVYyGW1KpEooK9qOZAYhUVURRMkURRRcFmjoOgQoEqhEJsYxUrKYoFVBRFATWHAVABUVRUJEXBEtuI9RwH2xSgiISpogL2SBhAbIMllmmAaSoFYhURUfKA0ynAQUAduDFNEBWVBiD62bddzEBFKyqKioj6ax845mCJQoEqpcq5jd5fSg/Yi3UEsX4Nbbf8eDXATsTZ59C23Yy+j93DHWNHuI+x7Rnsa5t4+/EO9P62z/hrB1ZQOCCWAgAAsBEAnQEqQQBBAD5tMJNHJCMhoSuTmwCADYliANHwd0/pOjOEOFuCOew9C3kzda7vK/2ze0rmrpz2mEpjtghwp6Pu8nC9jtqiU+sp9WjvJLcDlS8brQgEpo3E0/oK2PvQUwuMIMwespUvrrMXgBi3EXzt9zOBZwOsNw7eH5yyDU4udiSQrYklNjgtUNTcO9eBz2Qpw+AAAP77kdkZP9Rj5dGWBetP7pBHY9bN6lmp4cQNZ+UEURxzAT7fXV79NPPpu3GW/gXWWvJnSYm50RU1yiwRHQOOq6TkAM1uJb9BEOzECaYmiRmk9ksMc97thZCaqvfXLy6gbsQS9O//o5x/lhuMf81nn2F9Z8j6cyWAyzXnL5Rv8e2QpHZZ6dLEf4wi/zKJloHWKbzmHz+5kg4V/pyBGi2ehUYVxZ26LDeqMwvLGTtVUw1MukS8evT1PyaUp0l4BxsyVLg1ji2+wvT/8hdpOwPce6lJqipYijO0LJjV//akAC9ibZSysbiteKur5wre/JZBJ0Ej+zd/+LP00gEvS8V0xAHR5xxwj+zSMSscJZW5brvPMx1sMgjgaddrKG/Ub26Krl+RQIodHo/1bO5mxyaVlcTZBH71IbvGZjOX9dRQ1c9evKaCbhWhBzshyq0nhqvMUHTEatXbifNO7wZuFyfL1VtIyebagCvaxa648c4C2Nz794aDtrSrVj/vkb/QR5nCMMq6r/PrdbItSI6JPcjl+gbi/rt/3rgB2rHFzlqgTuvSqR98p8Wf4h3Mnt/faNnop0od6U6gOMFM05DNBXudIsjKwEmw4h5iz7j6YGH4fSB7MmhcijGH1dArptBD52n086hgSMabn/Tau/WA5P4YKdH9EOcIpvg74RxD/PQAAAA="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Graphic Design
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Illustrations, Icons, Social media
                              </div>
                            </div>
                          </a>
                        </div>
                        <div className="navbar_dropmenu-section">
                          <div className="navbar_dropmenu-label">
                            Development
                          </div>
                          <a
                            href="/services/webflow"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABfASURBVHgB7VtdrF3XUV6z9t7nHl/fxM6P7dRxk7RNESWQRkKhRAkKlBaaF1rgAd5iBH0vDzz0KSkvfWsLEkhICKVIQBVafkRRUkJogpDaQKBVEWnSJq4bx3aIHf/m/p2911rM982svc81iUHw0Cu1x7n3nv239ppZM998M7MSwg8+398fwa/XS7k2b+dP6cE9+nOtnip+sQTBb/3ocRQpAd/4lF7DV5zj7aL/it3vz9u9UmR6WcFN/G1/C2+3x8vSpIo9GkrU44x3464ovJazfo36bKjvKssy4TzeYOP4PITHUjjpUv6mjfFTOvfLLa4P2/mhrT7f8+XT2/+8mcq22GQyJcr2nZMRyRJi1pNFJ5D1nwqQMdUcJeo8M8bPMUZ9kd4jMeGNjR4KLhYKZOcxUR0K40UoIhYMVBp9UKJe0Ntb/E2Z16I/K7HJPDbh9J4mhZBCW5pM4ZtB39/kJvD+HBuM2eB70rHL2iyvHl6b/Xqf0q/o/X/YmoLKe752Lj33T69tn4AAql79naEyfXuhcJiIqjG5YBBGFVT4F8cppdxIU7KUxJXOuNGfhWJUaL2k1/GXNgUFcrIBwvN+nXgZdIHtKp5vcsu/KnSCEhKexTArbUqLXhWAZ9usEuuzBcpKpZnlfmurzNpZXuhxowM2eVOHvy7lYT3/9t3X3XjjvHlgVEBO5ZrL/XARuhZYkBqZmIlHrn1Dk8V6qy1iuKTWE1V+2rdQLGlwSuXPuJYyHpQ20D6wrpGWWkSHNiXoXY0+nfVraQRzV/FkUFV1qvVe39lAxU3iMmS9RzCo6ji0mKKEVh9rcyeLvJBO/xVVgl4NcejjrFPFD73OSo1CdbZoV9Ns2ApqC3F9ETb3dVjhEKiABN/IsAS1LK6uKkvMxOhzhU4rsE6BUgrtnsaDLxEeFlX2Qv0Vd8CSE6wZFgXzL5BZpQ9QHX5hNXFdoNCmgT3pW6M5akOFwPHgJXq/WraKorqGLQ2Rwuo8Fs2AcXURhii55XU8L4PKhfGHlSCzrSK9Dq/Xkq6Jmr++fpZGBRQaAWEoElZUzEzfE7w+Q2johysO3Zt56CFWEq8PyayBmJYJYPBVtxQ6AK5nipeAaBnmT/OKhnZuAdQeDnTdsBwYMOGOTn29DA2dEv/BcnJLDFX7koLX5EFBoeWj+pYQVdiYIXnMbenVILvU06IbLNCkgKGup8qvozSO09mwGJPAymUYLScGSwg4Bzs0B6fLq5fqiuJ2ak1/EZioT35pFPASnDonBUpAdXGVwWTwNrqCDqvYACuBfxO7cxMNYukJmGTsLBCZqRauPK0IFtEJj7eC9MCGTv9COlXGrFN86JMkINFoATrVATMAYNMFMoMOYFrMNxq4BtdGssUlrATklGhRSFdcsVMYOBEsEsFRTROGRCOBxKkYljQILAa4GN4MBW9sollSxQYJatqFuANzQjRwQRNWUlSb0gNW9HxrcU4W24O0ii+wBvr3Vl+6eWteqkpIYQ6LmSwA9k9wL4xxXHGGthIUggzF4eCqAfhwhJI4FzFpWkzaVk/vcqHpyxmSRqwPNKf/CYRhHBUxfx+oQ0CkDqXeDTzAVBwbYmzNPrN6AJAJQUB11yC+0STE8UPXXq0mDqqINtjzag1tq9aQZpnhY2FL2afq1VUBKlgyvqBgTguI7vK8M2B+DA9GWFLQgWERju3J+AwANEXabDRU13+wFxiG8SXBxEI018HQEjtoMcIr6FrgAaY4ApD5SFGzblp9ljaJcAeFCIdShQ56HaAZez1uGBaNjqmbYMVhCfzbgEcoMKjGcl6OAuR3xHKh8I4BOpPojA7rrm6eGyM8dAxil1BTgY4CEyIVwrViUAmIS9FAEPeR+OEJxAIjkVwt1amQDxSzjAS9DLCG4IpQk1eXyOpKYAlt2yTFLnU7v6fpFBt6M0s9zrCkXu9oWgWdQUPlzMGxBESBHJplEIRCsQyqI3o0nNjinnt1tLnGcmBPs3ZoT7vH/F7IuEgWiYhxVMhGLtvfvrA4S8XYUPHeQ3uOrLYwHug5k9lB0Q3dLJTHT20+B2vA5FXZitpN+sDB7t2rszij8qKxTdxvNDfzXCQBivn89sq5L53cOqbaDK2udBLDi4WauHIGWoGubuyBZssuoMGzJIuHTr0xN/EEAFE/WAKgev25Iyt33L7W3GLobq5rXN6/82ssxy8NL714YfEVkCI8enhPu/fnb97zQTocmCbZYq7Rh+v2zUvDqeOX+otCfl3CO1bDvp85vPqLmLVbouco8AXYZR0r89yXXtl8RB0S3iCGwbrKwDdEigXcSGRguFSo8NBnCsiWLwQSQVUoBnVrbCwYFoY+QHdmpuHpkAssvF/MKCImBu0B02H3cFl5z77uMD3DQCfU4CFGuwkhim5ANo14kXzpgSNr94Tqb7xXRo9kehTCOI2LQz7+xOmt74KPRgdFWBL4AyJFWQGPpM0Ywvvkoy28iauTbsi7gE58G+KPRIMzI0rABaN6liryx4QX83oXxrggIAle0tx9YOW9luDRyBinuZhUqIWvG+dxvxJgzZSkufuG2duPrDV3uOLFlSeucbqIOZ5de/TY+t8qQOl6KefR6AU4b7sWaRgsoukXSXMycPPU9FyDMrnAkIoljCImZCjEJcAuBSdxpdi5CmpzqZaJyFlsEHMFCpTIeIPcef3s4DzGa7hy49JX16lWwAF18TXCqT3d97b5+yAcrtnfYOnXmB9P1nB6I3/jpUv9ZQ2TfJbK0ZA5KIhaOFUNqGkkRhARYMCQw85cYDALiMaLBNy9McNgdCDzdaktvZbllN9PcSGzJdMEdViSCnOgu9NX0gRm9KwFhIwwSKlumDf71FlP/9TB1Vuu78KR0dqXPrW2MLmShC+e3PqKhiC6GnhDRgwhSmZyCtqzqiwpmQL/Xh6CLsBEPZmJB3oATN9XHrGHpg9ehLjrbuNuIDLNi1pySkBlquJ/dH9304F5c2jyV5Jkuo2riW6D8TK4oD5z36HuXlY8/B7iC3GO/u5eRKsIJ94Ynjt2cXhDB9Hlz40SKV1r/TZMrgC7Shhb83W1BETHxvlstYDARM7QLFu8tlSQITEbJoCkF1edLBdhzAKqLkjNjRnquQ/dvOcnvOpTVVUs2za14bvlGKGstGH+wcPzH543WpUizYqlvkvCiLk7Po+d2voqsYbECdlf0rgIvooCiOMTQIVpvErUwxU0ClihxxWAmkpC2QG2GBmCaMEsWZWarLEiUutQwU0Mky9Lwrk10HN+4db5Hatd3OtObGy3ONK4NfA1xh7Disj8zhu7HymOPMGvUxGmKPOJbBHg5cvDNzVsrhfgBh1KUUddgKyDVuVCVyJFDGkkceglBYAIocpVzB5Z+3PhcVvjwZ5IB2uYzD+OFUKv40m1hmtaWXvX2uxWTyiXvK7ihiuE+ZSN8+593e3zGPbauBVLzOaL2/8yADx+YuNZcBxyDbA7JAVCSmblmmgMI0Wj4ZqwBYSEgdF8iQgN4POEDeqRK2+Z30hcrZ5j9Q8rjPjKj6u55BY4d3De3BiWpluM41ayJGXkEJNLqOlfU8aCLCOQ4YAFDxbfLLUK8vJ6fv7EZtkQ1ketOBmZaqopI5fm6pOWsqxAjTYgfcJCxwL57+gCxnRqQaRWbm31hdTHqX8I37ownLm0rZm2V4tMCHofcWV/F+e6kkfeChtG8A9TyAxGoflKgl+uvCKWag0AaR5jJL3l8ZObX8uZFSyvLBUvzSlmRdYYgF5OaVBoRVzOsIasSUTMy2FwSPghCYcvsbpq9b9gq8/cVd1GOeKzry1eVwnOmIAMl6S1ePE7rm3Wfvm2+Y+XqXAeZILLkThUT6kYQpQ3yUZrWMaG0d2Khczjb/QvvrKR1sEZDKKYt+k6aM0hg8ZQPCQbwENBAg8ZEMqEnkUcWCqIWFLmfC8a6bGQlr12nw0fxGr5lQBZQZAI/rM3r9z6vgPd7TMk6tX2i7FCF7+EHdawk05Xv5bRcrJM58NEAPSex17Z/jpKo8UWgAVZOjtqDdkDOfxfdaIFBhU8M8NEwQEL2WvRNPnwVMAiZatrGe0q5rIYw9oIbrkmvtWMmTWszkJ7700rN911Q3fLWhvnxayqwl4xx53CWFXETuyouOlX3W08npQRJD1cHlsfXnp1K20aG0DRNRqnSKwj+TGhkFXkaKQelWhWfuAUCpbSxyUQZOfDqv70KcuCTQBYFwYza8jlA0fmhw/uafYeWIlr189lzfy4sloPiaMQHv5G6cNyGOTZRS6LWZRu1E2l05JHM6lZH4b7u5c3/wMEx/o0HuasFeRvIl7Epo3JsSGz5kAFsjijUJDFGz5mnwu2O8h9gAMRAcQ4dGaVMxjzhXLiu65tD/zQvu5t182bayxFyJXVhRohHFBr3F66NlFp/Pzr2e0XVPjZqJxQWaSPESbQgHc8f7H/1qntshlR9dTwR6YHjhNYY1TGp50GlHxJi7M2lhj1GnbSGM5ZaGp6EKG0TIQKl8xorvcD2N+RClTGlmusL1P2I6MFVEAzndrCWQV9ipMydRafPLX59R+7fnak5kPVbaZIIR4hAmsN60Pe+MdXt18k6zN3ZHEDGa5adqI1oE5mEJCRiaMvwblHtOhSqWU4rOvgSh/L4oYBFgZLGAv25vckQR4d2GWUK+hwCW/GC2osdxrM673Wrf7q5e1n4R6H5s0NYQr81MGUXE2KgFW+cL4/cXojLXSinRVfghXQQxgpIlN30FniPf1vgDuobgRFZrWZFBm6hmYYmrDTAsz0YqUsnLbBPNCFVaLiJM6Qd+LIZg2Ge1b1yxNLrIRHx391czj3F8c2v3Fmu2z81nvX7l9mkbY6V3wsFglW/6tnFyd1oh2CmU+EjbbaexQSHrCFRiFdBU1iixiRAop1qJDXZWsuL0IuOywgkTCxABlYPGZdkG1dDwViaTJ7o5DL82MRF7T49yI1ZleX6LUO+cx/bh178tT2cUh0302zt682cbVc4RZVGewguVXgJS9c6E+duVx0mNiKcwOxCkImiTBYIa+GwFoxHBQdkvW2uVaoqSfafhMZGfvB3jnyANYorWEBSfKO2gA5AK1BKrj7dEu1AKntrbAsijLHS/3pvz+5fezMRtosqM7p2D95aHa7Mb0pGtSwF5bAElp/Y8ibT5/sX9GDGWtZ6NS6BVjGTFPPwQgt4jlYH8QH11FFaGA0M45s4OkQg+LIDiI0EHVRLRzQo8CpWMmxC8VSuDc5IxuWtdAfbS28esyZLRSWvnM5n33yla3vnNnMoM2JrETneu+h7sjeNqzW2mvZafJT1cU/z7zaH1/fLiB089EvrCBQ2JBQgmvzZJzrcYyat17VNQZDUvECkQCEN7Hvhy5rWgLBns0wUIVKhKKRw0Lq5KHWawTj6pgSSvZ+iQp/ej1d1BT14tMnt05uZFkYgJKKRtZ59fc9h2bvrOyw7JR1PLDoEcN6n7eeObU4p8u3YjGpAi9M1brmXHmyXq2FxNIW5HYRfThsPMgo9qlHxB55gJbT0SknMC52FESsGqZKSMFLm3RzRhnLLU3kylpZPZSyUDM7u5k2vn0pnfv31/tz+n2rRpHIirzjiD92z8Hu5r1d3DPVuWq5zWP+GDGso/zM6eGU6m+F2VLgaCB11jInKtM9kUggvR/0OvC8h+kD8VTvPRa2jShuS6/XsP0AmbNWhZYsYCDpynVKvgpBvF5lCg6WK6o/vjrv+tdOXlpsvr4tm6F28Y28m5NZ3usWY8wYxPT8omw/cWLrBRZ7QtX1aPQMRSyJZ+xsifFfTm9f0KGgALSE4GyoMk9EwwAQU0XzSYVDazhoM7BokywurDTPHn5vAVVtMKEQIC0KwaMCsrWXPR0xNkT2G1wc77ygNfb8hcVGzQmMj1u2aiFbrLRiyjOjt1YZx37+3HDJByWLQaIthiaeirOr0EJglLCVjq7o8C3gDsLzh63FIh512afGouo5NX01daxyCmj+oR6qVoDwjU1CzULdAG6C3EgVkJdaYwXEr+zwRy9Au8eRGDiYkk7naHU/C1sWrgge0beNeRPHgTTUtLCMIT8XqSSeqSpXuZDOCjbBgPCEgv4WmlptYC8I3T1Wbawwm10BAcROBUowc+1/KfgV+jvafYDpuICzQCH6cq2JBvWNOIXBxKy+bnczK5g80x3Ywp3lN14xcSaQHRBp7uyBmwYbQ8DKq1iUCdYwDt5BhvtGK2GyeC0QXJsXAVy/4/aeUDrbFaTmn7AdAm5A9jxZQODWjB78P2Bjkvo8F4yBMgt7XNGNUYxnLAYrLHo2yGJSqc2m2gqMngRE5iJcV2bdti+jXmLpzfb1OY8a9eMkAplbtK1HhUmLESsj5lYjYFKjxy2pbomdjqcNUXyHUnCdSmiZ4Hp7PVh3hQrAdTBtzJHJT7TePvvSVv5h3Qu53aBowW1CYQyD2LBkNTAZ8WXCg/o3OAM1k6B6LOnhThH240QmQK/oVqxbHUrdW0VfoG2iVoEUjfFaqxmhbcD2ctEkUSC89rxDB+EUHLELrvU6VQ0tbEBZ0YBKqoyMhIVnsiczDD3RtuTpg4vlKJBz9jqokSzr3i1ZQ9j5nUoxvGfGNO0iK2VSn6cNzFmk9hiCYwofTtgZaL2IhtEKFgATFvbzWl0sTXwCrcBqAHqtsNkarQvFNzUcKpdYlgCMfplZ2ABqJAPozGo52mIL9ixHC2AvgMFgNPcrPtUK6h6Hur61IV7MI7JVkL2FYOXjMAFgCHXXgRc+qvBYKzQ3EOawFQQCg9S0dAEohtGA7S9wIO7UpBXkCoJMXKx+bTBLPhK4YwfPIlJwX1CGulJqJxC0PU8m2JsJ735arxX5bxyOQYMtNe+qG6z69kowQNsrZ4DpeUAIVXgWNGDepeWcILxOuozCByokECtY2DDibW6ajBhxwA7COEJgtZM1/bRvgJzBtv+AZqBaNGHAkHMlV6NAy5bg9rzjvFXJCPB0m/Fe65GSQGWvclYLKKw6e3xlXKcvR+4hsJ46zBK+DnM3xUARQkWwygMYC95/r3lT8b105uxUdms1JLY8Oq48dvGyUhy5BXKxYGnfo0Auj82acNSVWss5ztZsR6z5QTE2MKbx1QzK8ncrp4jDifXEGTyiTCk/Ophkd5Fbo7HDrUN/H6FPUO4mg1VBom2g07GwVY/KCmNFmXFQrJCdG9ZDVSbbcoCmd5jpW9H87iziEjZyR2pcXh4VsNL2jy7S7KZ5Ux6QaYaW23NRzNO5LuHNPtPZYs/6WQmuU+9eG4A0ntiI7fhDV99CYAo6N0X8iK1cfBucBjv+GnA6K9DbyNl2LZozsc8lNTnPLO9yHG7unpGoIs9DnyCGSzqXf2vD5T/aOfPv4ef3/qD8pfK4D6OmPwyAdPI6NG25W55F3GTn4byZf9kO0ftZMuPOT8BPGqyIzGOct3tZBlI1/NoX/kw+u/zuGHbBRwV9msIn69piy2Bm0CKHCSZI4YZOOzbhUzKGmrMVpLJtLgvYB5lG4fk/WDyl1vP+K4XHZ1dYAD6f/nS5TRHrIV3Bo1zhcfJYTdvNSsGSCZx4PFqKWYVZSj2GAs6nYfilz3+ue+qt3rtrFFA/n/ykKqKEh3UFH4QwZDLsXU7K8FVFjWN0Fb+mK29/XQGf+PyfysNXe9+ucIHlz8c/Lse1+P0wd8MXsc0bbu4u+OQaZgWlWotbBJXDaynv/5/et+sUgI+WdG5jd7uadvKEooKdA5t/F1OI/SRXDvc+Jnnw6NFy1XftSgUoXN9lQpRgSljyeQe3ERwV9amMvIQFEybsO3sh/PTVXrUrFaCT/zAFNsEmYEsyAV91A0SBVCNDCJPVWBhUPHnwau9qwy78qAD3M/ab2dPPeUwBxcy8mn/lBaV8WU9f0Hvv0nz/VpBW+38A8nev9q5dqQAFrz9WgREFzquMn1X//+vf/1156qMfLXdpQe4fVODrqhLQ9lJhj//5n8T31+c/9JFym7LD+zVi7n/ii/F3rvauXRcG6+djH1MhQrjwmc/IheXzR3+jPKRW8fDo81xlOfrom5Cc/81n1yrgrT6K6vsV944lWAEjQTn+hc/Fd4b/42d3RoGrfB55BH4uv8m4b/+XzSfC9+PnI79absNP+H9+/gvraLU1SMDYigAAAABJRU5ErkJggg=="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Webflow Development
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Site builder solutions
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/landing-page-design"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRogEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSFACAAANoCrbtmrb6X3pR5qfCqNM1I1iRvtQhz7gyTA5Bhcbmbi4KGZmZtKni7PvrXfODsmImAD+KS+4+MJ9O/586+0nvpzHjvt2fvX1139tP/PM48/f/8cM9j7y6ecxUjt285Ev127PXR9/vRgsRHDvQ0f+WLc73/8aw7ABe2++f82u+epdgEZg6tG3X1qvq95yyYUkybj4hbXafsobLmQ6AS57fq1OeXdkU4YL2fvXH+tEC9k0YwS71mthm4EshMFWN67ZuaIPfi6qKFrggm7ZO/H5M59xYoM5Xs/kgY3Dnx1iMqcSMlsSMiEEQkggIeHgec8dnJrMZFmQ6QRkUmIECkhy7utMSyIYQkoICJC5lIbJtGzdBBFE0iAQEhMMSBIScmtIQgI0YgAGWJogGAINgNwaCA2ABpKIgQJCsuVETqIsmzFYlpJAJDGnRE5+A8mQUBCSBCQRCE+eAGIpm0ojIGRSVp4WICQ0EBq0lKw4gQZAMAAhIcmQVQtghkgCKRiCLOcqoAEgy0JKiJC5JKuVyRgsGxqQJhm4mmUBwxAESUEQJFdG0gBIEyBMoAG2OhtBI1NCo8GmuToEEjORlJIUsDUAERpMCg3SkLUWCCEFwZihpISQzkAgNGhArh0p0EghWX/ZskCu2bSNpRCbRZIgs5UGzQkE+TvMnFVis5LZ59zkf+DfeXFjXq9y+MTBOT0Mn13EKo9fNfXN+99+8937J+E3lj9bxXfnLz32LLP9czv58svM94NT8JvHmPE327dzP7P+a9tjzPuO3cz8g5fn9m8YVlA4IBICAADwDQCdASpAAEEAPm0skUYkIqGhMBTcAIANiWIA0jFBW35h/nuUbEu9zt6vMfjrW8cfuQEJKqZtI/clG0PbLWyAEkd3ReN9U9bu+3BjNO+YG3LcK6QvT27gRr/OqIGkeZHV6O8q59tkCfe0xFm47fBWcxNnQxxJtgAA/v9WUz/8ElAirGI/eThoZr8ALU8lSnZ1y4++kwUQjtxsYIt6//eX22QN2HQMhhv986jG7uFDQJ+gV7zxfPf6m+9Td8t2b8DpUDI5qrf9t31U1AoWg56Lv+nXy0mVhew3uAutlf0PtyCO5Rlz5nWpujmcrwLe1Xn5UVfjNjlf9CUVhbit3hP3rMqTbjF93HJ5797YpasFqjQEU0QfrAZYamlk8zv09xTgqwW5mCQngvMdHM40sMGevm5BFh8mvJqjZyOa/bxeQZvE6NRvfon1sRVIL2e9TjFCcw7lfzvmIoT/On3KOm5Ophn1dK8oTu59uwXgdr19YDJq3webPByTLv5hgsa+bpM9mkMvDj+wh5xsJMe4QJJVVH77Qc+RyYV4ayf+xiB9qLe0M0sNwht8EvTDLf/WC1GfSzxZwGbcbrMPu5uXgpdKJvi0s05lQe5lujMRnl3Z9H8/8eWSf5Px6KuJzuxpcDByKDfHZ1xC5fQmlDy/+aGHjhXRzOJDw394t+6UN5eH/rQwVeUUEGmuAtlkJYAAAAAAAA=="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Landing page
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                High-converting website
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/web-development"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRtgEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSEYCAAABmV2I6H/0kGrb1rIte38X8P9kd08kBs0lOWR3J/sF8HMFmklElwTVu17AL50zxvfss9/vfR60RUwAxABs2zaQtSCSAtRxBMIfsY3ZYb01xk2Z9tkbTzRaHXXMmAEIBAA/THioAba5ZbgiIvnguwO+q40LLiIYoPIVUJi232d1ccgVNASkOApA07aqupzjBZJYzRvQw22mVcRZu5EwREC5UrhtQj3MtpM7AxogvWnaOvWm04IoFbVDpADa761qWO4nU5vI3DRwx00WG+w2rge2ACDZAekYRMaMxwRTHngH4JD7oGXb4xE4CAoCgbkg0HAsSBoAgpBBhRh1Q7y2ESzkXCS55q2MCOMpQJHmPH6xiBEXSOQmcyJRmRwuSoLscnPQ3HIUgrooBovHrNdMpnQghSWTNgikc0dd+wPKcjxA/aRdiqNCGtojUB66CMnNA+Q1gDIdqeBhzVEgSc25NlsPs5+RQDaOQqAOS8MhGxl96NApvwRAuXYuSxI+OoxKlZqc2ijZQS9Q4kHv1FQ3WX89NprYrTdpCcZKDxCQ4cxs+KAvAiMPTiepyQ41XkE/kLmpIx3SDyJQ70KpZ5XBfpAQvuqNojaQkZsXKqbKAGRc+uNA5jlrNZ9AupNYqgDPkisbiKDiQBKhATansNU35J00aDSCk9rdPlV6SWox5ROChi1QubMl03hN9qrQbBk0EFp9FJoHUgqgdkc5thH9q/zupcSWIPO/tG3C/2D7ojlz2SuzNMSkywDeWWuDhnhkUgl44K9eCwBWUDggbAIAAJANAJ0BKkAAQQA+bTKUR6QjIiEptVpIgA2JYgDObDAE8AQ9YHE24HPG+jDeOt5FBTFhBnLYwm0xHfwmduvzzqzp1WrhLl+pZsF2vZFs4Yewt2aR3b2LtMsskt2ucHTZ44It0jcdE0MwJIZ+xulRsJ0enQKLGAD+/xpXf/cN2Ac86GMVvt5fHQJX+Spw06s0TKS6dvnUp47CqN8PvEx/DebEnbkTHHnE5D+4U790/+O3M7JWQK4vqCLxbWJfxTuZDmDRZN/NL/5MiHxC9ht/5tQ/h3Hupxv8sb2EFfV1D/oXgJ9Sobm0mX/oO1397jPM/xQ0JdNI8lhoSRQ1PW+8fEoTd2NIVqE93L+ZdMov9Lt8y0AWsIgIfcf/H55fvuUEn7Fnt9LQMqPzATK+VyUBLaFx5TUJGkY7LizUToOg+HkTjQKsd1LOdxdgMqW4gy+Q5jutOxEdaZm0SJAt8qfDBXSYAHsX6qh2Z24olcwRgWpNCQgEYtfE6O8r2m2F6Pr7d93v+aUJx7Zqw5Vi3R0qgKInE9kLo6KEJF16qTwMM2NuNS/Wu7YtKrikiGTUggDlepH7o+uxJIB9TTtfcVW748RedyQg/mOQw+36ezvyd5jtZmRdGY83lkCpwFMP5QOETRAtrrEC2rSC82etnfbWhhpELo1bBNctanAd8QNejRIr8sctgXVpvYBkp/xMQ9xkucZ/3Lee5+qzULif8nspaSH5Ou0A9IV+u/wgyj4ItvxSsb/tgSZEBMESX9K5tTdGs48vaPfcFk2h8hRXE3mNSB3W96n8WiNbBQJ0+Bxsi4oQ3b2Sf6vDAAAAAAAA"
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Web Development
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Front-End &amp; Back-End Development
                              </div>
                            </div>
                          </a>
                          <a
                            href="/services/mobile-development"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRigDAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSJgBAAANoJpt2/Ovua6XBbA4HKqzACuwQcd2sAzQLS5RWQMX1UaIaqpH8rvE7/sdR773TZMRMQH893x55ew+n32+1zv2vvXz451ubYVAbiSQSfLo/U5njxJJTsppmVQEaWQYJjaYN5MYCCIIycRiYoKcNCAnAURMkoSEhJxm05QGIBgNps0jTAQSEMlZBMhGIJiQIPMGAxsJMQCSmWUzAdmUcB4SECDzKI2JhUBITDAg5zk2wNIEQeYWAwWEZEUpCURygVAQkmRBOSmNVgiEhAauIAQDEJKmI5EEUrDpBBBSQmw2GhwbGisahiBIzocAaQK0ADQyJXQNMBNJW0EabMqqAiHkIpuSsmoiEK4ihLK2LC65Fsj62VJpLiUNWglk/Zaz1dZvOVvtf++PN3b7bq/HD8/v9Mvtvb69efGV5JYiwkCQwYsv2f+rCzUObsSxZprxExMmZkBSCIEh6Qwnk2M70CglYCZLjo1PAwLsjxl+4FwIyEHIRgcPgn3/5wy8eSoHAYxGfjpDHPDgB6b8+MWD6yRAGhhpffWBvxBWUDggagEAAFALAJ0BKkAAQQA+bS6SRaQioZgKbgBABsSgCD9V3zL9q7cBvPXoAfoB1swQ4ZV2sGDK3qtmxo7MosQFhVWxfkcNPf7ELlzK1x7JSWlVsbLZlm1a9wQM1owtqZZYIdPfMy7UAAD+/Tct/6n8dE/0j3+0lmwQ2IMP8UoyTwpo5f+LtXsly4TW6VDDgT+838pxelfvtMzp2///JS2yTC1k2vFH3/AACcAwK5mp9sq3dmKKIvX9OPdi9IL2vTuoSAmY3BInGz9XAraWbPmhZD2qjfSWUIxnFjoyLHUE3BlM8Q/gYXg3/PdpVwPeFR/w7EA7kg+r6FLL8kE6C6xdXpWtE/rQXJhByJipNnRRbSoLnR6T8bBH31UNCEJXfpG5gLaGMTUSvusAw4rdbBlWHJiGdUlA0JNwJQOTrpIv6sO4hmMfWWYt85TP1lkwJj6jSd3O/+tEX53EKJP/miL87gKlkjQI6P+7syq4AAAA"
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Mobile Development
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                IOS, Android, Cross-platform
                              </div>
                            </div>
                          </a>
                          <a
                            href="https://case.abbble.co.za/services/devops"
                            className="navbar_dropmenu-link is-hidden w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,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"
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  DevOps
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                QA, Manual testing, Engineering
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="navbar_dropmenu-desktop-section-wrapper is-solutions">
                      <div className="navbar_dropmenu-desktop-label">
                        Solutions
                      </div>
                      <div className="navbar_dropmenu-desktop-section is-3-col">
                        <a
                          href="/solutions/mvp"
                          className="navbar_dropmenu-link alt-hover w-inline-block"
                          tabIndex={0}
                        >
                          <img
                            src="data:image/webp;base64,UklGRk4FAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSAgDAAAN8Ltt2/Hbtm2d11tat21Fdh+KmNmZx4jtcPT2DwyPkTq17ZHZtm3jDkoptZfyK8cYcURMgP8L3+eD3/c1z3vssV/6+a/70Qfxnp/52J/8xV//A29/5ye/6vGvu7zPe+Ov/zYZ57zmXfvsv7+sp3/VT/9802S66pM+86N//6K+8Cd+kyx2/lfn6tVf/Cl/f0Ef99s/ZZkbW05v/4jHL+eF7//dNGJN41x91s//6MV87DevoZGbcvWuxy/lqW/7sZabJ4s5H/gLf38hr/2VNfnf2DHXsz716y/kZb/f/x7b1ZaJyXjnL17IS/4wk2UaMdlr/vhCnvgvsmVnLZY1eeS3fc3b7u4e3+c7f/6jfv+Wb7GwbphYrJumR1imkbd95qfc8mosWdDEyoRgLVhNC6/+/VssmZp2tCWrMWJp0bAsjxy0FSFjZw4a2moRTe40y63ZkSWNQiz3mkfcWXNcz5aRLK27GVoT2pE1mSKWhaw72DHacWOQtnJrdobJHUZbTdduXm2IxY7YsbtgzpZgsbAD4yAWy1rvXpMdWAhakyysaKK9eyxM2lpzINdjZRLLXYYEYceCOa43NaymO2ANuR47hKaJyIrsThKDZQXLDqwWTMsdLzvXIqydnbGzVqZmx11HFiarnR0srSUrW3Y31xd2kB2R2HFj7FjtzoJGZFmWMLEi97mQW1eWm7MysXvIzQvNakzC1NjZ3d24lrXcGqaws5p7TnakHbJrcqmLFYvJziIL7dxbVthZrQWLYFn3RIyzs2hHslg7duy+EJJoWbJaRLu3yYK1aMIOJvcfy1oEsSPszGVGOzBBltVaF3E9aw6j1coO/3sxdmCFaO2gXQyLXF9YrLnYxGIcj9hu+fm33RdWCFPY8ftu/ZQvevX9hbWItfj5L7vt5z/q9+/q4z7o6lydc3V1ztVXf5OZG2fmEv/8WSwWn/adf+Hy//IZq+Gv/uBfftlD/OPnmb7xD/7KQ/27J+MHPOQ/f5bf+KsH9cfP+6ef9aD/7Nk/4mH/zC966P/54P6fDFZQOCAgAgAAMA0AnQEqQABAAD5tJpFFpCIhmPx2SEAGxLMAYIf5IS/ZOYfDH+ZcWwwH6k+r1pqG8mfbd7VRM3of6wBSuxwA4UOw1dPQ5OsVQDngRw4C/GQw77NyWx3dYUmd2YTy4dSuAdOGDIX1jgi/Obq3efxd9YYAAP7/VlM//J6uvj2182+MSZRUwE7PkvjmNMity9uGltYqB+9JrYOG/5u6p83/86WE6z4QG+M1X55zqvu/ONh7KrikgW2NOGu4/ThuL9+Jnjq02ck1+/EyjaqTAvus1Bi9+72Qv1DVnU3VNhSu3S0UarSFQdjlOuKQ1hvb2RSY1/t+NDYidX5CPWjJCbUtN4LdpaQQ7OVcVftFwtsRhZKP+AD2RhlHaRPNfJv47RUaoyhPhSh+El41nOXxoe6UhqV8v2q5scjuNz7Mc7bOyUUbYUnwCLnVvst6YgLcy3EstUXFpN8onNBGqAX6tFUxADqkRVu4lB9fz9QKqYGwf95Emvl7NbRo70+koamPL2BU6t9QigjETzt6PKur/0WVGhhZTPXOBaE3r9Vf0kY/yDuI2SxZvb9QNec2uCU57TvELk3j0P4+1P/8Ex0M6ZiJpPfETyEaykK1MQk4LzkUarV5p00gmdyGEKmXJJF9P/d0yAWW3ojTeTZ7ItDVNYVt+OBslPf75c8lO1fXeP0Ec4Zh/214pjtUTi+VKuy1EFViLcw0EahGcKeFmGaVswAAAA=="
                            loading="eager"
                            alt=""
                            className="navbar_dropmenu-icon"
                          />
                          <div className="navbar_dropwmenu-link-text">
                            <div className="navbar_link-title-wrapper">
                              <div className="navbar_link-title is-black is-m-caps">
                                MVP Design
                              </div>
                              <div className="navbar_link-title-icon w-embed">
                                <svg
                                  width="16"
                                  height="17"
                                  viewBox="0 0 16 17"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M1.59961 8.49991L14.3996 8.49991"
                                    stroke="#141515"
                                    strokeWidth="1.6"
                                  ></path>
                                  <path
                                    d="M8 14.8999L14.4 8.49991L8 2.09991"
                                    stroke="#141515"
                                    strokeWidth="1.6"
                                  ></path>
                                </svg>
                              </div>
                            </div>
                            <div className="navbar_dropmenu-link-subtext">
                              For startups
                            </div>
                            <div className="navbar_dropmenu-link-text">
                              Create a digital product, attract investors and
                              new clients
                            </div>
                          </div>
                        </a>
                        <a
                          href="/solutions/product-redesign"
                          className="navbar_dropmenu-link alt-hover w-inline-block"
                          tabIndex={0}
                        >
                          <img
                            src="data:image/webp;base64,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"
                            loading="eager"
                            alt=""
                            className="navbar_dropmenu-icon"
                          />
                          <div className="navbar_dropwmenu-link-text">
                            <div className="navbar_link-title-wrapper">
                              <div className="navbar_link-title is-black is-m-caps">
                                Product Redesign
                              </div>
                              <div className="navbar_link-title-icon w-embed">
                                <svg
                                  width="16"
                                  height="17"
                                  viewBox="0 0 16 17"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M1.59961 8.49991L14.3996 8.49991"
                                    stroke="#141515"
                                    strokeWidth="1.6"
                                  ></path>
                                  <path
                                    d="M8 14.8999L14.4 8.49991L8 2.09991"
                                    stroke="#141515"
                                    strokeWidth="1.6"
                                  ></path>
                                </svg>
                              </div>
                            </div>
                            <div className="navbar_dropmenu-link-subtext">
                              For startups &amp; existing companies
                            </div>
                            <div className="navbar_dropmenu-link-text">
                              Get a fresh look, improved user experience, or
                              enhanced functionality
                            </div>
                          </div>
                        </a>
                        <a
                          href="/solutions/team-extension"
                          className="navbar_dropmenu-link alt-hover w-inline-block"
                          tabIndex={0}
                        >
                          <img
                            src="data:image/webp;base64,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"
                            loading="eager"
                            alt=""
                            className="navbar_dropmenu-icon"
                          />
                          <div className="navbar_dropwmenu-link-text">
                            <div className="navbar_link-title-wrapper">
                              <div className="navbar_link-title is-black is-m-caps">
                                Team Extension
                              </div>
                              <div className="navbar_link-title-icon w-embed">
                                <svg
                                  width="16"
                                  height="17"
                                  viewBox="0 0 16 17"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M1.59961 8.49991L14.3996 8.49991"
                                    stroke="#141515"
                                    strokeWidth="1.6"
                                  ></path>
                                  <path
                                    d="M8 14.8999L14.4 8.49991L8 2.09991"
                                    stroke="#141515"
                                    strokeWidth="1.6"
                                  ></path>
                                </svg>
                              </div>
                            </div>
                            <div className="navbar_dropmenu-link-subtext">
                              For existing companies
                            </div>
                            <div className="navbar_dropmenu-link-text">
                              Expand your team with our dedicated and talented
                              design experts
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
            <div
              data-hover="true"
              data-delay="250"
              data-w-id="1597cced-062b-7e8d-be80-6dd33e03e6da"
              className="navbar_link-main is-dekstop w-dropdown"
            >
              <div
                className="navbar_dropdown-toggle w-dropdown-toggle"
                id="w-dropdown-toggle-1"
                aria-controls="w-dropdown-list-1"
                aria-haspopup="menu"
                aria-expanded="false"
                role="button"
                tabIndex={0}
              >
                <div className="navbar_link-title-wrapper">
                  <div className="navbar_link-titles-content">
                    <div className="navbar_link-title">Industries</div>
                    <div className="navbar_link-title is-green">Industries</div>
                  </div>
                </div>
                <div className="navbar_dropdown-toggle-icon-wrapper">
                  <div className="navbar_dropdown-toggle-icon w-embed">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6.39284 8.82426C6.17588 9.05858 5.82412 9.05858 5.60716 8.82426L1.16272 4.02426C0.94576 3.78995 0.94576 3.41005 1.16272 3.17574C1.37968 2.94142 1.73143 2.94142 1.94839 3.17574L6 7.55147L10.0516 3.17574C10.2686 2.94142 10.6203 2.94142 10.8373 3.17574C11.0542 3.41005 11.0542 3.78995 10.8373 4.02426L6.39284 8.82426Z"
                        fill="white"
                      ></path>
                    </svg>
                  </div>
                  <div className="navbar_dropdown-toggle-icon is-green w-embed">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6.39284 8.82426C6.17588 9.05858 5.82412 9.05858 5.60716 8.82426L1.16272 4.02426C0.94576 3.78995 0.94576 3.41005 1.16272 3.17574C1.37968 2.94142 1.73143 2.94142 1.94839 3.17574L6 7.55147L10.0516 3.17574C10.2686 2.94142 10.6203 2.94142 10.8373 3.17574C11.0542 3.41005 11.0542 3.78995 10.8373 4.02426L6.39284 8.82426Z"
                        fill="var(--solution--mvp--toxic-green)"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
              <nav
                className="navbar_dropmenu is-deskotp is-not-full-width w-dropdown-list"
                style={{ opacity: "0" }}
                id="w-dropdown-list-1"
                aria-labelledby="w-dropdown-toggle-1"
              >
                <div className="navbar_dropmenu-separator"></div>
                <div className="w-layout-blockcontainer container is-relative is-flex w-container">
                  <div
                    className="navbar_dropmenu-desktop"
                    style={{ height: "0px" }}
                  >
                    <div className="navbar_dropmenu-desktop-section-wrapper is-regular">
                      <div className="navbar_dropmenu-desktop-section is-2-col">
                        <div className="navbar_dropmenu-section">
                          <div className="navbar_dropmenu-label">
                            Industries
                          </div>
                          <a
                            href="/industries/web3"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRrwEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSDcCAAAB8Jdt29822rYJgiEIwjAYM5hhkDDoMEgZtAwSBoVgCGUwgmAG2/rHeVpS3Jnrx38RMQHL/7cv37fb+gtd3u7wvj7Xl63tZXLdzO9vz/QteFuW326IyPbyNKv59ZtpCG7rk2yzPM403tdnePW4Iakgtr8+b932jEgo4/byWe/2mNcwj/f1U1b7a5imSfi2fsK2K6JCEUS2l9NetUchgyLz2K7n/Hl3NGPlYQ94O2VzNA+LCkJwPWF1PEVlGg3E6wk/T0DZnaHOeXVmNCJkjFMum04gY2UepU54c5KUaMgYjq2okxgQytixH5SzyrwYopcDr0ipQ0gpMmY8svnUQkWTktd9bzQUnSCSUFQOrGRvZxQVhDrw8ajQCdPsjHb9RmZOz7SQcddPCEl0Qo8IdWAjnx1lrDjyBXoQnTSWMe1bfnrGJk667kmpdlUkY4McWD5SE4S0Q5rkYenA5W5njiYyDYkcWL5qR2jPPIIoHFo2n5pCDUEdupbohCSPM00vR5Yf5h2SoSZE1B+H1vuu2kMVKhFiPbS8zZC9kTGPk/tfy/HLJhTqQB431G1dzrySx4Um01AZbr8vJ9/sTJlX8rjuX5bT17tqIrsbEny/LJ/4BiXtaSjT27p86mUjBj1SQmy/L599RcnumLh/XZ7wVqFdiPp+WZ5xtfN+/XhEt+vypG+E+Los649Zf/+xPO1lg9iW8XXD/etleeI/B7xMluX19n1dnvs2eV9+3csHPi6/0LJcrpflv2oAVlA4IF4CAABQDwCdASpAAEEAPmEmkEWkP6GZnK99+AYEsQBjjoMx5R09uhdru8gYCh9gH6AHe/3umXYchJV1jdtaI0stbC1c7PG9JByLrjDXgFNWfWqI3L0k1qcD8EEDGaF2GNqj7n7KqepByh9hHcZVegSY3KHRP4aWNJRf/biXnbb/7Hoe2r6OgAD+IhH/1CLECI4f1Owv4W9GMB4fCTIzMmqSVJyPJVyf3t6Bd/3/8KBN05vB3+e5t2zx9Nd8seWKlgJk1z+70AvP9Ffy3ic37n1s9ah4DFjaW0H+fE0613EhQUhTfpbFIWH0v+qGHpvUF5sXgMm6wQthbVhpcpxsAuAfqtOED3pHIUZoh507kg/pr2A6VWidpeMyeE9fksb2zwDVr6h5IOaADkNXoflgFANrZYwwZfa2sP77xePKxuA7SeFbW2BM1tT0HPG1xmpgxLe6TOLhW6GxJY134/4Wxv0EBKhqdNCGSTFywQ3lbTN/5xwUxecw9TZvRJM0GnrSEsNlOd2XJ8mzMu2aOBZlL0LSrSJos5wKAmpIPPsRUP5YT8cmwLaWZGuq3WhaODLPFgjPrPHAUJXOga4pEwHbswNvGUsG5waE7kod3GtrtBOfl7H8yiU25gTwNWpaRYX3GUsfVFAlPRjioNh3aW/w+eQRctlx5dfW/aVDXxgX94B+CrpfnLA/xtCHbakkRfwQnvhnllSX4Zonf+dVBpMZpqxfslomFKo4uIRYP+w6sL0hdDIDUiAJagt8RQM9f/ycJ2kp1kutKmvzCe83nZQZjoBCX+sy7fFwz/cWKzUcPduAAAA="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Web 3, Blockchain
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Crypto, DeFi, DEX, CEX, NFT
                              </div>
                            </div>
                          </a>
                          <a
                            href="/industries/saas"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRrQDAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSPgBAAABoJVt29i2EYRAEIRAMIOOQcqgZZAyaBkkDFoEEwRDEIOFwXMf/L9lOTvrUURMwPI37vrt947r9m39f1w2R68vn2/d3HtdP9nlw/0f/3yqF+e+fKJnZ18+zbqf9rE+bP36623btqvzt8esrx8+4eUB62ZMQ522nfcKGSuPfDpp3aTcLKqTvp6z7oIUlWnn/Dpl3R0shzvjzxlPu9vRiJAzr2f8RGjIWJl3337X0/qKBoOUaMiJ26HL6/ZhXlIGBoSapFl/Dlw2dxZNyrwYoqTyeuPpN0rVDJmmFBlzO7rM1t3BSWSaQkV3hH2ZrrtpkcNJIglFdeBtsu6ONxSRSFFBKIJ9nbw73pBpDuZgRPFjGS9OrYwRmRZyM9sy3e5quF3oFqEQ+zpZnd4gEWWsiLAu0+8npaQDYxkT9LZOtpPGjBmbOIbX4XpKCKIiGRtkLN6WZXFyxkSa5GbJzZ/noZJEpiERNXFZPs47HkGU4/8u+2lFkxRqCGqS9PR+mpQktzPNpKgv38+bZ6gJEZV5Xp4eRRUqEUIq9G3ZHhIZczs5GF+W58fldkORZOx5WX494naoHFGkfVmW5fqQSm6XMdPkZVj3R6AhmSaJYF+m6/VR5c4K6mOdLcuPhwihG5XIf8/LwfX9UYiQhNrW5fjT1/dt/8zb62X56xhWUDgglgEAAJAMAJ0BKkEAQQA+bS6URaQiohZrNiBABsSgZwDW0Hc/8TG0N2+PPt6YBz6Psh+SAEQ3698UWg3iTPShlb04AzG+jTaQFp+4fjGcniYwMq80czfEGMuaK023nS8VhUPzwH4gWfLhYlchJqBC+KAA/vz4Q5f3lo8zVrTV/yZjvHTNRak4W/+lSDPyF3xuJLjfqgkZS4TUNLdzE9e+q7XxLpqfAqbg4+gsz9jt/orLVaAv+NzvFw8nkWYXgrjHlGsR2eN1ZCP///HHxc8yrCVbabRA5x9JdoJxjAV29ZxU6IgsU34AYCEwS50RR0GjRtKMdw74zoi3ATjfqa6az3jFQm3sPE6Av8h1Xhn+GZOaYoNKSch2WntT93ljyFFkYkNSepqAokiITqCn2WBPgrZs1NjPE9F87yRvNpmN49zXu38ZVKjjxpfnBgRmAE8U1TiBf9mmNGNJWdMvbWKr2zog2zx//R2n//9ZQUDn3hKUP2aOCe1Gh4huhugYOpD9j/8D+BOkehy0sohFa/8kArjq7IvvAAAAAAA="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  SaaS
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                CRM, HR, AI, ERP, Automation tools
                              </div>
                            </div>
                          </a>
                          <a
                            href="/industries/ai"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRlgEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSAkCAAABkFXbtt02giAIgmAIYhAzsBjUDBwGMQObQSAIQhj0MqgYrPVxjq6u5L6/ImICuv9Y+2+fRb8e51c5L66W8SVuVt9e4ObG6+FGty7D0com54ONNuyPdW8xHWtucX+5x8sAyf1QU1HIFEJ5O84wmyIoYP7oDzIuVoLVZTjExUqUqKJiOR3goopKwAiYL6fdhkUlGEQQJaBl2KkvooIIBg0qKs47PV0HJQFzULzuMihkKqYIgmJc+j2eaoJiiqACSvB9h8HNiIgiooIufbtnQgBFEUVQQBW9tisVmGIlVs7NTtYCRhTFFFRc+lZT1TqorCkqp1b3LQQRRcEI6KXVZxWCSEUEI+9tzp9LVcSIkcSsPM7bxuJmVFFAESNBtAwbbm7GiCiS4CqoXqpuNgVERDFFRczPFYP7o6iirC392twGlARBhYCV95XBxggi4jrWL312bZVjgERR1hyzZzOCAqiAKNZes7mZimLEdWres+duuE5g20dApU2KCpigKPiWjSo2B8R1MGI6ZP0PlQBbMBIQU0REmbvVqyk2JYAbAfWy1s0CRrYJoqKyAoj3rnIomglb0ERFURHRuaseHiKpn0udikL4XlSifnRbL7OKzmM3lC2Kce676QvRZR67hv04Tee+i1OpQQjl3MVhnKax73YfplIT50t3+PE+L0F/zLexe9FhHMdT3/3lBgBWUDggKAIAADAPAJ0BKkAAQQA+bTCURqQjIiErNJsQgA2JZADFC9qQz8RhH28o3W3V54rTQN5Jv00OZoYKgOeLSy4HcwkwSX4Gatdb8cXp8PTvNpoMmMsnbUSYO5gU/czcNf2Nv0y6yT8qBWUF7Mc8o636TdwUYJD7jsa7VMuzNzH1g2fLJ2CGeUAA/v5HgMT3nVg+Ah0IeQub25m2Q/FMMBj/wWJn5LNnfhzXPL6FZww93G1C/ThZ7Z4NzlfZUkb/zFK3K43/9pv/dIS7gCF12PP0zjz539wftfjApur9+vb0EhJb2pwtIYuhgE1YIzud8rM/t6/NyfSf1uEbh1RVABZAbo+kiocPnX/bLeGxaGru/rLzhcp1noZzcCNH9JuRuAA2YPodK32URtJS8uWbUjALrCAPBI3u1fcrCpkjWEN2Z+Dg6b7fTEodCyOOpVb5G/Cy9d/aUnE7PYlHR3z12wNBfQL0ohj+ip+f0bBPsLXOOJ5T9jnrww7JGXtXx7qHVx4hhNY/KT+pUxclmJe9uRkGx0O7XXwAougdpdkK2m4nkVPGnD1pD2g3qKsuOLT9dMIMH6p39f/H5Kp//DgUdpJUvWzPVnmCpYSbCwf/qDzWDtNc/bcwaMph2nsGy2cDIp6unhbczMDbPSn/biIwMgvYfUqhvXDWlvBuUr1Fm0AO7mds0G4zFdkgJueG0aKu3/fzva7/1+OlHq09rIDul8rWQ04uMx/dL5uKsrAAAA=="
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  AI &amp; ML
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Analysing tools, Chatbots, Crypto
                              </div>
                            </div>
                          </a>
                        </div>
                        <div
                          id="w-node-_1597cced-062b-7e8d-be80-6dd33e03e703-3e03e616"
                          className="navbar_dropmenu-section"
                        >
                          <a
                            href="/industries/fintech"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRlgDAABXRUJQVlA4WAoAAAAQAAAAQQAAQAAAQUxQSHIBAAABoFTbtmy3+RA+BEEQA4uJzSBhoM/AYWAzCYQwkCCYwZqNc1/hp9StiJiA23+Y9+eXK9/PuH918dcTvrv8r4eeXf/H/ciXD+D5T+Dl/0z3p/UvH+erj7z4YlmiRYi0SBvRGd8JQmbDkBKNzE7JolEoKYOBUGZatbEs+4sWZV2slFQOKFUrZJlSZDaW0b7tRWSZQkWLaAR7GkV2J4kkFFmP9uxuFJFIUUEQWR4qNLLMzuyPOsfOyozI3sY8JYnGdjmYzSyPHG5I+9QidFI0UtKqVZkJGp9O2J+Z2cK+2f1YSoUgCsnezOLb7RhCMhNjtlWy/P3plGxX0o518uPxeLw+Ho+X2/qIUE5sRHm/HT00R9EihRpxhTJTkmxn+fbz1Fhn1ILI+wXUaFCFSoS3K5BlZGY7vV9DtJHtRpfRxs4sryQ5+zrolHShQlTtwYXWJYQ23i4UYoEIXUpm1AiqPw69/IztrFPyeuj29Nu3i3++/d8RVlA4IMABAADwCgCdASpCAEEAPmUqkEWkIqGYW7eoQAZEoIcAGGT4x4C/aqFzT95MwDLxfExLhuxOpQt5pHsXvcInMYNOJMYg9uz51R2GkTHCTswMTf67FWDR7nymT/rxc0H3n9IbbAAA/v7Na+Y2OKcltmLUBc2PJ1m6ejp8Ob037//JOtU7O9RXzOoljqrIgWkHRqHfsYOw+LVLV8IiWfco8slxrMmd/vKqhvRDu2Sa3clLgrWamMByELMorDOqhqUb16mPv8KXwuzn4xviCu52pLdm+LMXnOkzrq4qoD347FdN+mzGlpVxsOGTMx7asSSKX1FZXqmhsBtui85LtuusA5egH2tjXl1UPWyx6uFzMQ4XmZbAQKNk0Zu7Z9GS8flOOMIS6QS9nusrrveIuKTh7/BFnW7ippQW4IREWk81mCsFue3WeTkogLkW92rJFwR6ssva3isNIT1ve5AuKBDbb8BI2a+rHT9OmSsgmMDGIC6o4TH5A75WHch2QiTWxp2DP+JbKwICimUEt54qcFJBltfTWVmVEauTQ257+XXaLf32KGkNtQek/GX///IAdzXuw8C7Oys5cDXO7+G7dq4UYjoAAAAA"
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Fintech
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Banking, Digital Payments, Exchanges
                              </div>
                            </div>
                          </a>
                          <a
                            href="/industries/healthcare"
                            className="navbar_dropmenu-link w-inline-block"
                            tabIndex={0}
                          >
                            <img
                              src="data:image/webp;base64,UklGRmAEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSCYCAAABoJZte942EwRDEIRCMIQwSBhsDGIGDYOEQSEEQiCIwczgun48j2XZ7+fPiJiA8n/5dHt+mrb34zL9Fea33c96tvp297Oe6rI6sM0nujv4epq7w68nmT3w6xS1HdGmM7w8dDlB9dh1Ou51kMtx7ai27+t2u11qx+zhta8+VtPPdeP3cbee6duIou2SvAIc8eiozV70Ht5BUGDMc6s2QQRU0fZYHqsKmDLkvTE1g7gX7OaAlyoodKFEFRUHPrOqgiBGVAJGwBwFQSDcsx9VVIwEgwiiBIzYyZxUEwKoIIJBg4oKRiRxSm4B7AclAXPQgIIIPyV9J4IAmYopgqC4F6/ZGrYTFFMEFVAyJGAr6eQmKHYjIoqICgGzS1a3cgIoiiiCAqqooOij7AKVgCl2YieK8ikDHIiimEKStzpARNmBypaigvqppXPdGoooCkZA0e/S/elB6UA6IhjxPZf+R89IjCTG9Xsue+cDcC9qLfundQAJjvyUkcuAwahch9QuVNiFooqtjH31xABbCCqE+6C6doExQcRtbGX00iWEHAMkeh1WPjsIBAVQAXmW8XXtUTFFMWJs9YBy60JRNnD7qxy69AiykaLCr3Lwq0cQUQExXcrhr54cIwHv5YSvHaASQJdyyldfDqLey0mXPlQ0LOW0Sx9GXK/lxHPr2G61nLp+NhAFf6Zy9iXL//wuf8HaMvRdy19zydZf5S9bf9SfWv7Kl2Uu/4kBVlA4IBQCAAAQDgCdASpAAEEAPmEokEWkIqIZnf78QAYEoA0I3Avu8mOwf5DedDZ2HfVDt1eeG00/eZwooz3U2kkQQ6s2asv8oIihCqZBGrc2Z064Q0jbz06dBSelEzSqLFcDwd9j52Up0uGz4sE6GA5KP/Vwa5n8J10TdFSWaVGAAP79tO5v+bkB5VsbToT2PMcH2EAqdGHvvqoO7oOzJ7qav2ko+sN24nzF+Mg/2Nzc6R4llrXT5Nfr22Bf5OSOMsh6TbyTETJeY/RQePLlT5f169en166Nj7065GdR8//3Bz73pY8ia2A78KXi+2gHhdUuDvlnkNPckPnmHOOsqIQ0fsHKjL0s0W8l9ZlJOv0SZutJfyFED2hU2RdBOFuacKYTT2tNLC01uwku8oZ/f4D40wzyHQ3plnEVoVs9Mp16gT/Wetd5oLzBhnba1RIn7lCH7Ci0/zhNyiJWVaNRzRAnV3Wex6bacGNyyYBdBMfkDUBV2oi7oAZAf6tLeoTP1PQ4cJhbFfRTt16zQ6WAU3DNYvtDZ5mP40qIeECvuQibzWKUV6YYy1jlqxMNfZgf2A+75CiVm0K/4FEb4wOp5xRuGbbj+l9Z9CoaC476bhrc3tl2FlVl+dUf/39E5Fooxdnj6uYOxv/g5qpW4C5P0ZpXJem4Xd6aCTbe0DbvOWDC43Z/S3/yLYZcZLPd7VwwJw+zqf8UjIHwAAAA"
                              loading="eager"
                              alt=""
                              className="navbar_dropmenu-icon"
                            />
                            <div className="navbar_dropwmenu-link-text">
                              <div className="navbar_link-title-wrapper">
                                <div className="navbar_link-title is-black">
                                  Healthcare &amp; Wellness
                                </div>
                                <div className="navbar_link-title-icon w-embed">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 11 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.66602 5.5L9.66602 5.5"
                                      stroke="#141515"
                                    ></path>
                                    <path
                                      d="M5.66602 9.5L9.66602 5.5L5.66602 1.5"
                                      stroke="#141515"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <div className="navbar_dropmenu-link-text">
                                Mental health, Insurance, Fitness
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
            <a
              data-w-id="1597cced-062b-7e8d-be80-6dd33e03e749"
              href="/about"
              className="navbar_link-main is-desktop w-inline-block"
            >
              <div className="navbar_link-title-wrapper">
                <div className="navbar_link-titles-content">
                  <div className="navbar_link-title">About</div>
                  <div className="navbar_link-title is-green">About</div>
                </div>
              </div>
            </a>
            <a
              data-w-id="52ff95ae-3a70-5303-27d0-7c5511a6dcaa"
              href="/blog"
              className="navbar_link-main is-desktop w-inline-block"
            >
              <div className="navbar_link-title-wrapper">
                <div className="navbar_link-titles-content">
                  <div className="navbar_link-title">Blog</div>
                  <div className="navbar_link-title is-green">Blog</div>
                </div>
              </div>
            </a>
            <a
              data-w-id="d75c9049-3f4c-f181-aad8-0d0e5c4aef2f"
              href="/resources-courses"
              className="navbar_link-main is-desktop w-inline-block"
            >
              <div className="navbar_link-title-wrapper">
                <div className="navbar_link-titles-content">
                  <div className="navbar_link-title">Resources</div>
                  <div className="navbar_link-title is-green">Resources</div>
                </div>
              </div>
            </a>
          </div>
          <div className="navbar_content">
            <a
              data-w-id="2d414d78-fa06-2d36-5df7-ba8561aed590"
              href="/contact"
              className="button nav-cta w-inline-block"
            >
              <div
                className="button_text"
                style={{
                  position: "relative",
                  zIndex: 1,
                  pointerEvents: "none",
                  transform:
                    "translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                Contact Us
              </div>
              <div
                className="button_arrow-wrapper"
                style={{
                  pointerEvents: "none",
                  transform:
                    "translate3d(10px, 0px, 0px) scale3d(0, 0, 1) rotateX(0deg) rotateY(0deg) rotateZ(45deg) skew(0deg, 0deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="code-embed navbar_button-arrow w-embed">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 7.00049L11.9999 7.00049"
                      stroke="#141515"
                      strokeWidth="2"
                    ></path>
                    <path
                      d="M5.99609 13L11.9961 7L5.99609 1"
                      stroke="#141515"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
              </div>
            </a>
            <a
              data-w-id="59168e13-60bb-46ef-12bd-70a0664863f9"
              href="/contact"
              className="button nav-cta is-black w-inline-block"
            >
              <div
                className="button_text"
                style={{
                  position: "relative",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              >
                Contact Us
              </div>
              <div
                className="button_arrow-wrapper"
                style={{ pointerEvents: "none" }}
              >
                <div className="code-embed navbar_button-arrow w-embed">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 7.00049L11.9999 7.00049"
                      stroke="#141515"
                      strokeWidth="2"
                    ></path>
                    <path
                      d="M5.99609 13L11.9961 7L5.99609 1"
                      stroke="#141515"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
              </div>
            </a>
            <div
              data-w-id="1597cced-062b-7e8d-be80-6dd33e03e74f"
              className="navbar_control-btn"
            >
              <div
                data-w-id="1597cced-062b-7e8d-be80-6dd33e03e750"
                className="navbar_control-btn-line"
              ></div>
              <div
                data-w-id="1597cced-062b-7e8d-be80-6dd33e03e751"
                className="navbar_control-btn-line"
              ></div>
            </div>
          </div>
        </div>
        <div
          className="w-layout-blockcontainer container navmenu-container-laptop w-container"
          style={{ display: "none", opacity: "0" }}
        >
          <div className="navbar_links-main">
            <a href="/works" className="navbar_link-main w-inline-block">
              <div className="navbar_link-title">Works</div>
            </a>
            <div
              data-hover="false"
              data-delay="250"
              data-w-id="1597cced-062b-7e8d-be80-6dd33e03e757"
              className="navbar_link-main w-dropdown"
              style={{ backgroundColor: "rgba(249, 249, 255, 0)" }}
            >
              <div
                className="navbar_dropdown-toggle w-dropdown-toggle"
                id="w-dropdown-toggle-2"
                aria-controls="w-dropdown-list-2"
                aria-haspopup="menu"
                aria-expanded="false"
                role="button"
                tabIndex={0}
              >
                <div className="navbar_link-title">Services</div>
                <div
                  className="navbar_dropdown-toggle-icon w-icon-dropdown-toggle"
                  aria-hidden="true"
                ></div>
              </div>
              <nav
                className="navbar_dropmenu w-dropdown-list"
                id="w-dropdown-list-2"
                aria-labelledby="w-dropdown-toggle-2"
                style={{ height: "0px", opacity: "0" }}
              >
                <div className="navbar_dropmenu-section">
                  <div className="navbar_dropmenu-label">Solutions</div>
                  <a
                    href="/solutions/mvp"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRk4FAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSAgDAAAN8Ltt2/Hbtm2d11tat21Fdh+KmNmZx4jtcPT2DwyPkTq17ZHZtm3jDkoptZfyK8cYcURMgP8L3+eD3/c1z3vssV/6+a/70Qfxnp/52J/8xV//A29/5ye/6vGvu7zPe+Ov/zYZ57zmXfvsv7+sp3/VT/9802S66pM+86N//6K+8Cd+kyx2/lfn6tVf/Cl/f0Ef99s/ZZkbW05v/4jHL+eF7//dNGJN41x91s//6MV87DevoZGbcvWuxy/lqW/7sZabJ4s5H/gLf38hr/2VNfnf2DHXsz716y/kZb/f/x7b1ZaJyXjnL17IS/4wk2UaMdlr/vhCnvgvsmVnLZY1eeS3fc3b7u4e3+c7f/6jfv+Wb7GwbphYrJumR1imkbd95qfc8mosWdDEyoRgLVhNC6/+/VssmZp2tCWrMWJp0bAsjxy0FSFjZw4a2moRTe40y63ZkSWNQiz3mkfcWXNcz5aRLK27GVoT2pE1mSKWhaw72DHacWOQtnJrdobJHUZbTdduXm2IxY7YsbtgzpZgsbAD4yAWy1rvXpMdWAhakyysaKK9eyxM2lpzINdjZRLLXYYEYceCOa43NaymO2ANuR47hKaJyIrsThKDZQXLDqwWTMsdLzvXIqydnbGzVqZmx11HFiarnR0srSUrW3Y31xd2kB2R2HFj7FjtzoJGZFmWMLEi97mQW1eWm7MysXvIzQvNakzC1NjZ3d24lrXcGqaws5p7TnakHbJrcqmLFYvJziIL7dxbVthZrQWLYFn3RIyzs2hHslg7duy+EJJoWbJaRLu3yYK1aMIOJvcfy1oEsSPszGVGOzBBltVaF3E9aw6j1coO/3sxdmCFaO2gXQyLXF9YrLnYxGIcj9hu+fm33RdWCFPY8ftu/ZQvevX9hbWItfj5L7vt5z/q9+/q4z7o6lydc3V1ztVXf5OZG2fmEv/8WSwWn/adf+Hy//IZq+Gv/uBfftlD/OPnmb7xD/7KQ/27J+MHPOQ/f5bf+KsH9cfP+6ef9aD/7Nk/4mH/zC966P/54P6fDFZQOCAgAgAAMA0AnQEqQABAAD5tJpFFpCIhmPx2SEAGxLMAYIf5IS/ZOYfDH+ZcWwwH6k+r1pqG8mfbd7VRM3of6wBSuxwA4UOw1dPQ5OsVQDngRw4C/GQw77NyWx3dYUmd2YTy4dSuAdOGDIX1jgi/Obq3efxd9YYAAP7/VlM//J6uvj2182+MSZRUwE7PkvjmNMity9uGltYqB+9JrYOG/5u6p83/86WE6z4QG+M1X55zqvu/ONh7KrikgW2NOGu4/ThuL9+Jnjq02ck1+/EyjaqTAvus1Bi9+72Qv1DVnU3VNhSu3S0UarSFQdjlOuKQ1hvb2RSY1/t+NDYidX5CPWjJCbUtN4LdpaQQ7OVcVftFwtsRhZKP+AD2RhlHaRPNfJv47RUaoyhPhSh+El41nOXxoe6UhqV8v2q5scjuNz7Mc7bOyUUbYUnwCLnVvst6YgLcy3EstUXFpN8onNBGqAX6tFUxADqkRVu4lB9fz9QKqYGwf95Emvl7NbRo70+koamPL2BU6t9QigjETzt6PKur/0WVGhhZTPXOBaE3r9Vf0kY/yDuI2SxZvb9QNec2uCU57TvELk3j0P4+1P/8Ex0M6ZiJpPfETyEaykK1MQk4LzkUarV5p00gmdyGEKmXJJF9P/d0yAWW3ojTeTZ7ItDVNYVt+OBslPf75c8lO1fXeP0Ec4Zh/214pjtUTi+VKuy1EFViLcw0EahGcKeFmGaVswAAAA=="
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">MVP Design</div>
                      <div className="navbar_dropmenu-link-subtext">
                        MVP Design
                      </div>
                      <div className="navbar_dropmenu-link-text">
                        Create a digital product, attract investors and new
                        clients
                      </div>
                    </div>
                  </a>
                  <a
                    href="/solutions/product-redesign"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,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"
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Product Redesign</div>
                      <div className="navbar_dropmenu-link-subtext">
                        For startups &amp; existing companies
                      </div>
                      <div className="navbar_dropmenu-link-text">
                        Get a fresh look, improved user experience, or enhanced
                        functionality
                      </div>
                    </div>
                  </a>
                  <a
                    href="/solutions/team-extension"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,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"
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Team Extension</div>
                      <div className="navbar_dropmenu-link-subtext">
                        For existing companies
                      </div>
                      <div className="navbar_dropmenu-link-text">
                        Expand your team with our dedicated and talented design
                        experts
                      </div>
                    </div>
                  </a>
                </div>
                <div className="navbar_dropmenu-section">
                  <div className="navbar_dropmenu-label">Strategy</div>
                  <a
                    href="/services/product-discovery"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRqwEAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSGICAAABkBXbdthWgmAIgmAGDYOGgc0gZZBAMAOHgctAEAJBDJ4YXM9E55x7lffXr4hg4EhqG8AF3A7ikjekP3fOb/4oTdfbfpRybLfLG8S61xP4tS/TZyy30lEagm2lnZr38Wnzs73bet75RP5kZbo3ox7cFulalwGaK8zbMxwb5nuYlkaAIUPN2IVS6rjcaW7SaKjRoJpTXuuYLBRr1qjfSYt1SUlUrpEldXANMzEEq1OHd9C2mvxUaTUT/alJLXoAwict6tKTHDwd5u5OvAqCuHg2FSJnarGPwQ6mNOGALVK+NSoIKsKQjQ8AuUaaM6EVQEWG3hAgawjzBahWryQztCFYETIZji+gn0DnSt9Jj3AhILJdbrUqzx7Ao+YIM6C3RipeLYp+ziFGZ4wky4mzoIPCQ+DkPJgTgA5kwU3sUpFwHR+ExXipO3rqUiUyE/3ik+1SmRQxzoE+amCwS0Vo1vNoZ54OacbHQW6/EXfRFxNNe3ADvxglQiS81tuIxDIP5ei3PkHRQo+jft/qEKfYBjbfwFuXp5v7nRc4gpeBrw7CObn7QkzOu9ZiGTSTgVH9pmmPXaUb+2m0id2VRNOSqV6zQxftLZEJj5U37c4x2pLHRcea6qbUEC8pWAA5uqFm43IoElXjaJJuY5LV/4vTxghkW6tBubCb1E9qjsftMeWoPEJbT/Q1VUspfUIMBUPORSsbPKOfEppJhLO5T3B4QBV19R3AWHJKUbm6/4ZEWHD9X/8RCkv18ZRTtUGGH2xEIoCe1aAD/dRBbURK8Ddz3UqptRzbOvZPnV9wG/xfnuf0h8AJVlA4ICQCAACQDgCdASpBAEEAPm0ukkYkIqGhL1K8SIANiWIA0EgBLJ+00ynOAedppnfoAeWB+1XwT/tx6Q4RSQCu3CNhHH2hYEJTpynvEcpo7msBj8LN6MF2dar7jvW0M/ZgsXKMdOz89z33u8S74astmprfji+yenNNOdWWMBplKUWMQAD+/zm9X//pQglXMNFzfDI9oZQG7m0MT93YU80xOMsYPZbqY4C+lTND/q2oq0DBzmT1v9NHw+U3ola/19np/noH7F+0H5z4nOZMWhcqB9P/KhpppGgkhIrj07pPJBs72okQWt0LdaMjj4lVsmr+XkvGOjjGHBUcPAoheAGjqv0GMFvfz/P2nPsFJ/9qW4yNFuDePZgAHnuKmhMyIKTaH26hvehJ5QOaC3qY+Myt1PP8vtxLV5yLMzXCdqh9290imMnTBL/+KxT15SgJ7//5WxLv9z+KmboTHMEA7YBmQe6lKWzw0AlX3LmDuvLi7FCcmeTSIw9tMbHzXLQRBWWhWWitOhIgJkGz0TFnBxam7JomiqsYd/dE9RWjIRoG2TD21NQTZzIDf9EEDdgCiVZaAIJliEF2FTO1Lt/lC9SrZQjfSg9+DayRGL/lXRf3+H/NJTOu+OnLrqQsMKhvrP//+L5//ikz//xWcUaw1BSJWv+GU/UEYG1QySWcox8P5MI9ibUUH57/GOqQJ879O8UGceCRcg5lBNzyjnPxRzmLHzkM27O6AAAAAA=="
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Product Discovery</div>
                      <div className="navbar_dropmenu-link-text">
                        Research &amp; product architecture
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/proof-of-concept"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRpIDAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSNEBAAABkJZte902giAIglAIZrAwSBgkDBIGKwOHQcbAEAbBDGoGz/NDsg7p+V9ETED4/Yz3bfv/uE3v6O7uckzvI1o9T+8h1ekyvTud07vT6/tzSe/ONb07t8O70+P78/D+tpd355qeI50GuIyL58fm2MugdN9UEZROWxoR/1oJdl8GTKv7KLlKm1O3syoqGeaAHZdeV1UyMxFE6eDU5yqoIIKZZipNjy6TlaAUwDItW+yQVoGSikUEoYOXDnfVAopFBBVQWpa2JIrViIgiYvMWm+4WyUBRRBEUaHJqiYJKhkWsxJ6XlpNYCZijKHaeWx6KKNk+qHRbW1ZbyUQUpcvWEM1RMgSRis4NU6Eec8zpM/dAEFBRRQHFrktsOGUqKmKOKFL3L+3G0HrIEPcBEVGsnUP3SQRBBQe+9kvm4A4oBaTq0i+8KaKAOYKIWD8NWNSCkJWxKQ647CiQkSkNSxgYMxVVLKLYeBwRFhVUUJQ+aciE+yA7rXMYu+whiKg0bGlQeoOCWMTmWxh9VhApgM1LGH9HM7Hrmp4g3EHcpWVN4SlnFUUU6tYUnvRqEWxdUnjatAqqVG2X8NTHVazfbjE8+5/5rWY5x/AuXw63eZ5fz1MMP+IAVlA4IJoBAAAQDACdASpBAEEAPmUqkkW/oqIY/AYt+AZEoA0HW7oAPOk00neOP2o9HTMAPoADGLshn96WMg8MjTcth39yObEHkGw2nKgU7bHancic5xquLklyu1ugZf6EMeZL/EhjHl9Xq8qTLLZ4TYAA/v02pn+7H//79bJ98M//3k+jqvK7//R59Y3/E79CKy5kvENr/uTfuv+VVKTbHvyE926ceKXAb2/PbY12bXUuSZbDbv/Q6C9vPFP8DX/xf6gnRNHWzEoM+Y4x6T/5t5m5L7DmIS9wxwk8v2CgsfafyGVYa+LB0esd80+VZui7hVOseFkZpBDC5MhPj+fe/Y29dEHGuaFu38ydBvyaP5/4/1AwU/+BDVFDRoFDePD/0/it8ZA1p2p55xo1Oo1DsYCYABPOenUasK/FUR7nIgy7vRNHIegQVBK74o23H5r+XrcAZ1JY/vzORe9jP+aIX3BvvmKOuC0i0M29ZzCHuMTBIoZ/M7VMnn5dgB9ilpZd+o8mVrDsL2TpYxiZbI+OuWoojCH1Zf9h0Hsrcy8gAAAAAA=="
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Proof of Concept</div>
                      <div className="navbar_dropmenu-link-text">
                        Validate your idea &amp; viability
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/ux-audit"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRqgCAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSO4AAAABN0AQCLLq6CNMkEZERJgXsiJJsiTnKHjKBCCLgZ4AxOBNQCb+IHZvukZf9xnR/wl4eWP+4/jv0Tv0WQTfjzxOiyLsUJKJbrWd0WrWFB2PK9NqIPHqh2sdlY6mr7mmMlpGllLCxNUDycCYbJWMCd16bFzfQJB7rv9300aUbmkqDWaL0GZkqUIbky49TVB3PG1uu3g0IRW69Th6S2mlsZVpH+gWIeSO873uddoKXXtesTZCRrPWJomrZ6g09+jE5JYQry+ExNWNojprrU5d/HBGGK2X0wujZrgBU9W9qiJH7y+ENL4dfX3tafh39EYKVlA4IJQBAAAwCgCdASpBAEEAPmkskkWkIqGYW7YAQAaEoAzpGhj0T9gALM/gJ8IVyiD1xXzveRF35kxLUE/dx0ckS6b9pDnqIDLwGDI6T+2hS/S1xV20OCxJafSn+Dwau8AA/v71sX//4pJKDRWoUV8N9sFz/qpMUTzAjfEVq7LGZKblp/wAmq0LZLUovGJSLZSek/+flCuhiEbSjyVv+nVjuKlVdRNk77KwyiLrqUs88svklFlPEDiuwkdO77HRdSOPWhCS1p3HXREZ6N37WGAMEVlGKz5o1ymzoPa5A7cBrIxY3/JpG5v8EatfS5Cf5EU/pWy/of01fk7+TfmdY3pq/J38gN9KF/cWriFHzWftOQ9X7mxYt0IcqPb2eHfbXnE2daRUpfxnqNlim1VGmRWWEzG+qZnBb+fynTJq0/zaxwU8EgtOscFRx1DjmJ/4I1jYYI70mAx8tzAFzmgYcD7/lXv+hNNZYFx4Y3n2MG8Vbfd7Rv1U2C5dsv/uJR3h50DQLDBcPx77z/E7+P+f9+u9+ncuaKHIAAAAAA=="
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">UX Audit</div>
                      <div className="navbar_dropmenu-link-text">
                        Make your product competitive
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/ui-concept"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRogDAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSN8BAAABkJVte942HwRBEIMFghm0DGIGHoOGwcIgZZAxMIQwmBlMDJ7nQP6RnKPtKCImIP7vzOPnO6XhvqhLfpPLNBdFdX6DNN6LKiri2Yav2Rq3lzOl8VFUcRv1cZrh/nITVLY+TpGnubgXBQHr1C0N98VNZAVFsZ6j72WaiyqggqJaIVS3Dmm8F1UqK0FxHWscWg1fs9tYA26yxxIt0/go7sVNUEAVlZXfLabiUQQFXEWpFPXaINsU3I0VVLnBZwuUWkXFGkVf0XBsgzXgOgqC9xZpaSKCKBXWqA4tIj+PWWmlooKrJRqPSxtwHbRCn60ifx9TEQTFGtVrs4hxOYSgAsoKSO4Q6bYLEVFEVFBgib657BBRBAVUUXl0Gm2LO/GjT172oSiugoqa+nx7AJUtRWWOrqkcEFEUrAGd+nzaqgZrLn3uh8SaFVf/RN+5AShiTfXo9DomsoKbHydDFFdRkdTpeWgdRRVljs73FggqVPjVa2izjerQK0obWFEs0f3WAlRAlGe/tByrcfvaLy6lyTpqPkGMLVAB9RWnvCwHlslt+HWOyN97yi3FrIj1cJKIPM1VmacUEfmvmyVOnXOOzUlU9Pe59s8qyvV9flRofp+4qbLEG6dF9ec7RZ4tU/zLBgBWUDggggEAAJAKAJ0BKkEAQQA+bSySRiQioaEws7wAgA2JQA83M+6/VX4LQi0gTPSQ6WanJy1XaEb3mnxv+0MLDYV78BtErzqvBni3wy3PKRHIdnxhNboAVF1OfEj0kWvum/DuAAD+/TZ6H//ocCAPdGIIF/rgLmxTZJ0LjmPM/UCyDK2M2///kPTFabRVPs0cLgesPtPe//rtY1H//hPkBtwk2d91LcsdfizkftPy0eDwAv+Tpr1G9ltuLhCQAVRWrGIHBKH1lDAtGRri1dRFBrmusuBgDX8TKZoB+X5hf/IxuivPgs56WDerGeABC3XmPSw/Nf/x/x/zcfwcb5lPxT0XDH7v6BQTP0wW7nIClpodY3QQ3wYvZAxTBVVarAInebn10/tnp6iEYWabEkQxnuAHCLIP3oDpeJM3/IyY2e///Ig0OT5H0yf1kqma7E8v7hP83/iA+PXj5BJuWx+2K1QdWrqrfrKnqpUPKyHveOcRIVjmdT9uT8Ckwdv/9znl9dQRjQAAAAAA"
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">UI Concept</div>
                      <div className="navbar_dropmenu-link-text">
                        Define the unique style &amp; visual
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/pitch-deck"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRoIEAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSP4BAAABoFXbtva2EQRBEARDMIOUQcMgZhAxaBg4DArBEMyggiAGaz7c+333k/r/FhETcPof9fzy9frj/frt9fznOH/7uNv+/H55uvP3u9X3y3P9cnfk92f6zcG3y7OcPx1+e3mO86cH3i9P8buH3i5rlx8fq58e/LH0q3me923hcteQklA70hH38743lFAhokLRAa77fgohIoUMig64r8gYEWSsbLbidWV3UjaLyoE/FiqpIEhRmXbAbUGR1bI7LTgvKGpXNCJkbNdlXykZQ0PGyjxqz+s+IWODQUo0ZHxEQ6GkDAwIZf+S/UWTMi+GdrwsKFUzZBoUGbP3tDKfRKaZVjSprc+1IruTaRKKauN9bd5QRKZFBWHrywGhyTw7szPz2+mAgyPTQravx0RLtEVodrscc2AiyljR5O10TButjWVM+DwddGTGJvbcLo+o0BAVydgg7i+n40IyJtIkm+X+cnrAzkoSmYbEH5fTo8pqBFG8n56iaJJCDfEEZUxJsp1pD1PDPENNiHicGhqoQiVCT0CmkTHbyVOINrLd0HOUNqah8oi3FSWhku0yHvK6NM/YkEzTMafrEYWGsnjM6evH7Xa77ZuXENrooOnlgJggQk+VMWoIqmfazjwlHnG6r5XaIsX1ER9rMq0J4vURl9uaolBpuJ4eevl5X1rN7dvpv2hWUDggXgIAAPANAJ0BKkEAQQA+aSyRRaQioZerV2BABoSxAGS6n3C7Sxtw+eA9Eu8e8+v+x3wq/uD6Sz53UXG6rXq+xjm8FJqUrHaBUSsv+XKrYvxo7Z/t2DlJw5hw7SCF+wrg9nf67fqsYg9bjd58/GRJPjomOzi7S14i2A0kgAD+0k8//7uzrisX8IF5WLTAP4Pb6JZEBM1RL/sBg74HVjB//Ir1e/8QCHjWvO3kov+lCc7qOj18Xanr+kH9Q/4xUIfmj+of8YqBwA2TWaATueb/uJIVpAUdhNBleLz15HH/xu6OlVXTCzj491/42In4/9ne3HRfA5l1SWZuHwXyjVmXau5ZcpKWv4rlxm7zLZulL7QIQEgHrfeuJlWA9toPK2Y2ruarK2IyctNJseeZc9Ydrv0WeyNZmISDvWRUd0Qor230ah8va6VhR+1AnTeesiULzAl1Oof8CSc8w85sZ9bbC5jx6Qf9qtkONXnK1p11bUX/UPR12F5wkPAquaK3p0ajVH/6Wr8abyyOvANPkGG2KU0GsnGBkA8fmRYdlaBdDvC7fLA7nMuZRmHO90D6hhQvmKX+XWTRCaevqqg00uy3HaGa4AM+CMTLm/wxNPqhvOQAItOZv7y8rFKe7hhSXA70ig41Gyxle8PnvBMgJoXM8jkRf/tC30KCfebVx9n/8Mrn4WZRu1tRLB55gq8CKrFL/4leZSl8VwCkI8JEa8uKK6BlJUqra4qARVGj5lXz6l/bocfalG2FZhj5YSOM/I7PMbkHFQj/aY6P2hyAHa1QL4BxjguLuPPf/chQ99aiigAAAA=="
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Pitch Deck</div>
                      <div className="navbar_dropmenu-link-text">
                        Winning investor presentation
                      </div>
                    </div>
                  </a>
                </div>
                <div className="navbar_dropmenu-section">
                  <div className="navbar_dropmenu-label">Design</div>
                  <a
                    href="/services/ui-ux-design"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRkIFAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSGYCAAABgFZrj56oEiphJOBg62BxAA7AQeuAOgAHONiRgANGQh1kzmnzvkmm+/UzIhxIkhIxkDJ4kV3BI1/o/jztz/P9Pl8Ou8khV6VSy2mfEbeKKnUPox+XaulXaisXYomo2obg3tAYSmXDKIN6S42sXKlaFN7XBpK4JboGCFR7OIr9aLI1mjSE99Aw5KxFDBz+KJ6L3bKVIuYS+BNhyLalwYqCQIHocWNqFnIRI5S4FOaeSA/PXMMfKUSbpnFanPmmbARMvphrqfde217fpl+eDgTOTcnDnfF2h1BBUuor+/o0XrAdv0dAHTZ5escLziVYAAICIcUAEnMITOyEeuppU6BDNgWypFXI8IJZfCyOugBTzZVT0bVVlrH37j+FkzQIIYv9oHNvnQAvoR/tzwRMBiouH52h4+LxDzUxoCAW0YcJaXbuWaS51RAHwcWN0ZF6hoWEBKgBNjbtHEg/KNFTVVOFxiJ3ZAf4eqCF4mVTAWDy7kGhnjwQVA14DJvMdmGsD6EJUaBUcA8elugmFGF+TXc33EGRY0jB1V30Z6HhETiLZUO6liCwDISLRpGH6HEu9jypXMqn4zJmHghUXCwHi2WKXGgUp/pgyQMaudDEcCzQAJiQU/BC4/mCYEiXaEwOI5mORANkbqQiEIvSFY9Bb+Zh1QBkSAa5WlKra8M59YXHqPdOxnXUdV/XxDoiNvNjy3I1XkUBcQ+rU28/rPydTsmex1Waam3XwPev9UBqpCXywExPS9wxi+mxhK01ZmE9x4y575roVFqGvHNHMRLy3Yxd/myl3CBmLaLIrZ30+HitLXm1/rvaAVZQOCC2AgAA0BEAnQEqQQBBAD5tLpJGpCKhoSuTnfiADYliANHsYCv7eQdqGZt++fF88D0meoA3jb9yvSAzABT/znh12qsba9zS87oWgGBl360dB6mQUj+mx8JPYVwg7GCzEduBDVn2Nokwh6z/9xvTf0Pf5KoSibfiRbNoNrRRwtyKaxYwcjZIBcl++6hBF9iItBhWoADD7Xc8B8exsAD+9n4P/2R3vI6FVhkePSum7fPYB/ilaqi3hWuqZS6n9I+Yv+367t0oAQTRrRrqPVIzCvD17qQo7WYr6pX8qm0bKM8vGr+AKbZaJKTGSJ8m7UTsAjH9wFpA/vXLuvRIlTr5+P+ny/0vHlZo4RCYqXxr+xDm2fspe4fFreGy/lufacaBNAO+FwCGiaDO79ZlP/1pLaq8OdLZNeNggv3rmaI6tXYBVj6g2ud2yk4zEe0IDx3xriaNQuktEV0ZlpszI7L4l34i8ofG0o2nnVMGunjaijEZ/7Fks9JFSzbv4CG6nDL5+NVUUT9O88/2XqqP4Xn7JTj3CGnrO5lK2/ar78nz/9fnTPDinH+mv8eb+xv1QvyQtmLfSPfWJnYpbyKLXkP7i1xlPnU/BLXdYIGaIAjy9v+jv/0sBbqgDmz4BQqNOJ5834W+trFzH8G1lsTpz2UYmnYyPeCgTCPj4udDXAEmYqh7kOPabX8Y2NX03nhU+P1vK95PjQAsioFq7QhFzy8SRk7NifiwO/0aH/8Ui/+f/9C17bJ8cyMXzg3HL6oC/PP6Xut/xgOjU3U9UgC3NF88Jdvqvze4OoulufcwO2P/5kooYvyrkv6GzFXEPLbK73+JsT6ICa8Yr3+FEn3SgeBO0cUWh9Yi/8Sy+1/8Q6wj+nMrd0w5y0s4b33097P07snorcncjgMsL+Ou0Jh1NrlooajzEvbKqYAAAAAAAA=="
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">UI/UX Design</div>
                      <div className="navbar_dropmenu-link-text">
                        Web &amp; Mobile App Design
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/web-design"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRqADAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSJUBAAABoFRbe9hICoRAMISGMAxmGMxAGAbdEJpBNZOC0AxiCMXg3YUkV1nLXkXEBDz+OHwe+3/iePeluR5SELw9LxynW0MUJQXl93P1y54JQiLfF0/3N4y53O/FcVMQsm7m3ARlCK3aJ+solXm7IE0icnGbIhhSCO2jyDxjhvaoLPtEsgdFBaHFuEdlGg1kWptczlALvHaoQsgYk4Zzh7Eyj1Jqm5RoyJiL7cGAUMY08dqjzIshSqpzA6QUGbOO1w4pVDQpDeG8LUkkoaisXrdJpKggFBnP23IxFyNqCyIyLWS5TWhFKGTcQSLKWBGhDdKFsYwJ2iBjxiauja+bEBXJ2CBjcd6WSJMsS+Y3VZLINCSiNrgeQZSrF/qKokkKNQQ1yWvlS1OSrDPNpJyLx8eXzDPUhIjK9G31/9c0UIVKhJDKsXp870JDppEx62T58e/j6vHz7eJv63z2/e3yj+fjq799XPj8eTx2PE53nscGx+ne87jvdPf7bf+4/9td/23w911/bXDc9Xi/7efj9uevj1s+fjz+XAQAVlA4IOQBAABwDACdASpBAEEAPmkqkUWkIqGYXO5UQAaEoAzIyp1yrHL17ecA0WbrQAIjl/PYvexHv0XKhvCtxwRslbgxAGX2mViGoXgGDhEjC7ZF2wZvB35Q5LBk2IgWVm1F0fqBij3Mgg2L6IMsFSjhZAAA/v6fYf/bEYV8e4R+7a4FNZQL3J3N4vmIzASR51gkhzlXWK1jf2IB+4v37WPM7uI8QiKW7qG1Kd6Sz21u4GvuHJV4pOkH8OdrBFc5FOtMR+rJ/SmEnk0fCj9uKJ0bqgf9J7V6ZpvEQQfhZRVjjmu+eXwP8j8jPNUlwmXZPJjq4YLhbF3Iag/fAjP59a75P2XZ5Oc4DwSu2dl5ofRfy4R76FloBXhZt6btyIXduuxOLpfkEFDYqzx7dCi0NpsPpRvCx7g+n80hrD3KAucW2GEwhkuvqdIUBmmLqhgzBCtqePpWP8tvhxcAD9bP0CNGKXXJzppwL8zHaIWTOXZRMIQDGUnn7Dp+/L9bAY9XNyhPO5TAfCZK8XjX9Op8DRj/oYv/7lP/9g2//3EVXTXZfaFfnBPusqBDh+7r0UfR+LhN9/+a/UPgr8kDJ9/vBX5IatMBewKJZSSpAXvpW2/qG1ysdKffv+LU3d3cqIldm4NpPWAkwAA5QAAA"
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Website Design</div>
                      <div className="navbar_dropmenu-link-text">
                        Custom Websites, Landing page
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/mobile-design"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRrYDAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSMoBAAABoFXb1vW2+SEIgiCYQQTBDGIGKQMJQhk4DAIhEMKgYlAzWPPh+y/+v14fI2IClv8dr69vx7++rb6+THH9aW9BVsPzet716Wg7Vv98Oe27T0xKCX9cTro6XpDNup30eijJ/h4nvR1ajQjR/a8gZPOvIasNj7kakgrCfS5VSCjzZb2G9cmoYTX9BSIqFOExl0IGRfORsbL5fp2rbBaV8df9Og8pKqsNeL/Og/KZz5d5ohGhDb7O0ZCxcvDjZQqDlOiA52WClIEB7fKYIVop6+36uJyHrKbUEW8TZDWFysH3CcYkkXTgeVoRiRTVPqetZ2cOn1YZI/KZp20X+pRfMzRIRB15Py0l7Tj+9bQxY8YOPZcJgqhIR347L2MirbTruZyHShI5+nE9rRyN9ny8LFMUraRQG8/rct5qSpL9H4/LMkHDeoZa+/jx7bJ8+oGGBqpQ/X5ZTt1HViNj8FjmiWgjmzMpbayGuk+UklDJ+mMi2d2Q3CfKkTI+/ioJ4T7RZogV9JgnEmWMGu4nve4Zy96sPk667CpIlNq4nbT82BHZzmp5LmdfnltUQ1AUH9fTlut3rQRtbf68LjNebrfb7cvt8Jfb7Xa7LP9vAlZQOCDGAQAAcAsAnQEqQQBBAD5pLJJFpCKhmFsWVEAGhKANC4+OOqLgXdV7PPlHAKrHwVyQM/coFxqxL2ACcRogU9OQwRdUftysbv5R5lbJ6j/GMYQc5nkC8dmk0uEb0gonGB4R40SVD5DUAAD+/qAj/0It5U69065Yr6kMzfrCfO2PBkDcEbb5GY5T5d/LjJfr+rVl3AbGXGgX4WL87L8GaSI3Qc1TTggqGpP/WFvmXjfcJeLkSs2HsSNnKfqtbdx9PP3oeh1K5zK0BmkPmT1s3Qzu4XssFkyE9228ZoU+fTJh9D3FozsEfxfLArsF4eUcXy++15vOGea6uUKvqkEAie7P6f7+GSw4Vklta6g+LzFzKQJaCY13/+i5ltT/rhf3/bH9bfw1fGl0Qc0Mzl36XElxrc8QhNTXDSL1d0UX+4YK6MQ9nh/cdZ++DD+y9ViYcV/zpVNU+8zPeMqYHvq1n2eD+JRvF3yzhf3NhrrmU48KusnYhnfakePXCBlHa6g8f23bhauLCQr4OzsPD/ix609+su0ABmAE89FsZzq8ITnbBBpYCklGWYzOfwUI085yb7PiLGO59xFWGPscXjP57sNuv/4M0QJ4AAAAAA=="
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Mobile Design</div>
                      <div className="navbar_dropmenu-link-text">
                        User-friendly applications
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/brand-identity"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRmgFAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSFgCAAABsJZt29i2mSAEQiCUwcxgYxAxSBkYwsagEDoGgRAGFoOFwXX+eF/Jsrt939+ImIDl/8aX94/t/s8f3w5c/ty22207fNs+3l4PvG5Ovu5cjTmYcXvd25z+Plmb3J/tZbY6/5+XYXNq4jr7+QC/L8vyrXMon7OPR6zLslycG2xP8HZapk/QOnRfUE/hbXBvSPTLHO326zSzPcF6Qns9yRe2Q6Uy7ylOjBx8ghrai1IIPYUTM2boCe7tjuRp2iG0Mz5Bk3k0kGk9GxlqB7fHHQwZY9KwPa5JMo9S6lnm0ZAxB9v56xkQypgmfs6+PWy3GKKkusyW7w9LkTH7uS7763agITpERZPS0Nf35fBlnX95wnX+28ty7vYMy4P9etuvc1nXdX1b169nWOeXY+9fTuyOmlREuH0/cHVmaS/TMiYo151XJ+doE8fGy+yvc4J2krFBxuLv2ccZGTNtkt2S+fYAVJrINCSiHlPujSDK0ccU7RRqCGqS2zmVMe3tZ5pJ2U5Sw/GaEFGZnkQ1tFeoRAipzgoybYLsJwdvJxSK6NC8oUjCdsJu6VioHFF0XkriC1/ZL2Omud1VTWSadVmWy5BMk0TY7ghKmpSdcmcFdSxjDDJ/myC0U4mcomS3Q4iQhOJI0hSRKOtADUEjSkcS5GAZ3yaZp2QeBypBFQrSrD3SLNJt9hMh88j892VZvkFNMEnwOXtvEhRUQ9vLsizLl0KlWZG8z5bPIWQMGq7L+IejkSbZXndet0zGIOK6zK+0g0rJ7XU5+Paxnfjjsuy//vjc7v+4viz/NwJWUDgg6gIAABARAJ0BKkEAQQA+bSqQRaQioZmd3GhABsSxIjuQIP9aNjxm/lF6hmbffnkv7l00HU6bzn+4xawC74lOiDBeMXogTCT57AZGKaXDGMEnD/+7yaYM7cV8jDhpQ9n7S6TM55RIUWyeC6X+DtkVOL5Y5+ieSPa9YF+e71SW0RZ9aSOrSF+WVf4NrF1lV1jczY0Tv4AA/vi57AtjvI4fzc+xgOKaaQMPHJSDyX/3+K3VT0KAN4iv6z84cFNreIXuVJ7Xmf52WwJlHCGmt71sWqFhzUUIqAIYoC48pvsSqpd2OyXTHllcpU6Z633c+ueTQnj79bNKwBHl4eAteAmTznp7Nwuddjj+8IZaLE9fDMBerrTSnPy4bcI1fXZggOeyyZ0Vlv2Ivz/culV6JtkAtdbJ0Ej9h/Nq9Fmdk9mesUFrAJzKP+NHjE/E6u1ajuS97RMwJsy1Ofcuvf71O3AOzlYKbUrqBwwrQS/fOTu5TAWyyr5IwRm6YM0O7s1m6/ipe/f8Uyvz32Ei/4MfHcn4PEAVQ7JPDGD009CpDsRtqTExUf4ndLFRFWt0x9gIgqPfHcClGC66xHXrP1oDOOWOrEkRFsBVNeOf8/7Cmnod9w+hDyl+tQt117rb+4DhlFKe6qqmcRQekAjAut3n7UPK8CEI+fWIghBSCadwmavVKmd+YqjKpDduiMjcWwcVqO2T/ofEN4MqauYCr/zbwV4dbjZiGpAmlE/l39v0qRn0YSP+lPozBPDaSZgupzEs2RKTK11FbVi/+FdVPN90SBdqAE3f4HjiMUySzei7S0n8josx4q7MxXSvOWO5p+5+7Web9orqZVZJ+M0kQln/loEUvWP/dvIN58nSaJta/hOG7u48QGpDu2K23u0gPqYCXjEgG3PTa2VOIcYD1k8Ptxa2jkJrw+Ky/Memixi5OUWSA5G4wmbUSng1+nzXYwD99rux3oZ/pFrBslV7owUnlNC2hOQOOaaZq/2GaAAAAAAA"
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Brand Identity</div>
                      <div className="navbar_dropmenu-link-text">
                        Logo, Typography, Color
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/graphic-design"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRkQEAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSIgBAAABkFXbtt02giAIhhAIYhAzuJeJy0BlkDIoBEMQgxqCGaz1cZ/j3L4+I2ICtv+T++N6+36m2yr7afuxxn7Z+7XEZf+5wMPRI95r6Bnu7vgR6vj+8zXhes4+jwkPg2LzHMrGRj1HXnFosfd9GBUErOa+I4wo1tMqCCrriCVqXo60BCoN8woUitW0ABbQyPGwRCusoKIgCJgWwBKbORwqWCJLKFqgIEtUsZ2WASmIhhQoYCUHE1BFBUWjYSeKQrQSVGySItGwCiqag4GdKMYroYKokiIpFZsVYyGW1KpEooK9qOZAYhUVURRMkURRRcFmjoOgQoEqhEJsYxUrKYoFVBRFATWHAVABUVRUJEXBEtuI9RwH2xSgiISpogL2SBhAbIMllmmAaSoFYhURUfKA0ynAQUAduDFNEBWVBiD62bddzEBFKyqKioj6ax845mCJQoEqpcq5jd5fSg/Yi3UEsX4Nbbf8eDXATsTZ59C23Yy+j93DHWNHuI+x7Rnsa5t4+/EO9P62z/hrB1ZQOCCWAgAAsBEAnQEqQQBBAD5tMJNHJCMhoSuTmwCADYliANHwd0/pOjOEOFuCOew9C3kzda7vK/2ze0rmrpz2mEpjtghwp6Pu8nC9jtqiU+sp9WjvJLcDlS8brQgEpo3E0/oK2PvQUwuMIMwespUvrrMXgBi3EXzt9zOBZwOsNw7eH5yyDU4udiSQrYklNjgtUNTcO9eBz2Qpw+AAAP77kdkZP9Rj5dGWBetP7pBHY9bN6lmp4cQNZ+UEURxzAT7fXV79NPPpu3GW/gXWWvJnSYm50RU1yiwRHQOOq6TkAM1uJb9BEOzECaYmiRmk9ksMc97thZCaqvfXLy6gbsQS9O//o5x/lhuMf81nn2F9Z8j6cyWAyzXnL5Rv8e2QpHZZ6dLEf4wi/zKJloHWKbzmHz+5kg4V/pyBGi2ehUYVxZ26LDeqMwvLGTtVUw1MukS8evT1PyaUp0l4BxsyVLg1ji2+wvT/8hdpOwPce6lJqipYijO0LJjV//akAC9ibZSysbiteKur5wre/JZBJ0Ej+zd/+LP00gEvS8V0xAHR5xxwj+zSMSscJZW5brvPMx1sMgjgaddrKG/Ub26Krl+RQIodHo/1bO5mxyaVlcTZBH71IbvGZjOX9dRQ1c9evKaCbhWhBzshyq0nhqvMUHTEatXbifNO7wZuFyfL1VtIyebagCvaxa648c4C2Nz794aDtrSrVj/vkb/QR5nCMMq6r/PrdbItSI6JPcjl+gbi/rt/3rgB2rHFzlqgTuvSqR98p8Wf4h3Mnt/faNnop0od6U6gOMFM05DNBXudIsjKwEmw4h5iz7j6YGH4fSB7MmhcijGH1dArptBD52n086hgSMabn/Tau/WA5P4YKdH9EOcIpvg74RxD/PQAAAA="
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Graphic Design</div>
                      <div className="navbar_dropmenu-link-text">
                        Illustrations, Icons, Social media
                      </div>
                    </div>
                  </a>
                </div>
                <div className="navbar_dropmenu-section">
                  <div className="navbar_dropmenu-label">Development</div>
                  <a
                    href="/services/webflow"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/png;base64,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"
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">
                        Webflow Development
                      </div>
                      <div className="navbar_dropmenu-link-text">
                        Site builder solutions
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/landing-page-design"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRogEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSFACAAANoCrbtmrb6X3pR5qfCqNM1I1iRvtQhz7gyTA5Bhcbmbi4KGZmZtKni7PvrXfODsmImAD+KS+4+MJ9O/586+0nvpzHjvt2fvX1139tP/PM48/f/8cM9j7y6ecxUjt285Ev127PXR9/vRgsRHDvQ0f+WLc73/8aw7ABe2++f82u+epdgEZg6tG3X1qvq95yyYUkybj4hbXafsobLmQ6AS57fq1OeXdkU4YL2fvXH+tEC9k0YwS71mthm4EshMFWN67ZuaIPfi6qKFrggm7ZO/H5M59xYoM5Xs/kgY3Dnx1iMqcSMlsSMiEEQkggIeHgec8dnJrMZFmQ6QRkUmIECkhy7utMSyIYQkoICJC5lIbJtGzdBBFE0iAQEhMMSBIScmtIQgI0YgAGWJogGAINgNwaCA2ABpKIgQJCsuVETqIsmzFYlpJAJDGnRE5+A8mQUBCSBCQRCE+eAGIpm0ojIGRSVp4WICQ0EBq0lKw4gQZAMAAhIcmQVQtghkgCKRiCLOcqoAEgy0JKiJC5JKuVyRgsGxqQJhm4mmUBwxAESUEQJFdG0gBIEyBMoAG2OhtBI1NCo8GmuToEEjORlJIUsDUAERpMCg3SkLUWCCEFwZihpISQzkAgNGhArh0p0EghWX/ZskCu2bSNpRCbRZIgs5UGzQkE+TvMnFVis5LZ59zkf+DfeXFjXq9y+MTBOT0Mn13EKo9fNfXN+99+8937J+E3lj9bxXfnLz32LLP9czv58svM94NT8JvHmPE327dzP7P+a9tjzPuO3cz8g5fn9m8YVlA4IBICAADwDQCdASpAAEEAPm0skUYkIqGhMBTcAIANiWIA0jFBW35h/nuUbEu9zt6vMfjrW8cfuQEJKqZtI/clG0PbLWyAEkd3ReN9U9bu+3BjNO+YG3LcK6QvT27gRr/OqIGkeZHV6O8q59tkCfe0xFm47fBWcxNnQxxJtgAA/v9WUz/8ElAirGI/eThoZr8ALU8lSnZ1y4++kwUQjtxsYIt6//eX22QN2HQMhhv986jG7uFDQJ+gV7zxfPf6m+9Td8t2b8DpUDI5qrf9t31U1AoWg56Lv+nXy0mVhew3uAutlf0PtyCO5Rlz5nWpujmcrwLe1Xn5UVfjNjlf9CUVhbit3hP3rMqTbjF93HJ5797YpasFqjQEU0QfrAZYamlk8zv09xTgqwW5mCQngvMdHM40sMGevm5BFh8mvJqjZyOa/bxeQZvE6NRvfon1sRVIL2e9TjFCcw7lfzvmIoT/On3KOm5Ophn1dK8oTu59uwXgdr19YDJq3webPByTLv5hgsa+bpM9mkMvDj+wh5xsJMe4QJJVVH77Qc+RyYV4ayf+xiB9qLe0M0sNwht8EvTDLf/WC1GfSzxZwGbcbrMPu5uXgpdKJvi0s05lQe5lujMRnl3Z9H8/8eWSf5Px6KuJzuxpcDByKDfHZ1xC5fQmlDy/+aGHjhXRzOJDw394t+6UN5eH/rQwVeUUEGmuAtlkJYAAAAAAAA=="
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Landing Page</div>
                      <div className="navbar_dropmenu-link-text">
                        High-converting website
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/web-development"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRtgEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSEYCAAABmV2I6H/0kGrb1rIte38X8P9kd08kBs0lOWR3J/sF8HMFmklElwTVu17AL50zxvfss9/vfR60RUwAxABs2zaQtSCSAtRxBMIfsY3ZYb01xk2Z9tkbTzRaHXXMmAEIBAA/THioAba5ZbgiIvnguwO+q40LLiIYoPIVUJi232d1ccgVNASkOApA07aqupzjBZJYzRvQw22mVcRZu5EwREC5UrhtQj3MtpM7AxogvWnaOvWm04IoFbVDpADa761qWO4nU5vI3DRwx00WG+w2rge2ACDZAekYRMaMxwRTHngH4JD7oGXb4xE4CAoCgbkg0HAsSBoAgpBBhRh1Q7y2ESzkXCS55q2MCOMpQJHmPH6xiBEXSOQmcyJRmRwuSoLscnPQ3HIUgrooBovHrNdMpnQghSWTNgikc0dd+wPKcjxA/aRdiqNCGtojUB66CMnNA+Q1gDIdqeBhzVEgSc25NlsPs5+RQDaOQqAOS8MhGxl96NApvwRAuXYuSxI+OoxKlZqc2ijZQS9Q4kHv1FQ3WX89NprYrTdpCcZKDxCQ4cxs+KAvAiMPTiepyQ41XkE/kLmpIx3SDyJQ70KpZ5XBfpAQvuqNojaQkZsXKqbKAGRc+uNA5jlrNZ9AupNYqgDPkisbiKDiQBKhATansNU35J00aDSCk9rdPlV6SWox5ROChi1QubMl03hN9qrQbBk0EFp9FJoHUgqgdkc5thH9q/zupcSWIPO/tG3C/2D7ojlz2SuzNMSkywDeWWuDhnhkUgl44K9eCwBWUDggbAIAAJANAJ0BKkAAQQA+bTKUR6QjIiEptVpIgA2JYgDObDAE8AQ9YHE24HPG+jDeOt5FBTFhBnLYwm0xHfwmduvzzqzp1WrhLl+pZsF2vZFs4Yewt2aR3b2LtMsskt2ucHTZ44It0jcdE0MwJIZ+xulRsJ0enQKLGAD+/xpXf/cN2Ac86GMVvt5fHQJX+Spw06s0TKS6dvnUp47CqN8PvEx/DebEnbkTHHnE5D+4U790/+O3M7JWQK4vqCLxbWJfxTuZDmDRZN/NL/5MiHxC9ht/5tQ/h3Hupxv8sb2EFfV1D/oXgJ9Sobm0mX/oO1397jPM/xQ0JdNI8lhoSRQ1PW+8fEoTd2NIVqE93L+ZdMov9Lt8y0AWsIgIfcf/H55fvuUEn7Fnt9LQMqPzATK+VyUBLaFx5TUJGkY7LizUToOg+HkTjQKsd1LOdxdgMqW4gy+Q5jutOxEdaZm0SJAt8qfDBXSYAHsX6qh2Z24olcwRgWpNCQgEYtfE6O8r2m2F6Pr7d93v+aUJx7Zqw5Vi3R0qgKInE9kLo6KEJF16qTwMM2NuNS/Wu7YtKrikiGTUggDlepH7o+uxJIB9TTtfcVW748RedyQg/mOQw+36ezvyd5jtZmRdGY83lkCpwFMP5QOETRAtrrEC2rSC82etnfbWhhpELo1bBNctanAd8QNejRIr8sctgXVpvYBkp/xMQ9xkucZ/3Lee5+qzULif8nspaSH5Ou0A9IV+u/wgyj4ItvxSsb/tgSZEBMESX9K5tTdGs48vaPfcFk2h8hRXE3mNSB3W96n8WiNbBQJ0+Bxsi4oQ3b2Sf6vDAAAAAAAA"
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">Web Development</div>
                      <div className="navbar_dropmenu-link-text">
                        Front-End &amp; Back-End Development
                      </div>
                    </div>
                  </a>
                  <a
                    href="/services/mobile-development"
                    className="navbar_dropmenu-link w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,UklGRigDAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSJgBAAANoJpt2/Ovua6XBbA4HKqzACuwQcd2sAzQLS5RWQMX1UaIaqpH8rvE7/sdR773TZMRMQH893x55ew+n32+1zv2vvXz451ubYVAbiSQSfLo/U5njxJJTsppmVQEaWQYJjaYN5MYCCIIycRiYoKcNCAnAURMkoSEhJxm05QGIBgNps0jTAQSEMlZBMhGIJiQIPMGAxsJMQCSmWUzAdmUcB4SECDzKI2JhUBITDAg5zk2wNIEQeYWAwWEZEUpCURygVAQkmRBOSmNVgiEhAauIAQDEJKmI5EEUrDpBBBSQmw2GhwbGisahiBIzocAaQK0ADQyJXQNMBNJW0EabMqqAiHkIpuSsmoiEK4ihLK2LC65Fsj62VJpLiUNWglk/Zaz1dZvOVvtf++PN3b7bq/HD8/v9Mvtvb69efGV5JYiwkCQwYsv2f+rCzUObsSxZprxExMmZkBSCIEh6Qwnk2M70CglYCZLjo1PAwLsjxl+4FwIyEHIRgcPgn3/5wy8eSoHAYxGfjpDHPDgB6b8+MWD6yRAGhhpffWBvxBWUDggagEAAFALAJ0BKkAAQQA+bS6SRaQioZgKbgBABsSgCD9V3zL9q7cBvPXoAfoB1swQ4ZV2sGDK3qtmxo7MosQFhVWxfkcNPf7ELlzK1x7JSWlVsbLZlm1a9wQM1owtqZZYIdPfMy7UAAD+/Tct/6n8dE/0j3+0lmwQ2IMP8UoyTwpo5f+LtXsly4TW6VDDgT+838pxelfvtMzp2///JS2yTC1k2vFH3/AACcAwK5mp9sq3dmKKIvX9OPdi9IL2vTuoSAmY3BInGz9XAraWbPmhZD2qjfSWUIxnFjoyLHUE3BlM8Q/gYXg3/PdpVwPeFR/w7EA7kg+r6FLL8kE6C6xdXpWtE/rQXJhByJipNnRRbSoLnR6T8bBH31UNCEJXfpG5gLaGMTUSvusAw4rdbBlWHJiGdUlA0JNwJQOTrpIv6sO4hmMfWWYt85TP1lkwJj6jSd3O/+tEX53EKJP/miL87gKlkjQI6P+7syq4AAAA"
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">
                        Mobile Development
                      </div>
                      <div className="navbar_dropmenu-link-text">
                        IOS, Android, Cross-platform
                      </div>
                    </div>
                  </a>
                  <a
                    href="https://case.abbble.co.za/services/devops"
                    className="navbar_dropmenu-link is-hidden w-inline-block"
                    tabIndex={0}
                  >
                    <img
                      src="data:image/webp;base64,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"
                      loading="eager"
                      alt=""
                      className="navbar_dropmenu-icon"
                    />
                    <div className="navbar_dropwmenu-link-text">
                      <div className="navbar_link-title">DevOps</div>
                      <div className="navbar_dropmenu-link-text">
                        QA, Manual testing, Engineering
                      </div>
                    </div>
                  </a>
                </div>
              </nav>
            </div>
            <div
              data-hover="false"
              data-delay="250"
              data-w-id="1597cced-062b-7e8d-be80-6dd33e03e7e6"
              className="navbar_link-main w-dropdown"
              style={{ backgroundColor: "rgba(249, 249, 255, 0)" }}
            >
              <div
                className="navbar_dropdown-toggle w-dropdown-toggle"
                id="w-dropdown-toggle-3"
                aria-controls="w-dropdown-list-3"
                aria-haspopup="menu"
                aria-expanded="false"
                role="button"
                tabIndex={0}
              >
                <div className="navbar_link-title">Industries</div>
                <div
                  className="navbar_dropdown-toggle-icon w-icon-dropdown-toggle"
                  aria-hidden="true"
                ></div>
              </div>
              <nav
                className="navbar_dropmenu w-dropdown-list"
                id="w-dropdown-list-3"
                aria-labelledby="w-dropdown-toggle-3"
                style={{ height: "0px", opacity: "0" }}
              >
                <a
                  href="/industries/web3"
                  className="navbar_dropmenu-link w-inline-block"
                  tabIndex={0}
                >
                  <img
                    src="data:image/webp;base64,UklGRrwEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSDcCAAAB8Jdt29822rYJgiEIwjAYM5hhkDDoMEgZtAwSBoVgCGUwgmAG2/rHeVpS3Jnrx38RMQHL/7cv37fb+gtd3u7wvj7Xl63tZXLdzO9vz/QteFuW326IyPbyNKv59ZtpCG7rk2yzPM403tdnePW4Iakgtr8+b932jEgo4/byWe/2mNcwj/f1U1b7a5imSfi2fsK2K6JCEUS2l9NetUchgyLz2K7n/Hl3NGPlYQ94O2VzNA+LCkJwPWF1PEVlGg3E6wk/T0DZnaHOeXVmNCJkjFMum04gY2UepU54c5KUaMgYjq2okxgQytixH5SzyrwYopcDr0ipQ0gpMmY8svnUQkWTktd9bzQUnSCSUFQOrGRvZxQVhDrw8ajQCdPsjHb9RmZOz7SQcddPCEl0Qo8IdWAjnx1lrDjyBXoQnTSWMe1bfnrGJk667kmpdlUkY4McWD5SE4S0Q5rkYenA5W5njiYyDYkcWL5qR2jPPIIoHFo2n5pCDUEdupbohCSPM00vR5Yf5h2SoSZE1B+H1vuu2kMVKhFiPbS8zZC9kTGPk/tfy/HLJhTqQB431G1dzrySx4Um01AZbr8vJ9/sTJlX8rjuX5bT17tqIrsbEny/LJ/4BiXtaSjT27p86mUjBj1SQmy/L599RcnumLh/XZ7wVqFdiPp+WZ5xtfN+/XhEt+vypG+E+Los649Zf/+xPO1lg9iW8XXD/etleeI/B7xMluX19n1dnvs2eV9+3csHPi6/0LJcrpflv2oAVlA4IF4CAABQDwCdASpAAEEAPmEmkEWkP6GZnK99+AYEsQBjjoMx5R09uhdru8gYCh9gH6AHe/3umXYchJV1jdtaI0stbC1c7PG9JByLrjDXgFNWfWqI3L0k1qcD8EEDGaF2GNqj7n7KqepByh9hHcZVegSY3KHRP4aWNJRf/biXnbb/7Hoe2r6OgAD+IhH/1CLECI4f1Owv4W9GMB4fCTIzMmqSVJyPJVyf3t6Bd/3/8KBN05vB3+e5t2zx9Nd8seWKlgJk1z+70AvP9Ffy3ic37n1s9ah4DFjaW0H+fE0613EhQUhTfpbFIWH0v+qGHpvUF5sXgMm6wQthbVhpcpxsAuAfqtOED3pHIUZoh507kg/pr2A6VWidpeMyeE9fksb2zwDVr6h5IOaADkNXoflgFANrZYwwZfa2sP77xePKxuA7SeFbW2BM1tT0HPG1xmpgxLe6TOLhW6GxJY134/4Wxv0EBKhqdNCGSTFywQ3lbTN/5xwUxecw9TZvRJM0GnrSEsNlOd2XJ8mzMu2aOBZlL0LSrSJos5wKAmpIPPsRUP5YT8cmwLaWZGuq3WhaODLPFgjPrPHAUJXOga4pEwHbswNvGUsG5waE7kod3GtrtBOfl7H8yiU25gTwNWpaRYX3GUsfVFAlPRjioNh3aW/w+eQRctlx5dfW/aVDXxgX94B+CrpfnLA/xtCHbakkRfwQnvhnllSX4Zonf+dVBpMZpqxfslomFKo4uIRYP+w6sL0hdDIDUiAJagt8RQM9f/ycJ2kp1kutKmvzCe83nZQZjoBCX+sy7fFwz/cWKzUcPduAAAA="
                    loading="eager"
                    alt=""
                    className="navbar_dropmenu-icon"
                  />
                  <div className="navbar_dropwmenu-link-text">
                    <div className="navbar_link-title">Web 3, Blockchain</div>
                    <div className="navbar_dropmenu-link-text">
                      Crypto, DeFi, DEX, CEX, NFT
                    </div>
                  </div>
                </a>
                <a
                  href="/industries/saas"
                  className="navbar_dropmenu-link w-inline-block"
                  tabIndex={0}
                >
                  <img
                    src="data:image/webp;base64,UklGRrQDAABXRUJQVlA4WAoAAAAQAAAAQAAAQAAAQUxQSPgBAAABoJVt29i2EYRAEIRAMIOOQcqgZZAyaBkkDFoEEwRDEIOFwXMf/L9lOTvrUURMwPI37vrt947r9m39f1w2R68vn2/d3HtdP9nlw/0f/3yqF+e+fKJnZ18+zbqf9rE+bP36623btqvzt8esrx8+4eUB62ZMQ522nfcKGSuPfDpp3aTcLKqTvp6z7oIUlWnn/Dpl3R0shzvjzxlPu9vRiJAzr2f8RGjIWJl3337X0/qKBoOUaMiJ26HL6/ZhXlIGBoSapFl/Dlw2dxZNyrwYoqTyeuPpN0rVDJmmFBlzO7rM1t3BSWSaQkV3hH2ZrrtpkcNJIglFdeBtsu6ONxSRSFFBKIJ9nbw73pBpDuZgRPFjGS9OrYwRmRZyM9sy3e5quF3oFqEQ+zpZnd4gEWWsiLAu0+8npaQDYxkT9LZOtpPGjBmbOIbX4XpKCKIiGRtkLN6WZXFyxkSa5GbJzZ/noZJEpiERNXFZPs47HkGU4/8u+2lFkxRqCGqS9PR+mpQktzPNpKgv38+bZ6gJEZV5Xp4eRRUqEUIq9G3ZHhIZczs5GF+W58fldkORZOx5WX494naoHFGkfVmW5fqQSm6XMdPkZVj3R6AhmSaJYF+m6/VR5c4K6mOdLcuPhwihG5XIf8/LwfX9UYiQhNrW5fjT1/dt/8zb62X56xhWUDgglgEAAJAMAJ0BKkEAQQA+bS6URaQiohZrNiBABsSgZwDW0Hc/8TG0N2+PPt6YBz6Psh+SAEQ3698UWg3iTPShlb04AzG+jTaQFp+4fjGcniYwMq80czfEGMuaK023nS8VhUPzwH4gWfLhYlchJqBC+KAA/vz4Q5f3lo8zVrTV/yZjvHTNRak4W/+lSDPyF3xuJLjfqgkZS4TUNLdzE9e+q7XxLpqfAqbg4+gsz9jt/orLVaAv+NzvFw8nkWYXgrjHlGsR2eN1ZCP///HHxc8yrCVbabRA5x9JdoJxjAV29ZxU6IgsU34AYCEwS50RR0GjRtKMdw74zoi3ATjfqa6az3jFQm3sPE6Av8h1Xhn+GZOaYoNKSch2WntT93ljyFFkYkNSepqAokiITqCn2WBPgrZs1NjPE9F87yRvNpmN49zXu38ZVKjjxpfnBgRmAE8U1TiBf9mmNGNJWdMvbWKr2zog2zx//R2n//9ZQUDn3hKUP2aOCe1Gh4huhugYOpD9j/8D+BOkehy0sohFa/8kArjq7IvvAAAAAAA="
                    loading="eager"
                    alt=""
                    className="navbar_dropmenu-icon"
                  />
                  <div className="navbar_dropwmenu-link-text">
                    <div className="navbar_link-title">SaaS</div>
                    <div className="navbar_dropmenu-link-text">
                      CRM, HR, AI, ERP, Automation tools
                    </div>
                  </div>
                </a>
                <a
                  href="/industries/ai"
                  className="navbar_dropmenu-link w-inline-block"
                  tabIndex={0}
                >
                  <img
                    src="data:image/webp;base64,UklGRlgEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSAkCAAABkFXbtt02giAIgmAIYhAzsBjUDBwGMQObQSAIQhj0MqgYrPVxjq6u5L6/ImICuv9Y+2+fRb8e51c5L66W8SVuVt9e4ObG6+FGty7D0com54ONNuyPdW8xHWtucX+5x8sAyf1QU1HIFEJ5O84wmyIoYP7oDzIuVoLVZTjExUqUqKJiOR3goopKwAiYL6fdhkUlGEQQJaBl2KkvooIIBg0qKs47PV0HJQFzULzuMihkKqYIgmJc+j2eaoJiiqACSvB9h8HNiIgiooIufbtnQgBFEUVQQBW9tisVmGIlVs7NTtYCRhTFFFRc+lZT1TqorCkqp1b3LQQRRcEI6KXVZxWCSEUEI+9tzp9LVcSIkcSsPM7bxuJmVFFAESNBtAwbbm7GiCiS4CqoXqpuNgVERDFFRczPFYP7o6iirC392twGlARBhYCV95XBxggi4jrWL312bZVjgERR1hyzZzOCAqiAKNZes7mZimLEdWres+duuE5g20dApU2KCpigKPiWjSo2B8R1MGI6ZP0PlQBbMBIQU0REmbvVqyk2JYAbAfWy1s0CRrYJoqKyAoj3rnIomglb0ERFURHRuaseHiKpn0udikL4XlSifnRbL7OKzmM3lC2Kce676QvRZR67hv04Tee+i1OpQQjl3MVhnKax73YfplIT50t3+PE+L0F/zLexe9FhHMdT3/3lBgBWUDggKAIAADAPAJ0BKkAAQQA+bTCURqQjIiErNJsQgA2JZADFC9qQz8RhH28o3W3V54rTQN5Jv00OZoYKgOeLSy4HcwkwSX4Gatdb8cXp8PTvNpoMmMsnbUSYO5gU/czcNf2Nv0y6yT8qBWUF7Mc8o636TdwUYJD7jsa7VMuzNzH1g2fLJ2CGeUAA/v5HgMT3nVg+Ah0IeQub25m2Q/FMMBj/wWJn5LNnfhzXPL6FZww93G1C/ThZ7Z4NzlfZUkb/zFK3K43/9pv/dIS7gCF12PP0zjz539wftfjApur9+vb0EhJb2pwtIYuhgE1YIzud8rM/t6/NyfSf1uEbh1RVABZAbo+kiocPnX/bLeGxaGru/rLzhcp1noZzcCNH9JuRuAA2YPodK32URtJS8uWbUjALrCAPBI3u1fcrCpkjWEN2Z+Dg6b7fTEodCyOOpVb5G/Cy9d/aUnE7PYlHR3z12wNBfQL0ohj+ip+f0bBPsLXOOJ5T9jnrww7JGXtXx7qHVx4hhNY/KT+pUxclmJe9uRkGx0O7XXwAougdpdkK2m4nkVPGnD1pD2g3qKsuOLT9dMIMH6p39f/H5Kp//DgUdpJUvWzPVnmCpYSbCwf/qDzWDtNc/bcwaMph2nsGy2cDIp6unhbczMDbPSn/biIwMgvYfUqhvXDWlvBuUr1Fm0AO7mds0G4zFdkgJueG0aKu3/fzva7/1+OlHq09rIDul8rWQ04uMx/dL5uKsrAAAA=="
                    loading="eager"
                    alt=""
                    className="navbar_dropmenu-icon"
                  />
                  <div className="navbar_dropwmenu-link-text">
                    <div className="navbar_link-title">AI &amp; ML</div>
                    <div className="navbar_dropmenu-link-text">
                      Analysing tools, Chatbots, Crypto
                    </div>
                  </div>
                </a>
                <a
                  href="/industries/healthcare"
                  className="navbar_dropmenu-link w-inline-block"
                  tabIndex={0}
                >
                  <img
                    src="data:image/webp;base64,UklGRmAEAABXRUJQVlA4WAoAAAAQAAAAPwAAQAAAQUxQSCYCAAABoJZte942EwRDEIRCMIQwSBhsDGIGDYOEQSEEQiCIwczgun48j2XZ7+fPiJiA8n/5dHt+mrb34zL9Fea33c96tvp297Oe6rI6sM0nujv4epq7w68nmT3w6xS1HdGmM7w8dDlB9dh1Ou51kMtx7ai27+t2u11qx+zhta8+VtPPdeP3cbee6duIou2SvAIc8eiozV70Ht5BUGDMc6s2QQRU0fZYHqsKmDLkvTE1g7gX7OaAlyoodKFEFRUHPrOqgiBGVAJGwBwFQSDcsx9VVIwEgwiiBIzYyZxUEwKoIIJBg4oKRiRxSm4B7AclAXPQgIIIPyV9J4IAmYopgqC4F6/ZGrYTFFMEFVAyJGAr6eQmKHYjIoqICgGzS1a3cgIoiiiCAqqooOij7AKVgCl2YieK8ikDHIiimEKStzpARNmBypaigvqppXPdGoooCkZA0e/S/elB6UA6IhjxPZf+R89IjCTG9Xsue+cDcC9qLfundQAJjvyUkcuAwahch9QuVNiFooqtjH31xABbCCqE+6C6doExQcRtbGX00iWEHAMkeh1WPjsIBAVQAXmW8XXtUTFFMWJs9YBy60JRNnD7qxy69AiykaLCr3Lwq0cQUQExXcrhr54cIwHv5YSvHaASQJdyyldfDqLey0mXPlQ0LOW0Sx9GXK/lxHPr2G61nLp+NhAFf6Zy9iXL//wuf8HaMvRdy19zydZf5S9bf9SfWv7Kl2Uu/4kBVlA4IBQCAAAQDgCdASpAAEEAPmEokEWkIqIZnf78QAYEoA0I3Avu8mOwf5DedDZ2HfVDt1eeG00/eZwooz3U2kkQQ6s2asv8oIihCqZBGrc2Z064Q0jbz06dBSelEzSqLFcDwd9j52Up0uGz4sE6GA5KP/Vwa5n8J10TdFSWaVGAAP79tO5v+bkB5VsbToT2PMcH2EAqdGHvvqoO7oOzJ7qav2ko+sN24nzF+Mg/2Nzc6R4llrXT5Nfr22Bf5OSOMsh6TbyTETJeY/RQePLlT5f169en166Nj7065GdR8//3Bz73pY8ia2A78KXi+2gHhdUuDvlnkNPckPnmHOOsqIQ0fsHKjL0s0W8l9ZlJOv0SZutJfyFED2hU2RdBOFuacKYTT2tNLC01uwku8oZ/f4D40wzyHQ3plnEVoVs9Mp16gT/Wetd5oLzBhnba1RIn7lCH7Ci0/zhNyiJWVaNRzRAnV3Wex6bacGNyyYBdBMfkDUBV2oi7oAZAf6tLeoTP1PQ4cJhbFfRTt16zQ6WAU3DNYvtDZ5mP40qIeECvuQibzWKUV6YYy1jlqxMNfZgf2A+75CiVm0K/4FEb4wOp5xRuGbbj+l9Z9CoaC476bhrc3tl2FlVl+dUf/39E5Fooxdnj6uYOxv/g5qpW4C5P0ZpXJem4Xd6aCTbe0DbvOWDC43Z/S3/yLYZcZLPd7VwwJw+zqf8UjIHwAAAA"
                    loading="eager"
                    alt=""
                    className="navbar_dropmenu-icon"
                  />
                  <div className="navbar_dropwmenu-link-text">
                    <div className="navbar_link-title">
                      Healthcare &amp; Wellness
                    </div>
                    <div className="navbar_dropmenu-link-text">
                      Mental health, Insurance, Fitness
                    </div>
                  </div>
                </a>
                <a
                  href="/industries/fintech"
                  className="navbar_dropmenu-link w-inline-block"
                  tabIndex={0}
                >
                  <img
                    src="data:image/webp;base64,UklGRlgDAABXRUJQVlA4WAoAAAAQAAAAQQAAQAAAQUxQSHIBAAABoFTbtmy3+RA+BEEQA4uJzSBhoM/AYWAzCYQwkCCYwZqNc1/hp9StiJiA23+Y9+eXK9/PuH918dcTvrv8r4eeXf/H/ciXD+D5T+Dl/0z3p/UvH+erj7z4YlmiRYi0SBvRGd8JQmbDkBKNzE7JolEoKYOBUGZatbEs+4sWZV2slFQOKFUrZJlSZDaW0b7tRWSZQkWLaAR7GkV2J4kkFFmP9uxuFJFIUUEQWR4qNLLMzuyPOsfOyozI3sY8JYnGdjmYzSyPHG5I+9QidFI0UtKqVZkJGp9O2J+Z2cK+2f1YSoUgCsnezOLb7RhCMhNjtlWy/P3plGxX0o518uPxeLw+Ho+X2/qIUE5sRHm/HT00R9EihRpxhTJTkmxn+fbz1Fhn1ILI+wXUaFCFSoS3K5BlZGY7vV9DtJHtRpfRxs4sryQ5+zrolHShQlTtwYXWJYQ23i4UYoEIXUpm1AiqPw69/IztrFPyeuj29Nu3i3++/d8RVlA4IMABAADwCgCdASpCAEEAPmUqkEWkIqGYW7eoQAZEoIcAGGT4x4C/aqFzT95MwDLxfExLhuxOpQt5pHsXvcInMYNOJMYg9uz51R2GkTHCTswMTf67FWDR7nymT/rxc0H3n9IbbAAA/v7Na+Y2OKcltmLUBc2PJ1m6ejp8Ob037//JOtU7O9RXzOoljqrIgWkHRqHfsYOw+LVLV8IiWfco8slxrMmd/vKqhvRDu2Sa3clLgrWamMByELMorDOqhqUb16mPv8KXwuzn4xviCu52pLdm+LMXnOkzrq4qoD347FdN+mzGlpVxsOGTMx7asSSKX1FZXqmhsBtui85LtuusA5egH2tjXl1UPWyx6uFzMQ4XmZbAQKNk0Zu7Z9GS8flOOMIS6QS9nusrrveIuKTh7/BFnW7ippQW4IREWk81mCsFue3WeTkogLkW92rJFwR6ssva3isNIT1ve5AuKBDbb8BI2a+rHT9OmSsgmMDGIC6o4TH5A75WHch2QiTWxp2DP+JbKwICimUEt54qcFJBltfTWVmVEauTQ257+XXaLf32KGkNtQek/GX///IAdzXuw8C7Oys5cDXO7+G7dq4UYjoAAAAA"
                    loading="eager"
                    alt=""
                    className="navbar_dropmenu-icon"
                  />
                  <div className="navbar_dropwmenu-link-text">
                    <div className="navbar_link-title">Fintech</div>
                    <div className="navbar_dropmenu-link-text">
                      Banking, Digital Payments, Exchanges
                    </div>
                  </div>
                </a>
              </nav>
            </div>
            <a href="/about" className="navbar_link-main w-inline-block">
              <div className="navbar_link-title">About</div>
            </a>
            <a href="/blog" className="navbar_link-main w-inline-block">
              <div className="navbar_link-title">Blog</div>
            </a>
            <a
              href="/resources-courses"
              className="navbar_link-main w-inline-block"
            >
              <div className="navbar_link-title">Resources</div>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
