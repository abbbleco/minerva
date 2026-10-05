var _init = function() {
  // contact form inputs
  const inputs = document.querySelectorAll('.contact-hero_form-input');

  inputs.forEach(input => {
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', validateInput);
  });

  function handleFocus(e) {
    const label = e.target.nextElementSibling;
    // Move label up when the input is focused
    label.style.top = '-20px'; // Adjust as necessary
    // Reset styles and hide error message when input is focused
    e.target.classList.remove('invalid');
    label.classList.remove('invalid');
    const errorMsg = label.nextElementSibling;
    errorMsg.style.display = 'none';
  }

  function validateInput(e) {
    const input = e.target;
    const label = input.nextElementSibling;
    const errorMsg = label.nextElementSibling;
    const type = input.getAttribute('type');

    // Check if input is empty or if the email is invalid
    if (input.value === '') {
      showError(input, label, errorMsg);
    } else if (type === 'email' && !validateEmail(input.value)) {
      showError(input, label, errorMsg);
    } else {
      hideError(input, label, errorMsg);
    }
  }

  // Function to show the error styling and message
  function showError(input, label, errorMsg) {
    input.classList.add('invalid');
    label.classList.add('invalid');
    errorMsg.style.display = 'block'; // Show the error message
    if(input.value === '') {
      label.style.top = '0'; // Move label down if input is empty and invalid
    } else {
      label.style.top = '-20px'; // Keep label up if there is some input
    }
  }

  // Function to hide the error styling and message
  function hideError(input, label, errorMsg) {
    input.classList.remove('invalid');
    label.classList.remove('invalid');
    errorMsg.style.display = 'none'; // Hide the error message
    label.style.top = '-20px'; // Keep label up if input is not empty
  }

  // Email validation function
  function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _init);
} else {
  _init();
}