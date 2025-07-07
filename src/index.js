export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url);
    const inputUrl = searchParams.get("url");
    const endsWith = searchParams.get("end"); // e.g., 2160.mp4

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
      let match;

      // If `end` is provided, look for a URL ending with that string
      if (endsWith) {
        const regex = new RegExp(`https?:\/\/[^"'<>\\s]+${endsWith.replace(/\./g, '\\.')}`, 'i');
        match = html.match(regex);
      }

      // Try matching <source src="..."> for mp4/m3u8
      if (!match) {
        match = html.match(/<source[^>]+src="([^"]+\.(mp4|m3u8)[^"]*)"/i);
      }

      // Fallback to any video-like URL
      if (!match) {
        match = html.match(/(https?:\/\/[^\s"'<>]+?\.(mp4|m3u8|vid)(\?[^"'<>]*)?)/i);
      }

      // Final fallback: URLs with query parameters
      if (!match) {
        match = html.match(/(https?:\/\/[^\s"'<>]+?\.(php|html|vid)\?[^"'<>]*(v=|id=|file=)[^"'<>]*)/i);
      }

      if (match && match[0]) {
        const videoUrl = match[0];

        // 🔁 Fetch to follow redirection and get the final temporary CDN URL
        const followRes = await fetch(videoUrl, {
          method: "HEAD",
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        const finalUrl = followRes.url || videoUrl;

        return Response.redirect(finalUrl, 302);
      }

      return new Response("Video not found", { status: 404 });

    } catch (err) {
      return new Response("Error resolving video: " + err.message, { status: 500 });
    }
  }
}
