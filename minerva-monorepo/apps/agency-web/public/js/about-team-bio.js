(function () {
  function initTeamBio() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      console.warn("about-team-bio: gsap or ScrollTrigger not loaded yet, skipping");
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    var words = document.querySelectorAll(".about-p-team_info-bio-word");
    if (!words.length) return;

    gsap.set(words, { width: 0 });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: words[0],
          scrub: 0.3,
          start: "top 75%",
          end: "top 15%",
        },
      })
      .to(words, {
        width: "100%",
        duration: 1,
        ease: "ease",
        stagger: 1,
      });

    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTeamBio);
  } else {
    initTeamBio();
  }
})();