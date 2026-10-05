import Script from "next/script";

export default function ContactScripts() {
  return (
    <>
      <Script src="/js/webflow-mod.js" strategy="afterInteractive" />
      <Script src="/js/consent-engine.js" strategy="afterInteractive" />
      <Script src="/js/contact-jquery.js" strategy="afterInteractive" />
      <Script src="/js/contact-chunk-910.js" strategy="afterInteractive" />
      <Script src="/js/contact-chunk-963.js" strategy="afterInteractive" />
      <Script src="/js/contact-chunk-runtime.js" strategy="afterInteractive" />
      <Script src="/js/contact-navbar-hide.js" strategy="afterInteractive" />
      <Script src="/js/contact-utm-cookies.js" strategy="afterInteractive" />
      <Script src="/js/contact-utm-cookies-2.js" strategy="afterInteractive" />
      <Script src="/js/contact-faq-microdata.js" strategy="afterInteractive" />
      <Script src="/js/contact-breadcrumbs.js" strategy="afterInteractive" />
      <Script src="/js/contact-form-focus.js" strategy="afterInteractive" />
      <Script src="/js/contact-form-submit.js" strategy="afterInteractive" />
    </>
  );
}