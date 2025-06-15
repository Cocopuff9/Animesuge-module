// ==UserScript==
// @name         AnimeSuge Scraper (Cineby Style)
// @namespace    SoraModules
// @version      1.0.0
// @description  Scraper module for animesugetv.se in Sora’s Cineby-compatible format
// @author       Cocopuff
// @match        https://animesugetv.se/*
// ==/UserScript==

export default class AnimeSuge {
  constructor() {
    this.name = "AnimeSuge";
    this.baseURL = "https://animesugetv.se";
  }

  async search(query) {
    const url = `${this.baseURL}/search.html?keyword=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    const results = [];

    for (const el of doc.querySelectorAll(".anime__details a")) {
      const title = el.querySelector("h5")?.textContent?.trim();
      const link = el.href;
      const poster = el.querySelector("img")?.src;
      if (title && link) {
        results.push({
          title,
          url: link.startsWith("http") ? link : this.baseURL + link,
          poster: poster?.startsWith("http") ? poster : (poster ? "https:" + poster : "")
        });
      }
    }
    return results;
  }

  async fetchAnimeInfo(animeUrl) {
    const res = await fetch(animeUrl);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");

    const title = doc.querySelector(".anime__details__title h3")?.textContent?.trim() || "Untitled";
    const poster = doc.querySelector(".film-poster-img")?.src || "";
    const description = doc.querySelector(".anime__details__text p")?.textContent?.trim() || "";

    const episodes = [];
    for (const el of doc.querySelectorAll(".episodes a")) {
      const epTitle = el.textContent?.trim() || "Episode";
      const epUrl = el.href.startsWith("http") ? el.href : this.baseURL + el.getAttribute("href");
      episodes.push({ title: epTitle, url: epUrl });
    }
    // Ensure correct order if needed:
    return { title, poster, description, episodes };
  }

  async loadEpisodeSources(epUrl) {
    const res = await fetch(epUrl);
    const html = await res.text();
    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/);
    if (!iframeMatch) throw new Error("iframe not found");
    const embedUrl = (iframeMatch[1].startsWith("http") ? iframeMatch[1] : "https:" + iframeMatch[1]);

    const embedRes = await fetch(embedUrl);
    const embedText = await embedRes.text();
    const m3u8Match = /"file":"([^"]+\.m3u8)"/.exec(embedText);
    if (!m3u8Match) throw new Error("stream not found");

    return [
      {
        url: m3u8Match[1],
        type: "hls",
        quality: "default"
      }
    ];
  }

  // Core Sora methods mapped exactly as Cineby:
  async load({ query }) {
    return this.search(query);
  }

  async info({ url }) {
    return this.fetchAnimeInfo(url);
  }

  async sources({ url }) {
    return this.loadEpisodeSources(url);
  }
}
