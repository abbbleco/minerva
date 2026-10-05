// Function to get cookie value by name
function getCookie(name) {
  let matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)",
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : "";
}

// Populate UTM fields when the document is ready
var _init = function () {
  const utmFields = {
    utm_source: "website", // Replace 'default_source' with your actual default value
    utm_medium: "unique", // Replace 'default_medium' with your actual default value
    utm_campaign: "unique", // Replace 'default_campaign' with your actual default value
    utm_term: "unique", // Replace 'default_term' with your actual default value
    utm_content: "unique", // Replace 'default_content' with your actual default value
  };

  // Populate hidden fields with UTM parameter values or default values
  Object.keys(utmFields).forEach(function (field) {
    const fieldValue = getCookie(field) || utmFields[field];
    const input = document.querySelector('input[name="' + field + '"]');
    if (input) {
      input.value = fieldValue;
    }
  });

  // Handle utm_first_site_page and utm_previous_site_page, setting a default for the latter
  const utmFirstSitePage = getCookie("utm_first_site_page");
  const utmPreviousSitePage =
    getCookie("utm_previous_site_page") || utmFirstSitePage; // Use first site page as default if previous is not set

  const inputFirstSitePage = document.querySelector(
    'input[name="utm_first_site_page"]',
  );
  if (inputFirstSitePage && utmFirstSitePage) {
    inputFirstSitePage.value = utmFirstSitePage;
  }

  const inputPreviousSitePage = document.querySelector(
    'input[name="utm_previous_site_page"]',
  );
  if (inputPreviousSitePage) {
    inputPreviousSitePage.value = utmPreviousSitePage
      ? utmPreviousSitePage
      : ""; // Ensure there's a value to set, even if it's an empty string
  }
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _init);
} else {
  _init();
}
