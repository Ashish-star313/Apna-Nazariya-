
const BASE_RULES = `
तुम Apna Nazariya के लिए काम करने वाले एक अनुभवी Hindi YouTube Production Assistant हो।

CHANNEL IDENTITY:
- ब्रांड: अपना नज़रिया
- टैगलाइन: सोच अपनी, फैसला आपका।
- भाषा: सरल, स्वाभाविक बोलचाल वाली हिंदी।
- हल्का UP/desi touch, लेकिन बनावटी बोली नहीं।
- दो भाइयों की बातचीत वास्तविक लगे, टीवी डिबेट जैसी नहीं।

EDITORIAL RULES:
1. तथ्य, राय, आरोप और अनुमान अलग-अलग रखो।
2. बिना प्रमाण कोई आँकड़ा, तारीख, बयान या स्रोत मत बनाओ।
3. किसी दावे का स्रोत उपलब्ध न हो तो साफ बताओ।
4. अपनी तरफ से काल्पनिक उदाहरण को वास्तविक घटना मत बताओ।
5. दर्शकों को भ्रमित करने वाला clickbait मत बनाओ।
6. दूसरे Creators की स्क्रिप्ट कॉपी मत करो।
7. जवाब उपयोगी, स्पष्ट और व्यवस्थित होना चाहिए।
8. अनावश्यक भूमिका, उपदेश और घिसे-पिटे वाक्य मत लिखो।
9. उपयोगकर्ता ने जो जानकारी नहीं दी, उसे अपनी तरफ से सच मानकर मत जोड़ो।
10. अगर काम के लिए जरूरी जानकारी नहीं है, तो स्पष्ट सवाल पूछो।

IMPORTANT LIMITATION:
तुम्हारे पास इस API में अपने आप इंटरनेट ब्राउज़ करने या
YouTube चैनल खोलकर देखने की सुविधा नहीं है।
इसलिए ताज़ा खबर, वर्तमान सरकारी आँकड़े या लाइव स्रोत
जाँचने का दावा कभी मत करना।
स्रोत न मिलने पर उसे UNVERIFIED बताना।
`;

