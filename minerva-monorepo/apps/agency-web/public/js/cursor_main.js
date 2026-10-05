
      const cursorDot = document.getElementById("cursorDot");
      const cursorInnerDot = document.getElementById("cursorInnerDot");
      const mainNav = document.getElementById("mainNav");

      // Smooth cursor following
      let mouseX = 0,
        mouseY = 0;
      let dotX = 0,
        dotY = 0;
      let innerX = 0,
        innerY = 0;

      document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      function animateCursor() {
        dotX += (mouseX - dotX) * 0.12;
        dotY += (mouseY - dotY) * 0.12;
        cursorDot.style.left = dotX + "px";
        cursorDot.style.top = dotY + "px";

        innerX += (mouseX - innerX) * 0.5;
        innerY += (mouseY - innerY) * 0.5;
        cursorInnerDot.style.left = innerX + "px";
        cursorInnerDot.style.top = innerY + "px";

        requestAnimationFrame(animateCursor);
      }
      animateCursor();

      // Hover effects on interactive elements
      const interactiveElements = document.querySelectorAll(
        "a, button, .cursor-none, .tag, .dropdown, .video-widget, .pill-wrapper, .clickable, .vs_swiper-nav-btn, .vs-slide_video-play-btn, .vs-slide_video-pause-btn, .vs-slide_video-controls, .services-page-review_card, .faq_list-item",
      );
      interactiveElements.forEach((el) => {
        el.addEventListener("mouseenter", () => {
          cursorDot.classList.add("hover");
        });
        el.addEventListener("mouseleave", () => {
          cursorDot.classList.remove("hover");
        });
      });

      // Scroll effect for nav
      window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
          mainNav.classList.add("scrolled");
        } else {
          mainNav.classList.remove("scrolled");
        }
      });

      // Video widget click
      const videoWidget = document.getElementById("videoWidget");
      if (videoWidget) {
        videoWidget.addEventListener("click", () => {
          alert("Video player would open here");
        });
      }
    