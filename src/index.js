export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url);
    const inputUrl = searchParams.get("url");
    const endsWith = searchParams.get("end")?.trim(); // e.g., "2160.mp4"

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

      // Collect all potential video URLs
      const allMatches = [...html.matchAll(/https?:\/\/[^\s"'<>]+?\.(mp4|m3u8|webm)(\?[^"'<>]*)?/gi)];

      let selectedUrl = null;

      if (endsWith) {
        for (const match of allMatches) {
          const fullUrl = match[0];
          const urlWithoutQuery = fullUrl.split('?')[0];
          if (urlWithoutQuery.endsWith(endsWith)) {
            selectedUrl = fullUrl;
            break;
          }
        }
      }

      // If no specific match found, fallback to first
      if (!selectedUrl && allMatches.length > 0) {
        selectedUrl = allMatches[0][0];
      }

      if (selectedUrl) {
        // Final GET to follow CDN redirect
        const finalRes = await fetch(selectedUrl, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        const finalUrl = finalRes.url || selectedUrl;

        return Response.redirect(finalUrl, 302);
      }

      return new Response("Video URL not found", { status: 404 });

    } catch (err) {
      return new Response("Error: " + err.message, { status: 500 });
    }
  }
}
