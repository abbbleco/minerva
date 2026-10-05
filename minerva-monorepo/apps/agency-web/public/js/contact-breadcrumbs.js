//breadcrumbs microdata
var _init = () => {
  const breadcrumbs = document.querySelectorAll(".breadcrumbs_link");

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return;
  } else {
    const microdataBreadcrumbs = [];

    breadcrumbs.forEach((link, i) => {
      microdataBreadcrumbs.push({
        "@type": "ListItem",
        position: i + 1,
        name: link.innerHTML,
        item: link.href,
      });
    });

    const breadcrumbsSchema = {
      "@context": "https://schema.org/",
      "@type": "BreadcrumbList",
      itemListElement: microdataBreadcrumbs,
    };

    let breadCrumnsMicrodataScript = document.createElement("script");
    breadCrumnsMicrodataScript.type = "application/ld+json";
    breadCrumnsMicrodataScript.innerHTML = JSON.stringify(breadcrumbsSchema);

    document
      .getElementsByTagName("head")[0]
      .appendChild(breadCrumnsMicrodataScript);
  }
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _init);
} else {
  _init();
}
