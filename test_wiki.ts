async function run() {
  const url = "https://pt.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&titles=Andr%C3%A9_Mendon%C3%A7a&format=json";
  const res = await fetch(url);
  const data = await res.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  const content = pages[pageId].revisions[0]["*"];
  console.log(content.substring(0, 1500));
} run();
