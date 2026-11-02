
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-Project-PIN"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (url.pathname === "/api/health") {
      return Response.json(
        { ok: true, service: "Apna Nazariya AI API" },
        { headers: cors }
      );
    }

    if (url.pathname.startsWith("/api/")) {
      if (
        !env.PROJECT_PIN ||
        request.headers.get("X-Project-PIN") !== env.PROJECT_PIN
      ) {
        return Response.json(
          { ok: false, error: "Unauthorized" },
          { status: 401, headers: cors }
        );
      }

      if (url.pathname === "/api/profile" && request.method === "POST") {
        const body = await request.json();

        await env.DB.prepare(
          "INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)"
        ).bind("voice", String(body.voice || "")).run();

        await env.DB.prepare("DELETE FROM channels").run();

        for (const link of (body.channels || []).slice(0, 50)) {
          await env.DB.prepare(
            "INSERT INTO channels (url) VALUES (?)"
          ).bind(String(link).slice(0, 500)).run();
        }

        return Response.json({ ok: true }, { headers: cors });
      }

      if (url.pathname === "/api/profile" && request.method === "GET") {
        const voice = await env.DB.prepare(
          "SELECT value FROM settings WHERE key='voice'"
        ).first();

        const channels = await env.DB.prepare(
          "SELECT url FROM channels ORDER BY id"
        ).all();

        return Response.json(
          {
            ok: true,
            voice: voice?.value || "",
            channels: channels.results || []
          },
          { headers: cors }
        );
      }

      if (url.pathname === "/api/ai" && request.method === "POST") {
        try {
          if (!env.AI) {
            return Response.json(
              { ok: false, error: "AI binding missing" },
              { status: 500, headers: cors }
            );
          }

          const body = await request.json();
          const prompt = String(body.prompt || "").trim();

          if (!prompt || prompt.length > 6000) {
            return Response.json(
              { ok: false, error: "Prompt missing or too long" },
              { status: 400, headers: cors }
            );
          }

          const result = await env.AI.run(
            "@cf/google/gemma-4-26b-a4b-it",
            {
              messages: [
                {
                  role: "system",
                  content: "You are Apna Nazariya AI. Reply in natural Hindi. Be factual, clear and honest. Never invent facts or sources."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              chat_template_kwargs: {
                enable_thinking: false
              },
              max_tokens: 1200
            }
          );

          const answer =
            result?.choices?.[0]?.message?.content ||
            result?.response ||
            "";

          if (!answer) {
            return Response.json(
              {
                ok: false,
                error: "Model returned an empty answer",
                details: JSON.stringify(result).slice(0, 1500)
              },
              { status: 502, headers: cors }
            );
          }

          return Response.json(
            { ok: true, answer },
            { headers: cors }
          );

        } catch (error) {
          return Response.json(
            {
              ok: false,
              error: "AI request failed",
              details: String(error.message || error)
            },
            { status: 500, headers: cors }
          );
        }
      }

      return Response.json(
        { ok: false, error: "Not found" },
        { status: 404, headers: cors }
      );
    }

    return env.ASSETS.fetch(request);
  }
};
