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
      let match = null;

      // Match standard <source src="...">
      match = html.match(/<source[^>]+src="([^"]+\.(mp4|m3u8)[^"]*)"/i);

      // Fallback: direct URLs
      if (!match) {
        match = html.match(/(https?:\/\/[^\s"'<>]+?\.(mp4|m3u8|vid)(\?[^"'<>]*)?)/i);
      }

      // Fallback: any link with id= or file=
      if (!match) {
        match = html.match(/(https?:\/\/[^\s"'<>]+?\.(php|html|vid)\?[^"'<>]*(v=|id=|file=)[^"'<>]*)/i);
      }

      // ✅ Special handling for febbox.com
      if (!match && inputUrl.includes("febbox.com/share")) {
        // Try to find iframe with mp4 or player
        match = html.match(/<iframe[^>]+src="([^"]*player[^"]+)"[^>]*>/i);

        // Try to find obfuscated video URLs in JSON or JS inside the page
        if (!match) {
          match = html.match(/(https:\/\/[^"'<>]+\/[^"'<>]+\.mp4[^"'<>]*)/i);
        }

        // Last fallback for febbox-style dynamic embed links
        if (!match) {
          match = html.match(/(https:\/\/[^"'<>]+\/get_file[^"'<>]*)/i);
        }
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
