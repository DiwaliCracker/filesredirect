// src/index.js
export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url);
    const inputUrl = searchParams.get("url");

    if (!inputUrl) {
      return new Response("Missing URL", { status: 400 });
    }

    try {
      const res = await fetch(inputUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const html = await res.text();

      // Match .mp4 or .m3u8 from <source> tag
      const match = html.match(/<source[^>]+src="([^"]+\.(mp4|m3u8)[^"]*)"/i);

      if (match && match[1]) {
        return Response.redirect(match[1], 302);
      }

      return new Response("Video not found", { status: 404 });

    } catch (err) {
      return new Response("Error resolving video", { status: 500 });
    }
  }
};
