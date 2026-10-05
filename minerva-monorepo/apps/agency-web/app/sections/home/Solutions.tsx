import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function Solutions(): JSX.Element {
  return (
    <section className="section_solutions">
      <div className="w-layout-blockcontainer container w-container">
        <div className="solutions_main">
          <div className="solutions_title-wrapper">
            <h2 className="heading-style-h2 is-large is-centered-on-mob">
              Our Solutions
            </h2>
            <p className="regular-text is-l is-centered-on-mob">
              Whether you need to design your first MVP to get funding, redesign
              your product to improve business metrics, or get a remote design
              team to grow faster - our product designers are here to help.
            </p>
          </div>
          <div className="solutions_cards">
            <div className="solutions_card is-first">
              <div className="solutions_card-top">
                <div className="solutions_card-label">
                  For <br />
                  startups
                </div>
                <div className="solutions_card-icon-wrapper">
                  <img
                    src="data:image/webp;base64,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"
                    loading="lazy"
                    alt=""
                    className="solutions_card-icon"
                  />
                  <img
                    src="data:image/webp;base64,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"
                    loading="lazy"
                    alt=""
                    className="solutions_card-icon is-hover"
                  />
                </div>
              </div>
              <div className="solutions_card-middle">
                <h3 className="solutions_card-title">MVP Design</h3>
                <p className="solutions_card-text">
                  Create a digital product, attract investors and new clients
                </p>
              </div>
              <a
                target=""
                href="solutions/mvp"
                className="button fill-black arrow-button w-inline-block"
              >
                <div>Explore</div>
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
                      stroke="white"
                      strokeWidth="2"
                    ></path>
                    <path
                      d="M10.8335 18.5L18.8335 10.5L10.8335 2.5"
                      stroke="white"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
              </a>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQyIiBoZWlnaHQ9IjMxNyIgdmlld0JveD0iMCAwIDQ0MiAzMTciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0NDEuMzMzIiBoZWlnaHQ9IjMxNyIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzgxM180ODY5KSIvPgo8cmVjdCB3aWR0aD0iNDQxLjMzMyIgaGVpZ2h0PSIzMTciIGZpbGw9IiNERkNGRkYiLz4KPHJlY3Qgd2lkdGg9IjQ0MS4zMzMiIGhlaWdodD0iMzE3IiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXJfODEzXzQ4NjkpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfODEzXzQ4NjkiIHgxPSItMjgyLjYyNiIgeTE9IjI4NS4wOTEiIHgyPSI1NDguMDMiIHkyPSIzMTYuNTgxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNDN0FDRkYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSJ3aGl0ZSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfODEzXzQ4NjkiIHgxPSItMjgyLjYyNiIgeTE9IjI4NS4wOTEiIHgyPSIzODMuNzI2IiB5Mj0iMjk4Ljk4MSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjQzdBQ0ZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0id2hpdGUiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K"
                loading="lazy"
                alt=""
                className="solutions_card-h-bg-1"
              />
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQyIiBoZWlnaHQ9IjMxNyIgdmlld0JveD0iMCAwIDQ0MiAzMTciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF84MTNfNDkzOCkiPgo8cmVjdCB3aWR0aD0iNDQxLjMzMyIgaGVpZ2h0PSIzMTciIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl84MTNfNDkzOCkiLz4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZl84MTNfNDkzOCkiPgo8cGF0aCBkPSJNLTE5NC40MzggMzYyLjUyNkMtMjU1LjkxNyAyMzEuMDE0IDEzMC4wNzcgLTQ1NC45MyAyNjAuNzg3IC01MDkuMDRDNDE0LjY5NyAtNTcyLjc1NCAtODMuNDMyNiAtMTU5Ljk2OSAzODguMzMyIC0yMDcuOTg4QzQ0OS44MTEgLTc2LjQ3NjcgMjcwLjcyNSAyNDEuNjYgMTQwLjAxNiAyOTUuNzY5QzkuMzA2MDUgMzQ5Ljg3OSAtMTMyLjk2IDQ5NC4wMzggLTE5NC40MzggMzYyLjUyNloiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcl84MTNfNDkzOCkiLz4KPC9nPgo8L2c+CjxkZWZzPgo8ZmlsdGVyIGlkPSJmaWx0ZXIwX2ZfODEzXzQ5MzgiIHg9Ii0zODguOTQyIiB5PSItNzAzLjY2MiIgd2lkdGg9Ijk3Ny42NjMiIGhlaWdodD0iMTMwNy45MiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSI5My45NjAzIiByZXN1bHQ9ImVmZmVjdDFfZm9yZWdyb3VuZEJsdXJfODEzXzQ5MzgiLz4KPC9maWx0ZXI+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl84MTNfNDkzOCIgeDE9Ii0xOC4zNjExIiB5MT0iLTkyLjc0ODQiIHgyPSIyNzEuNTcxIiB5Mj0iMjY5LjcyNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMDAzQkZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzA2MEYyQiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfODEzXzQ5MzgiIHgxPSItOTMuOTY5OSIgeTE9IjM3Ny4xNDciIHgyPSItNS4wMzgzNyIgeTI9IjE2LjEyMDQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agb2Zmc2V0PSIwLjM4NTQxNyIgc3RvcC1jb2xvcj0iIzJDQTBGRSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRTJDRkUiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzgxM180OTM4Ij4KPHJlY3Qgd2lkdGg9IjQ0MS4zMzMiIGhlaWdodD0iMzE3IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo="
                loading="lazy"
                alt=""
                className="solutions_card-h-bg-1 is-hover"
              />
            </div>
            <div className="solutions_card">
              <div className="solutions_card-top">
                <div className="solutions_card-label">
                  For startups
                  <br />
                  &amp; existing companies
                </div>
                <div className="solutions_card-icon-wrapper">
                  <img
                    src="data:image/webp;base64,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"
                    loading="lazy"
                    alt=""
                    className="solutions_card-icon"
                  />
                  <img
                    src="data:image/webp;base64,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"
                    loading="lazy"
                    alt=""
                    className="solutions_card-icon is-hover"
                  />
                </div>
              </div>
              <div className="solutions_card-middle">
                <h3 className="solutions_card-title">Product Redesign</h3>
                <p className="solutions_card-text">
                  Get a fresh look, improved user experience, or enhanced
                  functionality
                </p>
              </div>
              <a
                target=""
                href="solutions/product-redesign"
                className="button fill-black arrow-button w-inline-block"
              >
                <div>Explore</div>
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
                      stroke="white"
                      strokeWidth="2"
                    ></path>
                    <path
                      d="M10.8335 18.5L18.8335 10.5L10.8335 2.5"
                      stroke="white"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
              </a>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQyIiBoZWlnaHQ9IjMxNyIgdmlld0JveD0iMCAwIDQ0MiAzMTciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0NDEuMzMzIiBoZWlnaHQ9IjMxNyIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzgxM180ODY5KSIvPgo8cmVjdCB3aWR0aD0iNDQxLjMzMyIgaGVpZ2h0PSIzMTciIGZpbGw9IiNERkNGRkYiLz4KPHJlY3Qgd2lkdGg9IjQ0MS4zMzMiIGhlaWdodD0iMzE3IiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXJfODEzXzQ4NjkpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfODEzXzQ4NjkiIHgxPSItMjgyLjYyNiIgeTE9IjI4NS4wOTEiIHgyPSI1NDguMDMiIHkyPSIzMTYuNTgxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNDN0FDRkYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSJ3aGl0ZSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfODEzXzQ4NjkiIHgxPSItMjgyLjYyNiIgeTE9IjI4NS4wOTEiIHgyPSIzODMuNzI2IiB5Mj0iMjk4Ljk4MSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjQzdBQ0ZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0id2hpdGUiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K"
                loading="lazy"
                alt=""
                className="solutions_card-h-bg-2"
              />
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQyIiBoZWlnaHQ9IjMxNyIgdmlld0JveD0iMCAwIDQ0MiAzMTciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF84MTNfNDk1OCkiPgo8cmVjdCB3aWR0aD0iNDQxLjMzMyIgaGVpZ2h0PSIzMTciIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMzMzMDA4KSIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzgxM180OTU4KSIvPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMF9mXzgxM180OTU4KSI+CjxwYXRoIGQ9Ik0tMTA0LjQzOCAxNDIuNTI2Qy0xNjUuOTE3IDExLjAxNDUgMjIwLjA3NyAtNjc0LjkzIDM1MC43ODcgLTcyOS4wNEM1MDQuNjk3IC03OTIuNzU0IDYuNTY3NDIgLTM3OS45NjkgNDc4LjMzMiAtNDI3Ljk4OEM1MzkuODExIC0yOTYuNDc3IDM2MC43MjUgMjEuNjU5NyAyMzAuMDE2IDc1Ljc2OTFDOTkuMzA2IDEyOS44NzkgLTQyLjk2IDI3NC4wMzggLTEwNC40MzggMTQyLjUyNloiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcl84MTNfNDk1OCkiLz4KPC9nPgo8L2c+CjxkZWZzPgo8ZmlsdGVyIGlkPSJmaWx0ZXIwX2ZfODEzXzQ5NTgiIHg9Ii0yOTguOTQyIiB5PSItOTIzLjY2MiIgd2lkdGg9Ijk3Ny42NjMiIGhlaWdodD0iMTMwNy45MiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSI5My45NjAzIiByZXN1bHQ9ImVmZmVjdDFfZm9yZWdyb3VuZEJsdXJfODEzXzQ5NTgiLz4KPC9maWx0ZXI+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl84MTNfNDk1OCIgeDE9Ii0xOC4zNjExIiB5MT0iLTkyLjc0ODQiIHgyPSIyNzEuNTcxIiB5Mj0iMjY5LjcyNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMDAzQkZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzA2MEYyQiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfODEzXzQ5NTgiIHgxPSItMy45Njk5MiIgeTE9IjE1Ny4xNDciIHgyPSI4NC45NjE2IiB5Mj0iLTIwMy44OCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBvZmZzZXQ9IjAuMzg1NDE3IiBzdG9wLWNvbG9yPSIjMkNBMEZFIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZFMkNGRSIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxjbGlwUGF0aCBpZD0iY2xpcDBfODEzXzQ5NTgiPgo8cmVjdCB3aWR0aD0iNDQxLjMzMyIgaGVpZ2h0PSIzMTciIGZpbGw9IndoaXRlIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjMzMzAwOCkiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K"
                loading="lazy"
                alt=""
                className="solutions_card-h-bg-2 is-hover"
              />
            </div>
            <div className="solutions_card is-last is-unique">
              <div className="solutions_card-top">
                <div className="solutions_card-label">
                  For <br />
                  existing companies
                </div>
                <div className="solutions_card-icon-wrapper">
                  <img
                    src="data:image/webp;base64,UklGRmoFAABXRUJQVlA4WAoAAAAQAAAAVwAAVwAAQUxQSGUCAAAB8Jdt2/dG2f5dOIiEjoOigOJgHBAH4KDjoOOg42BwEAlVAJFQBd3WP87zuhJyBe6ff0TEBCz/ST8ct39+uBu/vrv0+U4cXfHpPpyu8ft9OF/j/J+zx6ftj3fj6ezS88N9eHh3+flwF7655m934XSVr3fr9f8yhbpDTXR/xkp4uStljHg73IXk4t4Ou3tG1CyKernO8XTefvrlL3iQ7Vn/fI1Xl79e7wQ1SVv683DZ0TWfrnWGTIpGJL9e9v0qr9dCJPMw43TZ6aZCSIVkDA+7kmzMNCrHnRVJxlbEy11QJIWMr/saM02qrJ72lSQyT0h+39dYxkI2ft1dJTIIkX7bWRLKxlCP+2pEiUiRzsue3rOeaTJ/2dXruSaRynoe9vXZJNna8GXZ1/I2FElIcF72dpYm2VqPOzudqJSEJuWnnWkmQqRw/nFvWS2SmvDlh91kmiQbE/L2aU9RJiEUCudP+8iYsUy2Ds6fdjHNmNAQklSdP+2lSZKsZKzwdrix1mRjKAlB9XJbJRSpZmOm0YCfbwoFQVCRaVIkzodbQ6lZEhKynp5vjEwjZLKeIvF+WPl2la/L8n1bMs3GDSEkeF55usrTshzXmlzYsLWy9W1l+XaFL8uyLN83rdZsHiJEaPC0shxPF37/ZZkeT6fT6Q1KZdqGzbOQXtb+2i/D9qih0Gw9eLuNUxpKG1SysTWhw028u2aUC0vU4PEWDpJWasi8hoaEjDnewqN5EyJrkEkmKZ5v4WlLEZQEDZUxZHy9hcchQSrK5iIyVujlFpYXW0N91MfYRxs/Wv/o44+Hm1gOD7e//CMHAFZQOCDeAgAAEBIAnQEqWABYAD5tLpJGJCKhoS8S3DCADYlkCHABhQwX/YNfB7ryoQY/1o2/iRdPvzAfsh+wHutf4v1AeTB1s3oNftL6YX7Y/CL+5/7R+zN//yb4QFmA8esrmghKymZm0SbYWFG3949PzlHbPwLYLQvVCucze3bzmdYzXnQMMOUaw60ynV5f9ru0O/oIt7HNyNgtx5ku0eAAAP7ZHyV/ahAN1QIzOiyNNQD3h515z3s0X094wAweiAN0WBgfXc78mvXykEi2GMnV9G//wbsXn/Dv/ffZ1YUVyxRpJ9vhf/+Nj//2DM0a71o+VeH7srqjvlY/zRFn0UR4Cswj7SeTSVS6NfoA6XP1BnqDPP1BF+XKH2rm80qXfD53TgkYE8f/+ysf6vT/TrT7+ntjpFwH/eT7jOu2e6EZ/uS1Jb8m4VsnDkvedwtbQ/FFtdUPrQQ19cJR3aFhpX0NhbB32ojzxs5lN9zgL0aO4sr9U5PqsGryXIQPE9mNA3hxvZ8Y9l/tCJYJBGiyVnefdtNI1k/yD72wMfu3/DQi8EvyKdE4fo+eUh1v9Il8PNubm/iePRwTHzUEW5oeC2zu/s18wjuYRrqyGzGD82cKUm2AQZ7PYCCfewhn++7vzEBa3MITSR9MTtr9OHcAGSDfudjs5iTUz9bHd1zvviPXmPHTVoJbTKeiMQGW/QBtMDFOLWfYBGsMOGuFuf25f2v05msTet5qHg/mvaWJruaN31QJ8FImjHsSvK53+w8O/40ogdPfMQs6TTb6mWPt14IAlUC1phHJXYtTNlwgaFLin3rz4TbsgnRVyPHJSb/qqB0tPsDR3ytvNqQovihmTT0GXk2sAMGtumo4Spa8oM4HbP55/8ToPilH/zBQBkPs+0JdjmjncMEX5yHcW1HCZQvLPSfOu5/hv3/edMp+LujBPaBQ29m/3wWqZanFpLZLKlPgiOz2uCoNd8tiD1+ygAWkuKqoAAA="
                    loading="lazy"
                    alt=""
                    className="solutions_card-icon"
                  />
                  <img
                    src="data:image/webp;base64,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"
                    loading="lazy"
                    alt=""
                    className="solutions_card-icon is-hover"
                  />
                </div>
              </div>
              <div className="solutions_card-middle">
                <h3 className="solutions_card-title">Team Extension</h3>
                <p className="solutions_card-text">
                  Expand your team with our dedicated and talented design
                  experts
                </p>
              </div>
              <a
                href="solutions/team-extension"
                className="button fill-white arrow-button-black-hover w-inline-block"
              >
                <div>Explore</div>
                <div className="code-embed w-embed">
                  <svg
                    width="21"
                    height="21"
                    className="button-fill-white-arrow"
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
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQyIiBoZWlnaHQ9IjMxNyIgdmlld0JveD0iMCAwIDQ0MiAzMTciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0NDEuMzMzIiBoZWlnaHQ9IjMxNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC42NjY5OTIpIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfODEzXzQ5MTApIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfODEzXzQ5MTAiIHgxPSIyMjAuNjY3IiB5MT0iMCIgeDI9IjIyMC42NjciIHkyPSIzMTciIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0ZBRkZERSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNDOEVDMDAiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K"
                loading="lazy"
                alt=""
                className="solutions_card-h-bg-3"
              />
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQyIiBoZWlnaHQ9IjMxNyIgdmlld0JveD0iMCAwIDQ0MiAzMTciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF84MTNfNDk4MikiPgo8cmVjdCB3aWR0aD0iNDQxLjMzMyIgaGVpZ2h0PSIzMTciIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuNjY2OTkyKSIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzgxM180OTgyKSIvPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMF9mXzgxM180OTgyKSI+CjxwYXRoIGQ9Ik03Mi41NjI1IDQ4Mi41MjZDMTEuMDg0MSAzNTEuMDE0IDM5Ny4wNzggLTMzNC45MyA1MjcuNzg4IC0zODkuMDRDNjgxLjY5OCAtNDUyLjc1NCAxODMuNTY4IC0zOS45Njg1IDY1NS4zMzMgLTg3Ljk4ODRDNzE2LjgxMiA0My41MjMzIDUzNy43MjYgMzYxLjY2IDQwNy4wMTcgNDE1Ljc2OUMyNzYuMzA3IDQ2OS44NzkgMTM0LjA0MSA2MTQuMDM4IDcyLjU2MjUgNDgyLjUyNloiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcl84MTNfNDk4MikiLz4KPC9nPgo8L2c+CjxkZWZzPgo8ZmlsdGVyIGlkPSJmaWx0ZXIwX2ZfODEzXzQ5ODIiIHg9Ii0xMjEuOTQxIiB5PSItNTgzLjY2MiIgd2lkdGg9Ijk3Ny42NjQiIGhlaWdodD0iMTMwNy45MiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSI5My45NjAzIiByZXN1bHQ9ImVmZmVjdDFfZm9yZWdyb3VuZEJsdXJfODEzXzQ5ODIiLz4KPC9maWx0ZXI+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl84MTNfNDk4MiIgeDE9Ii0xOC4zNjExIiB5MT0iLTkyLjc0ODQiIHgyPSIyNzEuNTcxIiB5Mj0iMjY5LjcyNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMDAzQkZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzA2MEYyQiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfODEzXzQ5ODIiIHgxPSIxNzMuMDMxIiB5MT0iNDk3LjE0NyIgeDI9IjI2MS45NjMiIHkyPSIxMzYuMTIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agb2Zmc2V0PSIwLjM4NTQxNyIgc3RvcC1jb2xvcj0iIzJDQTBGRSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRTJDRkUiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzgxM180OTgyIj4KPHJlY3Qgd2lkdGg9IjQ0MS4zMzMiIGhlaWdodD0iMzE3IiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC42NjY5OTIpIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg=="
                loading="lazy"
                alt=""
                className="solutions_card-h-bg-3 is-hover"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="section-separator"></div>
      <div className="section-separator"></div>{" "}
    </section>
  );
}
