import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function ContactCta(): JSX.Element {
  return (
    <section className="section_services-page-contact">
      <div className="w-layout-blockcontainer container w-container">
        <div className="services-page-contact_main">
          <div className="services-page-contact_card is-v-1">
            <h2 className="heading-style-h2 about-p-contact_block-1-heading">
              Want to join our team? Send us your CV.
            </h2>
            <div className="about-p-contact_block-btn-wrapper">
              <a
                href="mailto:recruiter@abbble.co.za"
                className="button w-inline-block"
              >
                <div className="button-arrow is-solution-page-arrow">
                  <div className="code-embed w-embed">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 36 36"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.99805 9.00098L26.998 27.001"
                        stroke="#141515"
                        strokeWidth="2"
                      ></path>
                      <path
                        d="M8.99203 26.9923H26.9922V8.99219"
                        stroke="#141515"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div className="button-text-wrapper is-solution-page-button is-flexible">
                  <div>Send us CV</div>
                </div>{" "}
              </a>
              <a
                href="https://djinni.co/jobs/"
                target="_blank"
                className="about-p-contact_dou-btn-wrap w-inline-block"
              >
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTE0IiBoZWlnaHQ9IjQ3IiB2aWV3Qm94PSIwIDAgMTE0IDQ3IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB4PSIwLjQ2NTEwNSIgeT0iMC42NzYwNDIiIHdpZHRoPSIxMTIuNjAzIiBoZWlnaHQ9IjQ1LjExNTciIHJ4PSIyMi41NTc4IiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIwLjQ2NTEwNSIgeT0iMC42NzYwNDIiIHdpZHRoPSIxMTIuNjAzIiBoZWlnaHQ9IjQ1LjExNTciIHJ4PSIyMi41NTc4IiBzdHJva2U9InVybCgjcGFpbnQwX2xpbmVhcl82MzM0XzgzODQ2KSIgc3Ryb2tlLXdpZHRoPSIwLjkzMDIwOSIvPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfNjMzNF84Mzg0NikiPgo8cGF0aCBkPSJNMjkuNzc5MyAxMy44NjEySDMwLjE1MjZDMzEuMTM5MSAxMy44NjEyIDM0LjQ0NTMgMTMuNzgxMiAzNS42NzEzIDEzLjc4MTJDNDMuMTM2NCAxMy43ODEyIDQ2LjE0OTMgMTguMDczOSA0Ni4xNDkzIDIzLjAzMjhDNDYuMTQ5MyAyOC4yNTg2IDQyLjU3NjkgMzIuNTc3NiAzNS40NTggMzIuNTc3NkMzNC40NzE1IDMyLjU3NzYgMzIuMDE4NSAzMi41MjQyIDMwLjIzMjYgMzIuNTI0MkgyOS43NzkzVjEzLjg2MTJaTTM0LjA0NTMgMTcuODYwMlYyOC41MjQ4QzM0LjYwNTIgMjguNTc4MiAzNC45Nzg1IDI4LjU3ODIgMzUuNTkxMyAyOC41NzgyQzM5LjI3MDggMjguNTc4MiA0MS42MTcxIDI2LjU3ODkgNDEuNjE3MSAyMy4wMzI4QzQxLjYxNzEgMTkuNTkzNyAzOS4wODQxIDE3Ljc4MDcgMzUuNjE4NCAxNy43ODA3QzM1LjE2NTIgMTcuNzgwNyAzNC41Nzg2IDE3Ljc4MDcgMzQuMDQ1MyAxNy44NjA2VjE3Ljg2MDJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNTcuMDM2MiAxMy41NDFDNjIuNzE0OSAxMy41NDEgNjYuOTU0MyAxNy4yNDcxIDY2Ljk1NDMgMjMuMTkyNUM2Ni45NTQzIDI4Ljg0NDUgNjIuNzE0OSAzMi44NDM5IDU3LjAzNjIgMzIuODQzOUM1MS4zNTc1IDMyLjg0MzkgNDcuMTE4MiAyOS4xMzgyIDQ3LjExODIgMjMuMTkyNUM0Ny4xMTgyIDE3Ljc3OTkgNTEuMDkwNSAxMy41NDEgNTcuMDM2MiAxMy41NDFaTTU3LjAzNjIgMjguODQ0NUM2MC41ODI0IDI4Ljg0NDUgNjIuNDIxNyAyNi4zMzgyIDYyLjQyMTcgMjMuMTkyNUM2Mi40MjE3IDE5Ljc3OTYgNjAuMDQ4NyAxNy41NCA1Ny4wMzYyIDE3LjU0QzUzLjk0MzQgMTcuNTQgNTEuNjUwOCAxOS43Nzk2IDUxLjY1MDggMjMuMTkyNUM1MS42NTA4IDI2LjM5MiA1NC4wNSAyOC44NDQ1IDU3LjAzNjIgMjguODQ0NVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik04My43NzgyIDI0LjgxOTJDODMuNzc4MiAzMC41MjQ2IDgwLjE1MjYgMzIuODQ0MyA3Ni4xNTMyIDMyLjg0NDNDNzEuMzUzOSAzMi44NDQzIDY4LjAyMTUgMzAuMDk4IDY4LjAyMTUgMjQuNjMyNlYxMy44NjEzSDcyLjI4NzVWMjMuNzI2MUM3Mi4yODc1IDI2LjYzMjMgNzMuMTY2OSAyOC44NDUzIDc2LjE1MzIgMjguODQ1M0M3OC43Mzk0IDI4Ljg0NTMgNzkuNTEyNyAyNi45NTIzIDc5LjUxMjcgMjMuOTY2NVYxMy44NjEzSDgzLjc3ODdMODMuNzc4MiAyNC44MTkyWiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzYzMzRfODM4NDYiIHgxPSI1Ni43NjY3IiB5MT0iMC4yMTA5MzgiIHgyPSI3Ny45MDU2IiB5Mj0iNTUuMzM5MyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwLjQzIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0id2hpdGUiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzYzMzRfODM4NDYiPgo8cmVjdCB3aWR0aD0iNTQiIGhlaWdodD0iMTkuMzAyOSIgZmlsbD0id2hpdGUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI5Ljc3OTMgMTMuNTQxKSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo="
                  loading="lazy"
                  alt="Dou"
                  className="about-p-contact_dou-image"
                />
              </a>
            </div>
          </div>
          <div className="services-page-contact_card is-v-2">
            <h2 className="heading-style-h2">
              Want to create amazing products together?
            </h2>
            <a href="contact" className="button w-inline-block">
              <div className="button-arrow is-solution-page-arrow">
                <div className="code-embed w-embed">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.99805 9.00098L26.998 27.001"
                      stroke="#141515"
                      strokeWidth="2"
                    ></path>
                    <path
                      d="M8.99203 26.9923H26.9922V8.99219"
                      stroke="#141515"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
              </div>
              <div className="button-text-wrapper is-solution-page-button is-flexible">
                <div>Get in touch</div>
              </div>
            </a>
          </div>
        </div>
      </div>
      <img
        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjA3NCIgaGVpZ2h0PSIxODA5IiB2aWV3Qm94PSIwIDAgMjA3NCAxODA5IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBvcGFjaXR5PSIwLjciIGZpbHRlcj0idXJsKCNmaWx0ZXIwX2ZfNDk5MF83MDc1KSI+CjxjaXJjbGUgY3g9IjY1MCIgY3k9IjExMTUuNyIgcj0iMzMzIiBmaWxsPSIjMEY0QUQyIi8+CjwvZz4KPGcgb3BhY2l0eT0iMC40IiBmaWx0ZXI9InVybCgjZmlsdGVyMV9mXzQ5OTBfNzA3NSkiPgo8Y2lyY2xlIGN4PSIxNDAwLjUiIGN5PSIxMTI4LjIiIHI9IjM1Ni41IiBmaWxsPSIjMjA2N0U4Ii8+CjwvZz4KPGcgb3BhY2l0eT0iMC43NiIgZmlsdGVyPSJ1cmwoI2ZpbHRlcjJfZl80OTkwXzcwNzUpIj4KPGNpcmNsZSBjeD0iODMyLjUiIGN5PSIxMTcyLjIiIHI9IjI0Mi41IiBmaWxsPSIjRjU1REY2Ii8+CjwvZz4KPGRlZnM+CjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZl80OTkwXzcwNzUiIHg9IjAuMjg4ODc5IiB5PSI0NjUuOTg4IiB3aWR0aD0iMTI5OS40MiIgaGVpZ2h0PSIxMjk5LjQyIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9InNoYXBlIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjE1OC4zNTYiIHJlc3VsdD0iZWZmZWN0MV9mb3JlZ3JvdW5kQmx1cl80OTkwXzcwNzUiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjFfZl80OTkwXzcwNzUiIHg9IjcyNy4yODkiIHk9IjQ1NC45ODgiIHdpZHRoPSIxMzQ2LjQyIiBoZWlnaHQ9IjEzNDYuNDIiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0ic2hhcGUiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMTU4LjM1NiIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzQ5OTBfNzA3NSIvPgo8L2ZpbHRlcj4KPGZpbHRlciBpZD0iZmlsdGVyMl9mXzQ5OTBfNzA3NSIgeD0iMjczLjI4OSIgeT0iNjEyLjk4OCIgd2lkdGg9IjExMTguNDIiIGhlaWdodD0iMTExOC40MiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxNTguMzU2IiByZXN1bHQ9ImVmZmVjdDFfZm9yZWdyb3VuZEJsdXJfNDk5MF83MDc1Ii8+CjwvZmlsdGVyPgo8L2RlZnM+Cjwvc3ZnPgo="
        loading="lazy"
        alt=""
        className="services-page_contact-bg-1440 is-about-page"
      />
      <div className="section-separator"></div>
    </section>
  );
}
