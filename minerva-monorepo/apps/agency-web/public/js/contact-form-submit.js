
// Contact form → Minerva intake pipeline (plan §5.2 / M1: "forms POST to /api/v1/intake").
// The Webflow export shipped with no form action, so submits silently reloaded the
// page and lost leads. This wires the form to the Minerva OS intake endpoint instead.

var _init = function () {
  var submitButton = document.querySelector(".contact-form-cta");
  var inputs = document.querySelectorAll(".contact-hero_form-input");
  var form = document.getElementById("email-form");
  var successBlock = document.querySelector(".contact-hero_success");
  var errorBlock = document.querySelector(".contact-hero_form-block .w-form-fail");
  var contactFormSubmitButtonText = document.querySelector(
    ".contact-form-btn-text",
  );
  var isValidationError = false;

  submitButton.addEventListener("click", handleSubmitButtonClick);

  inputs.forEach(function (input) {
    input.addEventListener("focus", handleInputFocus);
    input.addEventListener("blur", handleInputBlur);
    input.addEventListener("keypress", handleEnterPress);
  });

  function handleSubmitButtonClick(e) {
    e.preventDefault();
    resetInputErrors();

    inputs.forEach(function (input) { inputValidation(input); });

    if (!isValidationError) {
      submitViaIntake();
    }
  }

  // POST to the Minerva intake pipeline (agent-orchestrated, human-verified scoping).
  function submitViaIntake() {
    var payload = {
      brief: valueOf("About-project"),
      client_email: valueOf("Corporate-email"),
      client_phone: valueOf("Phone-number"),
      organization_name: valueOf("Full-name"),
      source: "web_form",
      // Honeypot (empty for humans): forwarded untouched; the upstream
      // accept-and-discards a filled trapdoor as success.
      companyWebsite: valueOf("companyWebsite"),
    };
    if (!payload.brief) {
      showError();
      return;
    }

    submitButton.style.pointerEvents = "none";
    contactFormSubmitButtonText.innerText = "Please wait...";

    fetch("/api/v1/intake", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("intake failed (" + res.status + ")");
        return res.json();
      })
      .then(function () {
        if (form) form.style.display = "none";
        if (successBlock) successBlock.style.display = "block";
      })
      .catch(function () {
        showError();
      });
  }

  function showError() {
    submitButton.style.pointerEvents = "";
    contactFormSubmitButtonText.innerText = "Submit";
    if (errorBlock) errorBlock.style.display = "block";
  }

  function valueOf(name) {
    var field = form ? form.querySelector('[name="' + name + '"]') : null;
    return field ? field.value.trim() : "";
  }

  function inputValidation(input) {
    var label = input.nextElementSibling;
    var errorMsg = label.nextElementSibling;
    var type = input.getAttribute("type");
    var optional = input.getAttribute("data-optional") === "true";

    // Optional fields (phone): empty is fine; a filled value must look valid.
    if (optional && input.value.length === 0) {
      return;
    }

    if (
      input.value.length === 0 ||
      (type === "email" && !validateEmail(input.value)) ||
      (type === "tel" && !validatePhone(input.value))
    ) {
      input.classList.add("invalid");
      errorMsg.style.display = "block";
      isValidationError = true;
    }
  }

  function handleInputFocus(e) {
    var label = e.target.nextElementSibling;

    label.style.top = "-20px";
    label.style.fontSize = "14px";
    isValidationError = false;
  }

  function handleInputBlur(e) {
    var input = e.target;
    var label = input.nextElementSibling;

    if (input.value === "") {
      label.style.top = "0";
      label.style.fontSize = "16px";
    } else {
      label.style.top = "-20px";
      label.style.fontSize = "14px";
    }
  }

  function handleEnterPress(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      submitButton.click();
    }
  }

  function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // Same shape as the upstream check (portal _lib PHONE_RE): digits, spaces
  // and + - . ( ) only, 7..32 chars. Lenient on purpose — strictness lives
  // in the E.164 world, not in a lead form.
  function validatePhone(phone) {
    var re = /^[+\d][\d\s\-.()]{5,30}$/;
    return re.test(String(phone).trim());
  }

  function resetInputErrors() {
    inputs.forEach(function (input) {
      var label = input.nextElementSibling;
      var errorMsg = label.nextElementSibling;

      errorMsg.style.display = "none";
      input.classList.remove("invalid");
    });
  }
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _init);
} else {
  _init();
}
