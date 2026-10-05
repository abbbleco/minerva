import type { JSX } from "react";

/* eslint-disable @next/next/no-img-element */

export default function IndustryNiches(): JSX.Element {
  return (
    <section className="section_industry-niches is-about-page">
      <div className="w-layout-blockcontainer container w-container">
        <div className="industries-niches_main">
          <div className="industries-niches_top-wrapper">
            <div className="industries-niches_top">
              <div className="industries-niches_heading-wrapper">
                <h2 className="heading-style-h2 is-large is-centered">
                  We have <span className="is-toxic-green">extensive</span>
                </h2>
                <h2 className="heading-style-h2 is-large is-centered">
                  industry experiences
                </h2>
                <div className="industries-niches_heading-line w-embed">
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 182 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 14.292C4.74198 13.1416 6.57952 9.65105 9.48179 8.53248C12.7344 7.21756 16.2296 7.72763 19.2133 9.95254C21.1996 11.5392 22.8482 13.7684 24.7487 15.5057C26.6492 17.2431 28.9791 18.5521 31.1887 17.7667C33.7875 16.8385 35.4305 13.4351 37.039 10.4681C38.6476 7.50112 40.8972 4.47071 43.5648 4.86736C46.7819 5.35129 48.442 10.3492 51.0065 13.0782C55.3571 17.6873 61.7798 15.125 66.1933 10.6427C69.9085 6.86654 73.7266 1.56718 78.2718 2.59849C83.6642 3.82813 86.7668 13.5938 92.2336 13.6573C97.5802 13.7207 100.603 4.55795 105.732 2.4636C110.861 0.369244 115.812 5.89867 120.827 8.53248C124.846 10.5715 129.228 10.7854 133.34 9.14334C135.445 8.32314 137.44 7.03724 139.248 5.33539C141.137 3.55043 142.408 1.36878 144.972 2.22556C147.171 2.93161 148.516 5.97795 150.451 7.58838C153.834 10.3967 158.11 8.38172 161.899 6.91408C167.798 4.71705 173.958 4.22294 180 5.46235"
                      stroke="#D0F601"
                      strokeWidth="4"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                    ></path>
                  </svg>
                </div>
              </div>
              <p className="regular-text is-centered">
                Our product designers have completed projects in different
                niches. They know how to add business value and provide
                personalized design solutions for your digital product.
              </p>
            </div>
          </div>
          <div className="industries-niches_cards industry-page">
            <a
              id="w-node-_9cf8c34e-3b0d-8c3b-67c3-5dce871fffd8-871fffcc"
              href="/industries/web3"
              className="industries-niches_card w-inline-block"
            >
              <div className="industries-niches_card-wrap">
                <img
                  src="data:image/png;base64,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"
                  loading="lazy"
                  alt=""
                  className="industries-niches_card-icon"
                />
                <div className="industries-niches_card-info">
                  <div className="industries-niches_card-title-wrapper">
                    <h3 className="about-p-industry_card-title">
                      Web 3, Blockchain
                    </h3>
                    <div className="code-embed w-embed">
                      <svg
                        width="41"
                        height="41"
                        viewBox="0 0 41 41"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.6846 20.4634L29.1043 20.4634"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                        <path
                          d="M20.8848 28.6728L29.0947 20.4629L20.8848 12.2529"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div className="industries-niches_card-tags">
                    <div className="industries-niches_card-tag">Apps</div>
                    <div className="industries-niches_card-tag">DeFi</div>
                    <div className="industries-niches_card-tag">IPFS</div>
                    <div className="industries-niches_card-tag">Exchanges</div>
                    <div className="industries-niches_card-tag">Play2Earn</div>
                  </div>
                </div>
              </div>
            </a>
            <a
              id="w-node-_9cf8c34e-3b0d-8c3b-67c3-5dce871fffee-871fffcc"
              href="/industries/ai"
              className="industries-niches_card w-inline-block"
            >
              <div className="industries-niches_card-wrap">
                <img
                  src="data:image/webp;base64,UklGRroFAABXRUJQVlA4WAoAAAAQAAAAWAAAVwAAQUxQSCoDAAABsFRr29hGUiAUhDDogtAQikEXgw4Di0k1g2YwxWCGQYfBFIPnLv5PkiXvehURE/D2b95vf3+696+ff77f4uunV/z1cYOvv7zo47L3T2PHIkIUJbXU5OOqv+x2SMhugpAI8evLNe/GUNIkY8uaw2X9uObbdHBIKgjZb6LlxzXbTkhakVCW0F7L+PMGaSJzLXOUytyNSEmoZUxDRA53ixIqRFQogiWFELkFISKFLIrMWbNkvAMigqyV3U4ktxqTsltUENo5el1SQZCiMkYLGWvpHnK2HM5SO8h6g6hD0YqQNYYWuoWSNbRkrcxRSu11C7K2WKRES9YcjNyhpVBSFhaEsqZBdIeTRTu7ZYySynhdqZqQ/RQ5G91kHiLHKxpKS9BNihxuL8lc2YtuMbcUORjVRJHd6x4otGRsjxyMqCW6alscrOw2rDXsDnSHJFqenLGQMdzgdDsN5WCElq57TNGS0qG1hgQNrtum41lzxLGjFz2GlAqZq739rHUrhOSJ7ZUcv2gbkv1O0RBRd0oplCtz/qKHsex0ribUic/tsW2Px7Zt27f3Z0SicjBpQlOemKz98/GEcVEHZGka89SQwp9ntgNUB6gytzw7JPX/LyceE4KmyB2jIuSPc6FQRDsd6ArZ387JfmlnDJXnZzf1eMLBlIRK9nvayadUg4xZW5JrEyLbiY2gpKHQUm6a4nHikTUW2S+hiyIRtZ3YJiW7IYarQ2V8QiMiUdaoiyLZfZx4QA6Wo7lrzwmqUJAodY/IuJ1B5sh+7tiQkp4QFFRL0B0OLh4nNiFr0N5Nq2Q8831Yg+hWhczbifchEYTcNnPD48Tbz2ku5b4daNnO/G5uIXdOSCuPM28bQaS6UaEg2E69bUjW3H8QHufevv6EyJ1DkirYnvD29uX3b98v/aWWpCNZK+NzLv+UHAwlIaj0eIlINa0ZowW2lxAEFRmTIuHxEqkpCQnZT68BETLsp0hsr5KDB0JIeLzK3HK0cvBFappDhAhhe421A4en0Mcr/LVXS6FpP76+wm8HVHKwPf14e8nvi0U5WaL++/4ab+8//vf5+fnPhf95fHn7ty5WUDggagIAALAPAJ0BKlkAWAA+aSyPRaQioRh8ptBABoSgDIzL1G9fBuCuej6IDqeufP9nm/QPoAB02wV/sLouXQgCAlW2M/I4U1MnSvbsvm1j5LBRKYNPlOVNncUWIgcyHEwzXoQKD+VAekKMAx9696wxRmxBBCAQdLjC1WqdmnTFUa5NzC4bhr2NR2kAAP5yFfO2b6lONEDWPnYpYHnDWxmzarSVteKcWvbbFbciQl08+usUghpf96L//0hv/+ksv//SIZabBMmRpwq5nATvs93gugSf89omlkDR5X2OK7TciSKHQZClkLrzbCRx1dJheqO5m3+S+q/obUCM3koADqRhrcgozLQIIwArySZ4cBxcxjQxB+1WFiLJ6RwwHmtC8hoiLk6BlWPF5isTMsQ3zm0y71hnT31mo+jlRRAgh+n89bbxNjcXGc1O/aSLS+qqc06cA/yir6XoEk97hJEGOVbpTu48f+YqHvy8Db8fodAyJd8tDxKiMqVb7B44QOx9YgaqCI+a2O3/6/8ZPw+rOEf/xQ773/jG3kR/lUhBQhLPh7v1+v55J+q+uvP4EAGeh0K4qjyGLJVtQpGuTCbDhlszeZuiho2YpDN+eZ4zWBQvBWHoLHCeZ/XZLB/voXDvM3679CW2zGkReaDHg1rlNOVanYFyVw/Ll3q7dgnUwFoGYa/aVgURSyaYzK8gt4OZEKRrwK7I4J1MpiX9mg6UqsGD2PgN9CJCOvsI/5vfIjY07ifoHGZVoV+mEV+dncc/TLmhFo8b+RK5A05qIkCAs4zP4n55xfbT5tJD0rExDUnL9OLEO+xHGd+sgkCH6FgAAA=="
                  loading="lazy"
                  alt=""
                  className="industries-niches_card-icon"
                />
                <div className="industries-niches_card-info">
                  <div className="industries-niches_card-title-wrapper">
                    <h3 className="about-p-industry_card-title">AI &amp; ML</h3>
                    <div className="code-embed w-embed">
                      <svg
                        width="41"
                        height="41"
                        viewBox="0 0 41 41"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.6846 20.4634L29.1043 20.4634"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                        <path
                          d="M20.8848 28.6728L29.0947 20.4629L20.8848 12.2529"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div className="industries-niches_card-tags">
                    <div className="industries-niches_card-tag">
                      AI Chatbots
                    </div>
                    <div className="industries-niches_card-tag">
                      AI Marketing
                    </div>
                    <div className="industries-niches_card-tag">
                      HR &amp; AI
                    </div>
                    <div className="industries-niches_card-tag">Crypto AI</div>
                    <div className="industries-niches_card-tag">
                      Education AI
                    </div>
                    <div className="industries-niches_card-tag">
                      Healthcare AI
                    </div>
                  </div>
                </div>
              </div>
            </a>
            <a
              href="/industries/saas"
              className="industries-niches_card w-inline-block"
            >
              <div className="industries-niches_card-wrap">
                <img
                  src="data:image/png;base64,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"
                  loading="lazy"
                  alt=""
                  className="industries-niches_card-icon"
                />
                <div className="industries-niches_card-info">
                  <div className="industries-niches_card-title-wrapper">
                    <h3 className="about-p-industry_card-title">SaaS</h3>
                    <div className="code-embed w-embed">
                      <svg
                        width="41"
                        height="41"
                        viewBox="0 0 41 41"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.6846 20.4634L29.1043 20.4634"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                        <path
                          d="M20.8848 28.6728L29.0947 20.4629L20.8848 12.2529"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div className="industries-niches_card-tags">
                    <div className="industries-niches_card-tag">CRM</div>
                    <div className="industries-niches_card-tag">HR</div>
                    <div className="industries-niches_card-tag">AI</div>
                    <div className="industries-niches_card-tag">ERP</div>
                    <div className="industries-niches_card-tag">
                      Automation tools
                    </div>
                  </div>
                </div>
              </div>
            </a>
            <a
              id="w-node-_9cf8c34e-3b0d-8c3b-67c3-5dce87200028-871fffcc"
              href="/industries/healthcare"
              className="industries-niches_card w-inline-block"
            >
              <div className="industries-niches_card-wrap">
                <img
                  src="data:image/png;base64,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"
                  loading="lazy"
                  alt=""
                  className="industries-niches_card-icon"
                />
                <div className="industries-niches_card-info">
                  <div className="industries-niches_card-title-wrapper">
                    <h3 className="about-p-industry_card-title">Healthcare</h3>
                    <div className="code-embed w-embed">
                      <svg
                        width="41"
                        height="41"
                        viewBox="0 0 41 41"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.6846 20.4634L29.1043 20.4634"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                        <path
                          d="M20.8848 28.6728L29.0947 20.4629L20.8848 12.2529"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div className="industries-niches_card-tags">
                    <div className="industries-niches_card-tag">
                      Mental health
                    </div>
                    <div className="industries-niches_card-tag">Wellness</div>
                    <div className="industries-niches_card-tag">Insurance</div>
                    <div className="industries-niches_card-tag">Fitness</div>
                  </div>
                </div>
              </div>
            </a>
            <a
              id="w-node-_9cf8c34e-3b0d-8c3b-67c3-5dce87200014-871fffcc"
              href="/industries/fintech"
              className="industries-niches_card is-last w-inline-block"
            >
              <div className="industries-niches_card-wrap">
                <img
                  src="data:image/png;base64,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"
                  loading="lazy"
                  alt=""
                  className="industries-niches_card-icon"
                />
                <div className="industries-niches_card-info">
                  <div className="industries-niches_card-title-wrapper">
                    <h3 className="about-p-industry_card-title">Fintech</h3>
                    <div className="code-embed w-embed">
                      <svg
                        width="41"
                        height="41"
                        viewBox="0 0 41 41"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.6846 20.4634L29.1043 20.4634"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                        <path
                          d="M20.8848 28.6728L29.0947 20.4629L20.8848 12.2529"
                          stroke="black"
                          strokeWidth="1.36831"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div className="industries-niches_card-tags">
                    <div className="industries-niches_card-tag">Banking</div>
                    <div className="industries-niches_card-tag">Exchanges</div>
                    <div className="industries-niches_card-tag">
                      Digital Payments
                    </div>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
      <div className="section-separator"></div>
    </section>
  );
}
