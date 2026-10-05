import Script from "next/script";

export function PolicyScripts() {
  return (
    <>
      <Script src="/js/webflow-mod.js" strategy="afterInteractive" />
      <Script src="/js/consent-engine.js" strategy="afterInteractive" />
      <Script src="/js/about-chunk-runtime.js" strategy="afterInteractive" />
      <Script src="/js/chunk_910.js" strategy="afterInteractive" />
      <Script src="/js/chunk_963.js" strategy="afterInteractive" />
      <Script src="/js/navbar-hide.js" strategy="afterInteractive" />
      <Script src="/js/utm-cookies.js" strategy="afterInteractive" />
      <Script src="/js/faq-microdata.js" strategy="afterInteractive" />
      <Script src="/js/breadcrumbs.js" strategy="afterInteractive" />
    </>
  );
}

export function PolicyWebflowScripts() {
  return (
    <>
      <Script src="/js/jquery_3_5_1.js" strategy="afterInteractive" />
      <PolicyScripts />
    </>
  );
}