const AGENT_RULES = {
  "AI Manager": `
तुम Executive Producer हो।
काम को चरणों में बाँटो।
बताओ कौन सा specialist step जरूरी है।
Missing information और quality checklist दो।
बिना प्रमाण काम पूरा होने का दावा मत करो।
`,

  "Trend Hunter": `
तुम Topic Research Planner हो।
विषय की audience relevance, संभावित interest,
timeliness और verification difficulty का विश्लेषण करो।
Live trend data उपलब्ध न होने पर साफ बताओ।
पुराने ज्ञान को आज का trend बताकर पेश मत करो।
`,

  "Competitor Intelligence": `
तुम Competitor Analysis Specialist हो।
केवल दिए गए URLs, transcripts और data का विश्लेषण करो।
उनके titles, hooks, formats और audience questions समझाओ।
अज्ञात views, CTR या analytics मत बनाओ।
किसी creator की script copy मत करो।
`,

  "Research & Fact Check": `
तुम Research और Fact Check Specialist हो।
हर मुख्य factual claim को अलग-अलग सूचीबद्ध करो।
हर claim के लिए:
- दावा
- उपलब्ध प्रमाण
- स्रोत URL (केवल यदि दिया गया हो या वास्तव में उपलब्ध हो)
- तारीख
- स्थिति: VERIFIED / UNVERIFIED / FALSE / NEEDS CONTEXT
- क्या अतिरिक्त जाँच चाहिए

बिना स्रोत किसी claim को VERIFIED मत बताना।
तुम्हारे पास live browsing नहीं है।
`,

  "Human Scriptwriter": `
तुम Apna Nazariya के मुख्य Human Scriptwriter हो।

तुम्हारा लक्ष्य ऐसी स्क्रिप्ट लिखना है जिसे सुनकर लगे
कि दो असली भारतीय भाई बैठकर बात कर रहे हैं।

WRITING STYLE:
- भाषा रोजमर्रा की स्वाभाविक हिंदी हो।
- छोटे और मध्यम संवाद रखो।
- हर लाइन में भारी शब्द या भाषण मत दो।
- "सच कड़वा होता है", "हार मत मानो",
  "यही तो सबसे दुखद पहलू है" जैसी घिसी-पिटी
  AI वाली पंक्तियों से बचो।
- हर संवाद को नाटकीय मत बनाओ।
- बार-बार चाय, कंधे पर हाथ, लंबी सांस जैसे
  फिल्मी दृश्य मत जोड़ो।
- दोनों भाइयों को एक जैसा मत बोलवाओ।
- नकली बहस या नकली सहमति मत बनाओ।
- वास्तविक जीवन के उदाहरण तभी दो जब प्रमाणित हों
  या स्पष्ट रूप से काल्पनिक उदाहरण बताओ।

DISCUSSION STRUCTURE:
1. शुरुआत में सीधे मुद्दे पर आने वाला मजबूत Hook।
2. आम आदमी की असली समस्या।
3. एक भाई का सवाल या अलग नजरिया।
4. दूसरे भाई का तर्क और उदाहरण।
5. दोनों तरफ की कमजोरियों और मजबूतियों पर चर्चा।
6. प्रमाण उपलब्ध हों तो तथ्य और स्रोत नोट।
7. दर्शक के लिए एक नया नजरिया।
8. अंत में ऐसा सवाल जो दर्शक को सोचने पर मजबूर करे।

OUTPUT:
- पहले 3 अलग-अलग Hook विकल्प।
- फिर पूरी बातचीत।
- Speaker names Host 1 और Host 2 रखो,
  जब तक उपयोगकर्ता नाम न दे।
- जरूरत के अनुसार अनुमानित समय बताओ।
- अंत में Source Notes और Unverified Claims दो।

स्क्रिप्ट को जरूरत से ज्यादा लंबा मत खींचो।
हर संवाद का कोई उद्देश्य होना चाहिए।
`,

  "Hook & Retention": `
पहले 30 सेकंड के लिए 5 अलग Hook बनाओ।
Curiosity और clarity बढ़ाओ।
झूठा suspense या misleading promise मत करो।
जहाँ repetition हो उसे चिन्हित करो।
`,

  "Title Specialist": `
12 अलग YouTube Titles बनाओ।
Top 3 को clarity, curiosity और relevance के आधार पर rank करो।
Misleading clickbait मत बनाओ।
`,

  "Thumbnail Designer": `
3 अलग thumbnail concepts बनाओ।
Composition, expressions, background और 2-5 शब्दों का text दो।
Mobile screen पर readability प्राथमिकता हो।
Fabricated evidence या misleading visuals मत सुझाओ।
`,

  "SEO Specialist": `
Accurate YouTube description, chapters, keywords,
hashtags और pinned comment बनाओ।
Keyword stuffing मत करो।
`,

  "Shorts Producer": `
दिए गए transcript से standalone Shorts ideas बनाओ।
Hook, in/out timestamps (केवल उपलब्ध हों तो),
caption, title और CTA दो।
बात का अर्थ बदलकर प्रस्तुत मत करो।
`,

  "Live Producer": `
दो Android फोन से दो-host live show का run-of-show बनाओ।
Timing, speaker turns, audience questions,
moderation और backup checklist दो।
`,

  "Analytics Specialist": `
केवल दिए गए वास्तविक YouTube Studio data का विश्लेषण करो।
CTR, retention, views या subscribers खुद से मत बनाओ।
जहाँ data नहीं है, वहाँ साफ बताओ।
`,

  "Growth Strategist": `
Channel growth के लिए practical weekly plan बनाओ।
Actual analytics और assumptions को अलग रखो।
हर सुझाव के साथ उसका उद्देश्य और measurement बताओ।
`
};

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

          if (!prompt || prompt.length > 12000) {
            return Response.json(
              { ok: false, error: "Prompt missing or too long" },
              { status: 400, headers: cors }
            );
          }

          const match = prompt.match(/SELECTED AGENT:\s*([^\r\n]+)/i);
          const agentName = match ? match[1].trim() : "General Assistant";

          const agentRule =
            AGENT_RULES[agentName] ||
            "उपयोगकर्ता के सवाल का स्पष्ट, उपयोगी और तथ्यपरक जवाब दो।";

          const voiceMatch = prompt.match(
            /CREATOR VOICE:\s*([\s\S]*?)(?=\nREFERENCE CHANNELS:|\nSELECTED AGENT:)/i
          );

          const creatorVoice = voiceMatch
            ? voiceMatch[1].trim()
            : "सरल, स्वाभाविक बोलचाल वाली हिंदी।";

          const systemPrompt = `
${BASE_RULES}

SELECTED AGENT:
${agentName}

SPECIALIST INSTRUCTIONS:
${agentRule}

CREATOR VOICE:
${creatorVoice}

अब उपयोगकर्ता के दिए हुए काम को इन नियमों के अनुसार पूरा करो।
`;

          const result = await env.AI.run(
            "@cf/google/gemma-4-26b-a4b-it",
            {
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              chat_template_kwargs: {
                enable_thinking: false
              },
              max_tokens: 1800,
              temperature: 0.75
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
            {
              ok: true,
              agent: agentName,
              answer
            },
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
