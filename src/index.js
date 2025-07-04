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

      // Try matching standard <source src="...">
      let match = html.match(/<source[^>]+src="([^"]+\.(mp4|m3u8)[^"]*)"/i);

      // Fallback: try direct video URLs in JS or links
      if (!match) {
        match = html.match(/(https?:\/\/[^\s"'<>]+?\.(mp4|m3u8|vid)(\?[^"'<>]*)?)/i);
      }

      // Fallback: try any link with id= or v= or ?file=
      if (!match) {
        match = html.match(/(https?:\/\/[^\s"'<>]+?\.(php|html|vid)\?[^"'<>]*(v=|id=|file=)[^"'<>]*)/i);
      }

      if (match && match[1]) {
        return Response.redirect(match[1], 302);
      }

      return new Response("Video not found", { status: 404 });

    } catch (err) {
      return new Response("Error resolving video", { status: 500 });
    }
  }
}
