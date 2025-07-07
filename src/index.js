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

      // Match all potential video URLs (mp4, m3u8, etc.)
      const allMatches = [...html.matchAll(/https?:\/\/[^\s"'<>]+?\.(mp4|m3u8|webm)(\?[^"'<>]*)?/gi)];

      let selectedUrl = null;

      if (endsWith) {
        // Match the one that ends with given string (like 2160.mp4)
        selectedUrl = allMatches.find(match => match[0].includes(endsWith));
      }

      // If no specific one matched, just pick the first one
      if (!selectedUrl && allMatches.length > 0) {
        selectedUrl = allMatches[0];
      }

      if (selectedUrl && selectedUrl[0]) {
        const videoUrl = selectedUrl[0];

        // Follow redirects with GET (not HEAD)
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
