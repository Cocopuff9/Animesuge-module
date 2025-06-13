const BASE_URL = "https://animesugetv.se";

export async function search(query) {
    const res = await fetch(`${BASE_URL}/search.html?keyword=${encodeURIComponent(query)}`);
    const html = await res.text();

    const items = [];
    const regex = /<a href="(\/anime\/[^"]+)"[^>]*title="([^"]+)">[\s\S]*?<img src="([^"]+)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        items.push({
            title: match[2],
            url: BASE_URL + match[1],
            image: match[3].startsWith("http") ? match[3] : "https:" + match[3]
        });
    }

    return items;
}

export async function details(url) {
    const res = await fetch(url);
    const html = await res.text();

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const imageMatch = html.match(/class="film-poster-img"[^>]+src="([^"]+)"/);
    const epRegex = /<a href="(\/watch\/[^"]+)"[^>]*>([^<]+)<\/a>/g;

    const episodes = [];
    let epMatch;
    while ((epMatch = epRegex.exec(html)) !== null) {
        episodes.push({
            title: epMatch[2],
            url: BASE_URL + epMatch[1]
        });
    }

    return {
        title: titleMatch ? titleMatch[1] : "Unknown Title",
        image: imageMatch ? (imageMatch[1].startsWith("http") ? imageMatch[1] : "https:" + imageMatch[1]) : "",
        episodes: episodes.reverse() // newer first
    };
}

export async function stream(url) {
    const res = await fetch(url);
    const html = await res.text();

    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/);
    if (!iframeMatch) throw new Error("No iframe found");

    const embedUrl = iframeMatch[1].startsWith("http") ? iframeMatch[1] : "https:" + iframeMatch[1];
    const embedRes = await fetch(embedUrl);
    const embedHtml = await embedRes.text();

    const sourceMatch = embedHtml.match(/"file":"([^"]+\.m3u8)"/);
    if (!sourceMatch) throw new Error("No stream URL found");

    return {
        stream: sourceMatch[1]
    };
}
