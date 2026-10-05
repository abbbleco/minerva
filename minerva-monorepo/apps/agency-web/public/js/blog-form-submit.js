var _init = function () {
                    const form = document.getElementById(
                      "wf-form-Blog-Subscription-Email",
                    );

                    form.addEventListener("submit", function (event) {
                      event.preventDefault();
                      // Serialize form data
                      var formData = new FormData(form);

                      // Submit the form using AJAX
                      fetch(
                        "https://hook.eu2.make.com/o2ql04zow9mbgwcupulw8b2yxq598med",
                        {
                          method: "POST",
                          mode: "no-cors",
                          body: formData,
                          headers: {
                            Accept: "application/json",
                          },
                        },
                      )
                        .then(function () {
                          // Handle successful form submission
                          //          $(form).submit();
                          console.log("Form submitted successfully");
                          form.reset();
                          //					form.style.display = 'none';
                          //          successMessage.style.display = 'block';
                        })
                        .catch(function (error) {
                          // Handle network errors
                          console.error(
                            "There was a problem with the fetch operation: " +
                              error.message,
                          );
                          //          errorMessage.style.display = 'block';
                        });
                    });
                  };
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", _init);
} else {
  _init();
}
