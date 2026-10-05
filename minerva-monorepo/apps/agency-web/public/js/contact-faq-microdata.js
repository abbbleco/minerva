// adding microdata to pages with faq's
var _init = () => {
  const pageFaqs = document.querySelectorAll(".faq_list-item");
  const faqSection = document.querySelector(".section_services-page-faq");

  if (
    pageFaqs.length === 0 ||
    !faqSection ||
    faqSection.classList.contains("w-condition-invisible")
  ) {
    return;
  }

  pageFaqs.forEach((item, index) => {
    const itemQuestion = item.querySelector(".faq_item-question");
    const itemAnswer = item.querySelector(".faq_item-answer");

    if (itemQuestion.classList.contains("w-dyn-bind-empty")) {
      return;
    }

    itemQuestion.setAttribute("ms-code-snippet-q", index + 1);
    itemAnswer.setAttribute("ms-code-snippet-a", index + 1);
  });

  let faqArray = [];
  let questionElements = document.querySelectorAll("[ms-code-snippet-q]");
  let answerElements = document.querySelectorAll("[ms-code-snippet-a]");

  for (let i = 0; i < questionElements.length; i++) {
    let question = questionElements[i].innerText;
    let answer = "";

    for (let j = 0; j < answerElements.length; j++) {
      if (
        questionElements[i].getAttribute("ms-code-snippet-q") ===
        answerElements[j].getAttribute("ms-code-snippet-a")
      ) {
        answer = answerElements[j].innerText;
        break;
      }
    }

    faqArray.push({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    });
  }

  let faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqArray,
  };

  let script = document.createElement("script");
  script.type = "application/ld+json";
  script.innerHTML = JSON.stringify(faqSchema);

  document.getElementsByTagName("head")[0].appendChild(script);
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _init);
} else {
  _init();
}
