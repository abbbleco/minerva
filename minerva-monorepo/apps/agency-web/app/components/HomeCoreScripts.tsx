import Script from "next/script";

export default function CoreScripts() {
  return (
    <>
      <Script src="/js/home.js" strategy="afterInteractive" />
      <Script src="/js/chunk_910.js" strategy="afterInteractive" />
      <Script src="/js/chunk_963.js" strategy="afterInteractive" />
      <Script src="/js/bundler_6085.js" strategy="afterInteractive" />
      <Script src="/js/navbar-hide.js" strategy="afterInteractive" />
      <Script src="/js/utm-cookies.js" strategy="afterInteractive" />
    </>
  );
}