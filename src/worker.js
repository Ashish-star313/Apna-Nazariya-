// ==========================================
// APNA NAZARIYA - THUMBNAIL GENERATOR
// Add this route inside authenticated API routes
// ==========================================

async function generateThumbnails(env, body) {
  if (!env.AI) {
    return json({
      ok: false,
      error: "Cloudflare AI binding missing"
    }, 500);
  }

  const topic = String(body.topic || "").trim();
  const headline = String(body.headline || topic).trim();
  const subline = String(body.subline || "").trim();

  if (!topic || topic.length > 500 || headline.length > 100) {
    return json({
      ok: false,
      error: "Topic or headline is missing or too long"
    }, 400);
  }

  const styles = [
    {
      name: "Breaking Issue",
      prompt: "dramatic Indian current affairs documentary thumbnail background, bold red and black cinematic lighting, strong visual contrast, serious atmosphere, subject on the right side, clean dark empty space on the left for editable Hindi headline"
    },
    {
      name: "Ground Reality",
      prompt: "realistic photojournalistic Indian social documentary scene, everyday Indian street environment, natural human expressions, cinematic depth, subject on the left side, clean empty space on the right for editable headline"
    },
    {
      name: "Data & Analysis",
      prompt: "premium Indian news analysis visual background, subtle data charts, graphs and documents as visual elements, deep blue and yellow cinematic palette, clean composition, empty central area for editable headline"
    },
    {
      name: "Human Story",
      prompt: "emotional but realistic Indian documentary photography, ordinary Indian people, authentic environment, cinematic natural lighting, expressive composition, clear empty space for editable headline"
    },
    {
      name: "Minimal Editorial",
      prompt: "premium minimalist Indian current affairs editorial thumbnail background, sophisticated black white and yellow palette, strong visual hierarchy, subtle cinematic texture, clean negative space for editable Hindi typography"
    }
  ];

  const results = [];

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];

    const prompt = [
      "Create a professional YouTube thumbnail background for an Indian Hindi current affairs channel.",
      "Topic: " + topic,
      "Visual direction: " + style.prompt,
      "IMPORTANT: Do not generate any words, letters, numbers, logos, watermarks or fake newspaper text.",
      "Leave clear empty space where editable Hindi text will be added later.",
      "Wide landscape composition, high contrast, visually clear on a mobile screen.",
      "Do not depict fabricated evidence, fake documents or misleading scenes."
    ].join(" ");

    try {
      const output = await env.AI.run(
        "@cf/black-forest-labs/flux-1-schnell",
        {
          prompt: prompt.slice(0, 2048),
          steps: 4
        }
      );

      if (!output || !output.image) {
        throw new Error("Image model returned no image");
      }

      results.push({
        id: "thumbnail_" + (i + 1),
        name: style.name,
        image: "data:image/jpeg;base64," + output.image,
        prompt,
        editable: {
          headline,
          subline,
          headlineColor: "#ffffff",
          accentColor: "#ffcc00",
          headlinePosition: "left",
          fontSize: 64
        }
      });

    } catch (error) {
      results.push({
        id: "thumbnail_" + (i + 1),
        name: style.name,
        error: String(error.message || error).slice(0, 300),
        prompt
      });
    }
  }

  const successful = results.filter(item => item.image);

  return json({
    ok: successful.length > 0,
    total: results.length,
    successful: successful.length,
    thumbnails: results,
    message: successful.length
      ? "Thumbnail backgrounds generated"
      : "No thumbnail could be generated. Check Workers AI availability."
  });
}