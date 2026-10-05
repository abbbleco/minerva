
    // Function to get cookie value
    function getCookie(name) {
      let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
      ));
      return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    // Modified setCookie function to optionally create session cookies
    function setCookie(name, value, days) {
      let expires = "";
      if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      // If 'days' is not provided, the cookie becomes a session cookie
      document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    // Function to handle UTM parameters
    function handleUTMParameters() {
      const utms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      const urlParams = new URLSearchParams(window.location.search);

      utms.forEach(utm => {
        let value = urlParams.get(utm) || getCookie(utm) || '';
        // Omit the 'days' parameter for session cookies
        setCookie(utm, value); // Now stores as a session cookie
      });

      // Handling first site page and previous site page as session cookies
      const currentPath = window.location.pathname;
      let firstSitePage = getCookie('utm_first_site_page') || currentPath;

      // Update only if it's the user's first visit in the session
      if (!sessionStorage.getItem('visited')) {
        setCookie('utm_first_site_page', firstSitePage); // Now stores as a session cookie
        sessionStorage.setItem('visited', 'true');
      }

      // Special handling for previous site page as session cookie
      handlePreviousSitePage();
    }

    function handlePreviousSitePage() {
      const currentPath = window.location.pathname;
      const previousPath = sessionStorage.getItem('previousPath') || '';

      if (currentPath.includes('/contact-us') && previousPath) {
        setCookie('utm_previous_site_page', previousPath); // Now stores as a session cookie
      }

      if (!currentPath.includes('/contact-us')) {
        sessionStorage.setItem('previousPath', currentPath);
      }
    }

    // Function to handle trigger element clicks
    function setupTriggerElementTracking() {
      document.addEventListener('click', function (e) {
        if (e.target.classList.contains('trigger-element')) {
          setCookie('utm_trigger_element', e.target.getAttribute('data-trigger')); // Now stores as a session cookie
        }
      });
    }

    // Run on document load
    var _init = function () {
      handleUTMParameters();
      handlePreviousSitePage();
      setupTriggerElementTracking();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _init);
    } else {
      _init();
    }
