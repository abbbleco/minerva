import Script from "next/script";

export default function HomeScripts() {
  return (
    <>
      <Script src="/js/swiper.js" strategy="afterInteractive" />
      <Script src="/js/swiper-init.js" strategy="afterInteractive" />
      <Script src="/js/faq-microdata.js" strategy="afterInteractive" />
      <Script src="/js/breadcrumbs.js" strategy="afterInteractive" />
      <Script id="video-widget" strategy="afterInteractive">
        {`document.addEventListener("DOMContentLoaded", function () {
  var videoWidget = document.getElementById("videoWidget");
  if (videoWidget) {
    videoWidget.addEventListener("click", function () {
      alert("Video player would open here");
    });
  }
});`}
      </Script>
    </>
  );
}