var _init = function() {
    //Auto Tabs
    const tabs = document.querySelectorAll(".works-page_hero-tab-select");
    let currentTab = 0;

    const switchTab = () => {
      if (currentTab >= 4) {
        currentTab = 0;
      } else {
        currentTab++;
      }
      tabs[currentTab].click();
    };

    let tabInterval = setInterval(switchTab, 5000);

    for (let i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", () => {
        clearInterval(tabInterval);
        currentTab = i;
        tabInterval = setInterval(switchTab, 5000);
      });
    }
  };
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", _init);
} else {
  _init();
}
