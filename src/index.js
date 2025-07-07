export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url);
    const inputUrl = searchParams.get("url");
    const endsWith = searchParams.get("end"); // e.g., "2160.mp4"

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

      // If `end` param is provided, match any URL that ends with or includes it (allow trailing query strings)
      if (endsWith) {
        const regex = new RegExp(`https?:\\/\\/[^"'<>\\s]+${endsWith.replace(/\./g, "\\.")}(\\?[^"'<>\\s]*)?`, "i");
        match = html.match(regex);
      }

      // Try matching <source src="..."> for mp4/m3u8
      if (!match) {
        match = html.match(/<source[^>]+src="([^"]+\.(mp4|m3u8)[^"]*)"/i);
      }

      // Try common video URL patterns
      if (!match) {
        match = html.match(/(https?:\/\/[^\s"'<>]+?\.(mp4|m3u8|vid)(\?[^"'<>]*)?)/i);
      }

      // Final fallback: URLs with query parameters
      if (!match) {
        match = html.match(/(https?:\/\/[^\s"'<>]+?\.(php|html|vid)\?[^"'<>]*(v=|id=|file=)[^"'<>]*)/i);
      }

      if (match && match[0]) {
        const videoUrl = match[1] || match[0];

        // 🔁 Force a GET request to follow any redirect and get final CDN link
        const followRes = await fetch(videoUrl, {
          method: "GET",
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
      return new Response("Error: " + err.message, { status: 500 });
    }
  }
}
