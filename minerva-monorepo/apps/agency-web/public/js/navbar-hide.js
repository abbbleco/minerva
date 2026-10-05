// Load DOM content/page
    var _init = function () {
      let lastScrollTop = 0;
      let navbar = document.getElementById('navbar');
      let navMenuContainer = document.querySelector('.navmenu-container-laptop'); // Select the nav menu container

      function shouldNavbarBeVisible() {
        // Check if the nav menu container is displayed as block
        return getComputedStyle(navMenuContainer).display === 'block';
      }

      function hideDropdowns() {
        const dropdownToggles = document.querySelectorAll('.navbar_dropdown-toggle');
        const dropdownMenus = document.querySelectorAll('.navbar_dropmenu');

        dropdownToggles.forEach(function (toggle) {
          const icon = toggle.querySelector('.navbar_dropdown-toggle-icon');
          if (icon) {
            icon.style.transform = 'rotateZ(0deg)';
            setTimeout(function () {
              icon.style.transform = '';
            }, 250);
          }
          if (toggle.classList.contains('w--open')) {
            setTimeout(function () {
              toggle.classList.remove('w--open');
            }, 250);
          }
        });

        dropdownMenus.forEach(function (menu) {
          if (menu.classList.contains('w--open')) {
            menu.style.opacity = '0';
            setTimeout(function () {
              menu.classList.remove('w--open');
              menu.style.opacity = '';
            }, 250);
          }
        });
      }

      window.addEventListener("scroll", function () {
        let currentScroll = window.pageYOffset || document.body.scrollTop;

        // Add/remove background blur on scroll
        if (currentScroll >= 100) {
          navbar.classList.add('has-blur');
        } else {
          navbar.classList.remove('has-blur');
        }

        if (!shouldNavbarBeVisible()) {
          if (currentScroll > lastScrollTop) {
            // Only hide dropdowns on scroll down
            hideDropdowns();
            navbar.classList.add('is-hidden');
          } else {
            navbar.classList.remove('is-hidden');
          }
        }

        if (currentScroll <= 1) {
          navbar.classList.remove('is-hidden');
        }

        lastScrollTop = currentScroll;
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _init);
    } else {
      _init();
    }