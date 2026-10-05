
    // Add event listener for when the document is ready
    var _init = function () {

      // Swiper slider configuration
      const swiperVideoSlider = new Swiper('.video-slider', {
        direction: "horizontal", // or "vertical"
        preventClicks: true,
        preventClicksPropagation: true,
        loop: false, // Or true
        mousewheel: false,
        speed: 600, // Slide chnaging speed
        centeredSlides: false, // Or true
        lazy: true,
        navigation: {
          nextEl: '.vs_swiper-nav-btn.next-slide',
          prevEl: '.vs_swiper-nav-btn.prev-slide',
        },
        touch: {
          enabled: true // Control the slider using touch screen
        },
        keyboard: {
          enabled: true, // Control the slider using keyboard
        },
        breakpoints: { // Add the necessary breakpoints
          0: {
            slidesPerView: 1,
            spaceBetween: 20, // spacing between slides
          },
          767: {
            slidesPerView: 1,
            spaceBetween: 20, // spacing between slides
          },
          991: {
            slidesPerView: 1,
            spaceBetween: 20, // spacing between slides
          },
          1280: {
            slidesPerView: 1,
            spaceBetween: 20, // spacing between slides
          }
        },
      })

    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _init);
    } else {
      _init();
    }
