import Script from "next/script";

export function SolutionsScripts() {
  return (
    <>
      <Script src="/js/webflow-mod.js" strategy="afterInteractive" />
      <Script src="/js/consent-engine.js" strategy="afterInteractive" />
      <Script src="/js/jquery_3_5_1.js" strategy="afterInteractive" />
      <Script src="/js/svc-chunk_910.js" strategy="afterInteractive" />
      <Script src="/js/svc-chunk_963.js" strategy="afterInteractive" />
      <Script src="/js/svc-about-chunk-runtime.js" strategy="afterInteractive" />
      <Script src="/js/navbar-hide.js" strategy="afterInteractive" />
      <Script src="/js/utm-cookies.js" strategy="afterInteractive" />
      <Script src="/js/faq-microdata.js" strategy="afterInteractive" />
      <Script src="/js/breadcrumbs.js" strategy="afterInteractive" />
    </>
  );
}
