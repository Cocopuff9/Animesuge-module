export async function search(query) {
  const res = await fetch(`https://animesugetv.se/search.html?keyword=${encodeURIComponent(query)}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  
  return Array.from(doc.querySelectorAll(".anime__details a")).map(el => ({
    title: el.querySelector("h5")?.textContent.trim(),
    url: el.href,
    poster: el.querySelector("img")?.src
  }));
}

export async function details(url) {
  const res = await fetch(url);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  const title = doc.querySelector(".anime__details__title h3")?.textContent.trim();
  const description = doc.querySelector(".anime__details__text p")?.textContent.trim();
  const episodes = Array.from(doc.querySelectorAll(".episodes a")).map(el => ({
    name: el.textContent.trim(),
    url: el.href
  }));

  return { title, description, episodes, poster: "" };
}

export async function stream(episodeUrl) {
  const res = await fetch(episodeUrl);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  const iframeUrl = doc.querySelector("iframe")?.src;
  if (!iframeUrl) throw new Error("Stream iframe not found");

  const res2 = await fetch(iframeUrl);
  const text2 = await res2.text();
  const m3u8 = text2.match(/(https?:\/\/[^"']+\.m3u8)/)?.[1];
  if (!m3u8) throw new Error("HLS stream URL not found");

  return [{ url: m3u8, quality: "default", subtitles: [] }];
}
