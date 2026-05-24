(async () => {
  try {
    const res = await fetch("sections/head.html");
    const head = await res.text();
    document.head.insertAdjacentHTML("afterbegin", head);
  } catch (err) {
    console.error("Failed to load head.html:", err);
  }

  const allSections = document.querySelectorAll("[data-path]");
  await Promise.all(Array.from(allSections).map(loadSections));
})();

async function loadSections(section) {
  const filePath = section.dataset.path;
  if (!filePath) return;
  try {
    const res = await fetch(filePath);
    const html = await res.text();
    section.innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}
