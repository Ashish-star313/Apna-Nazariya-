const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const SESSION_DAYS = 14;
const MAX_PROMPT_LENGTH = 12000;
const MAX_OUTPUT_CONTEXT = 9000;

const BASE_RULES = `
तुम Apna Nazariya के अनुभवी Hindi YouTube Production Team हो।
Channel tagline: सोच अपनी, फैसला आपका।

भाषा:
- सरल बोलचाल वाली हिंदी, हल्का UP/desi touch।
- दो भाइयों की स्वाभाविक बातचीत।
- टीवी एंकर जैसी चिल्लाहट या नकली बहस नहीं।
- Host 1: गंभीर, डेटा और सिस्टम पर ध्यान।
- Host 2: आम आदमी, युवा और जमीनी नजरिया।

Editorial Rules:
- तथ्य, राय, आरोप और अनुमान अलग-अलग बताओ।
- कोई आंकड़ा, तारीख, बयान, स्रोत या घटना invent मत करो।
- उपलब्ध जानकारी से सत्यापन संभव न हो तो UNVERIFIED लिखो।
- किसी राजनीतिक दल या व्यक्ति पर बिना प्रमाण आरोप मत लगाओ।
- Research में स्रोतों के नाम और URLs दो, लेकिन यह दावा मत करो कि URL खोलकर सत्यापन किया है।
- पुरानी जानकारी को वर्तमान बताकर पेश मत करो।
- Script में बोलने लायक भाषा हो, निबंध जैसी भाषा नहीं।
- दोनों hosts को संतुलित बोलने का समय दो।
- अंत में: सोच अपनी, फैसला आपका।

कभी भी fabricated citations या fake statistics मत देना।
`;

const AGENTS = {
  "AI Manager": {
    role: "Executive Producer",
    task: "पूरे वीडियो प्रोजेक्ट की योजना बनाओ। Topic का angle, audience, format, research requirements और production checklist तैयार करो।"
  },
  "Trend Hunter": {
    role: "Trend Researcher",
    task: "दिए गए विषय के संभावित trend angles, audience interest, search intent और discussion opportunities बताओ। Live trend होने का दावा मत करना।"
  },
  "Competitor Intelligence": {
    role: "Competitor Analyst",
    task: "दिए गए reference channels और topic के आधार पर content positioning, presentation patterns, gaps और differentiation strategy बताओ। बिना देखे किसी channel के बारे में specific claims मत करना।"
  },
  "Research & Fact Check": {
    role: "Research Editor",
    task: "Topic के लिए research brief बनाओ। हर claim को VERIFIED FROM PROVIDED MATERIAL, NEEDS SOURCE या UNVERIFIED में classify करो। संभावित authoritative sources बताओ। कोई data invent मत करना।"
  },
  "Human Scriptwriter": {
    role: "Hindi Scriptwriter",
    task: "दो hosts के लिए पूरी natural conversational Hindi YouTube script लिखो। Hook, context, facts, दोनों पक्ष, examples, transitions, conclusion और CTA शामिल करो।"
  },
  "Hook & Retention": {
    role: "Retention Editor",
    task: "पहले 30 seconds के hooks, curiosity loops, pattern interrupts, transitions और retention improvements बनाओ।"
  },
  "Title Specialist": {
    role: "YouTube Title Editor",
    task: "वीडियो के लिए 10 आकर्षक लेकिन ईमानदार titles बनाओ। Clickbait और misleading claims से बचो। Best title चुनकर कारण बताओ।"
  },
  "Thumbnail Designer": {
    role: "Thumbnail Creative Director",
    task: "तीन अलग thumbnail concepts बनाओ। हर concept में मुख्य visual, headline, subline, subject placement, contrast और emotional angle बताओ।"
  },
  "SEO Specialist": {
    role: "YouTube SEO Editor",
    task: "Description, relevant keywords, tags, chapters और hashtags बनाओ। Unrelated trending keywords मत जोड़ो।"
  },
  "Shorts Producer": {
    role: "Short-form Producer",
    task: "Long video से 3-5 Shorts concepts निकालो। हर Short के लिए hook, spoken script, suggested visuals और CTA दो।"
  },
  "Live Producer": {
    role: "Live Show Producer",
    task: "Live show rundown, host handoffs, audience questions, discussion segments और moderation checklist बनाओ।"
  },
  "Editing Assistant": {
    role: "Video Editing Supervisor",
    task: "दो अलग Android phones पर रिकॉर्ड हुए footage को synchronize और edit करने की step-by-step योजना दो। Timeline, cuts, B-roll, captions, audio cleanup, transitions, music levels और export settings बताओ। किसी app को खुद operate करने का दावा मत करना।"
  },
  "Publishing Assistant": {
    role: "Publishing Manager",
    task: "YouTube upload checklist, title, description, thumbnail, playlist, audience settings, subtitles, pinned comment, end screen और publishing schedule तैयार करो। Upload खुद करने का दावा मत करना।"
  },
  "Analytics Specialist": {
    role: "YouTube Data Analyst",
    task: "दिए गए analytics का विश्लेषण करो। CTR, impressions, views, average view duration, retention और traffic sources के आधार पर actionable insights दो। आंकड़े न दिए हों तो invent मत करो।"
  },
  "Growth Strategist": {
    role: "Channel Growth Strategist",
    task: "Channel के लिए practical growth plan, content pillars, weekly schedule, improvement priorities और next-video experiments बनाओ।"
  }
};

const DEFAULT_SEQUENCE = [
  "AI Manager",
  "Trend Hunter",
  "Competitor Intelligence",
  "Research & Fact Check",
  "Human Scriptwriter",
  "Hook & Retention",
  "Title Specialist",
  "Thumbnail Designer",
  "SEO Specialist",
  "Shorts Producer",
  "Editing Assistant",
  "Publishing Assistant",
  "Analytics Specialist",
  "Growth Strategist"
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Project-PIN",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

function now() {
  return new Date().toISOString();
}

function uuid() {
  return crypto.randomUUID();
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), b =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? match[1] : null;
}

function cookieHeader(token, maxAge = SESSION_DAYS * 86400) {
  return `an_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function clearCookie() {
  return "an_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

async function ensureSchema(env) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS login_sessions (
      token_hash TEXT PRIMARY KEY,
      expires_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      url TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      topic TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT,
      input_json TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      status TEXT,
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      error TEXT,
      created_at TEXT,
      updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      project_id TEXT,
      agent_name TEXT,
      status TEXT,
      output TEXT,
      error TEXT,
      created_at TEXT,
      updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS project_outputs (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      agent_name TEXT,
      content TEXT,
      created_at TEXT
    )`
  ];

  for (const sql of statements) {
    await env.DB.prepare(sql).run();
  }
}

async function authenticate(request, env) {
  const token = cookieValue(request, "an_session");
  if (!token) return false;

  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    "SELECT token_hash, expires_at FROM login_sessions WHERE token_hash = ?"
  ).bind(tokenHash).first();

  if (!row) return false;

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare(
      "DELETE FROM login_sessions WHERE token_hash = ?"
    ).bind(tokenHash).run();
    return false;
  }

  return true;
}

async function requireAuth(request, env) {
  return await authenticate(request, env);
}

async function runModel(env, systemPrompt, userPrompt, maxTokens = 2200) {
  if (!env.AI) throw new Error("Cloudflare AI binding उपलब्ध नहीं है।");

  const result = await env.AI.run(MODEL, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    max_tokens: maxTokens,
    temperature: 0.65
  });

  let output = result?.response || result?.result?.response || "";

  if (!output && typeof result === "string") output = result;
  if (!output && result?.output_text) output = result.output_text;

  if (!output || !String(output).trim()) {
    throw new Error("AI से खाली जवाब मिला। दोबारा कोशिश करें।");
  }

  return String(output).trim();
}

async function getProfile(env) {
  const rows = await env.DB.prepare(
    "SELECT key, value FROM settings"
  ).all();

  const profile = {};
  for (const row of rows.results || []) {
    profile[row.key] = row.value;
  }

  const channels = await env.DB.prepare(
    "SELECT url FROM channels"
  ).all();

  profile.referenceChannels = (channels.results || []).map(x => x.url);
  return profile;
}

async function saveProfile(env, body) {
  const allowed = [
    "creatorVoice",
    "hostOne",
    "hostTwo",
    "channelName",
    "tagline",
    "language",
    "extraRules"
  ];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      await env.DB.prepare(
        "INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)"
      ).bind(key, String(body[key])).run();
    }
  }

  if (Array.isArray(body.referenceChannels)) {
    await env.DB.prepare("DELETE FROM channels").run();

    for (const url of body.referenceChannels.slice(0, 20)) {
      if (typeof url === "string" && url.trim()) {
        await env.DB.prepare(
          "INSERT INTO channels (id,url) VALUES (?,?)"
        ).bind(uuid(), url.trim().slice(0, 500)).run();
      }
    }
  }

  return await getProfile(env);
}

function chooseAgents(topic, requested) {
  if (Array.isArray(requested) && requested.length) {
    return requested.filter(name => AGENTS[name]);
  }
  return DEFAULT_SEQUENCE;
}

function buildAgentPrompt(agentName, input, previousOutputs, profile) {
  const agent = AGENTS[agentName];

  const previous = previousOutputs
    .slice(-5)
    .map(x => `\n\n### ${x.agent_name}\n${x.content}`)
    .join("\n");

  return `
PROJECT TOPIC:
${input.topic || "विषय उपलब्ध नहीं"}

VIDEO FORMAT:
${input.format || "Long video"}

TARGET DURATION:
${input.duration || "8-10 मिनट"}

EXTRA INSTRUCTIONS:
${input.instructions || "कोई अतिरिक्त निर्देश नहीं"}

CREATOR PROFILE:
${JSON.stringify(profile || {})}

REFERENCE CHANNELS:
${(profile?.referenceChannels || []).join("\n")}

PREVIOUS WORK:
${previous || "यह पहला चरण है।"}

CURRENT AGENT:
${agentName}

AGENT ROLE:
${agent.role}

TASK:
${agent.task}

पूरी जानकारी और output उपयोगी headings के साथ दो।
${BASE_RULES}
`;
}

async function createProject(env, input, agents) {
  const projectId = uuid();
  const jobId = uuid();
  const timestamp = now();

  await env.DB.prepare(
    `INSERT INTO projects
    (id,topic,status,created_at,updated_at,input_json)
    VALUES (?,?,?,?,?,?)`
  ).bind(
    projectId,
    String(input.topic || "Untitled Project").slice(0, 500),
    "running",
    timestamp,
    timestamp,
    JSON.stringify(input)
  ).run();

  await env.DB.prepare(
    `INSERT INTO workflow_jobs
    (id,project_id,status,current_step,total_steps,error,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?)`
  ).bind(
    jobId,
    projectId,
    "queued",
    0,
    agents.length,
    null,
    timestamp,
    timestamp
  ).run();

  for (const name of agents) {
    await env.DB.prepare(
      `INSERT INTO agent_runs
      (id,job_id,project_id,agent_name,status,output,error,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(
      uuid(),
      jobId,
      projectId,
      name,
      "queued",
      null,
      null,
      timestamp,
      timestamp
    ).run();
  }

  return { projectId, jobId };
}

async function workflowStatus(env, jobId) {
  const job = await env.DB.prepare(
    "SELECT * FROM workflow_jobs WHERE id = ?"
  ).bind(jobId).first();

  if (!job) return null;

  const runs = await env.DB.prepare(
    "SELECT * FROM agent_runs WHERE job_id = ? ORDER BY created_at ASC"
  ).bind(jobId).all();

  return { job, agents: runs.results || [] };
}

async function runNextStep(env, jobId) {
  const job = await env.DB.prepare(
    "SELECT * FROM workflow_jobs WHERE id = ?"
  ).bind(jobId).first();

  if (!job) throw new Error("Workflow नहीं मिला।");
  if (job.status === "completed") return { completed: true };

  const next = await env.DB.prepare(
    `SELECT * FROM agent_runs
     WHERE job_id = ? AND status = 'queued'
     ORDER BY created_at ASC LIMIT 1`
  ).bind(jobId).first();

  if (!next) {
    await env.DB.prepare(
      "UPDATE workflow_jobs SET status='completed',updated_at=? WHERE id=?"
    ).bind(now(), jobId).run();

    await env.DB.prepare(
      "UPDATE projects SET status='completed',updated_at=? WHERE id=?"
    ).bind(now(), job.project_id).run();

    return { completed: true };
  }

  await env.DB.prepare(
    "UPDATE workflow_jobs SET status='running',updated_at=? WHERE id=?"
  ).bind(now(), jobId).run();

  await env.DB.prepare(
    "UPDATE agent_runs SET status='running',updated_at=? WHERE id=?"
  ).bind(now(), next.id).run();

  try {
    const project = await env.DB.prepare(
      "SELECT * FROM projects WHERE id=?"
    ).bind(job.project_id).first();

    const input = JSON.parse(project.input_json || "{}");

    const previous = await env.DB.prepare(
      "SELECT agent_name,content FROM project_outputs WHERE project_id=? ORDER BY created_at ASC"
    ).bind(job.project_id).all();

    const profile = await getProfile(env);
    const prompt = buildAgentPrompt(
      next.agent_name,
      input,
      previous.results || [],
      profile
    );

    const output = await runModel(
      env,
      BASE_RULES,
      prompt.slice(0, MAX_PROMPT_LENGTH),
      2400
    );

    const timestamp = now();

    await env.DB.prepare(
      "UPDATE agent_runs SET status='completed',output=?,updated_at=? WHERE id=?"
    ).bind(output, timestamp, next.id).run();

    await env.DB.prepare(
      `INSERT INTO project_outputs (id,project_id,agent_name,content,created_at)
       VALUES (?,?,?,?,?)`
    ).bind(
      uuid(),
      job.project_id,
      next.agent_name,
      output,
      timestamp
    ).run();

    const completedCount = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM agent_runs WHERE job_id=? AND status='completed'"
    ).bind(jobId).first();

    await env.DB.prepare(
      "UPDATE workflow_jobs SET current_step=?,updated_at=? WHERE id=?"
    ).bind(completedCount.total, timestamp, jobId).run();

    return { completed: false, agent: next.agent_name, output };
  } catch (error) {
    const message = String(error?.message || error);

    await env.DB.prepare(
      "UPDATE agent_runs SET status='error',error=?,updated_at=? WHERE id=?"
    ).bind(message, now(), next.id).run();

    await env.DB.prepare(
      "UPDATE workflow_jobs SET status='paused',error=?,updated_at=? WHERE id=?"
    ).bind(message, now(), jobId).run();

    await env.DB.prepare(
      "UPDATE projects SET status='paused',updated_at=? WHERE id=?"
    ).bind(now(), job.project_id).run();

    throw error;
  }
}

async function generateThumbnail(env, body) {
  if (!env.AI) throw new Error("AI binding उपलब्ध नहीं है।");

  const topic = String(body.topic || "").slice(0, 500);
  const headline = String(body.headline || topic).slice(0, 150);
  const subline = String(body.subline || "").slice(0, 150);

  const styles = [
    "cinematic documentary news photography, dramatic lighting",
    "realistic editorial photojournalism, strong visual storytelling",
    "minimal modern news documentary background, high contrast",
    "cinematic realistic public issue documentary scene",
    "dramatic split composition, realistic photography"
  ];

  const thumbnails = [];

  for (let i = 0; i < styles.length; i++) {
    const prompt = `
Create a professional YouTube thumbnail background image.
Topic: ${topic}
Visual direction: ${styles[i]}.
16:9 horizontal composition.
Photorealistic, high quality.
No words, no letters, no typography, no logo, no watermark.
Keep clear negative space for Hindi headline overlay.
Do not depict fabricated evidence or fake news screenshots.
`;

    try {
      const result = await env.AI.run(IMAGE_MODEL, {
        prompt,
        width: 1280,
        height: 720
      });

      let imageData = result?.image || result?.data?.image || result;

      if (imageData instanceof Uint8Array) {
        imageData = btoa(
          Array.from(imageData, b => String.fromCharCode(b)).join("")
        );
      }

      if (typeof imageData === "string") {
        thumbnails.push({
          id: uuid(),
          name: `Concept ${i + 1}`,
          image: imageData.startsWith("data:")
            ? imageData
            : `data:image/jpeg;base64,${imageData}`,
          headline,
          subline
        });
      }
    } catch (error) {
      thumbnails.push({
        id: uuid(),
        name: `Concept ${i + 1}`,
        error: String(error?.message || error)
      });
    }
  }

  return {
    ok: true,
    total: thumbnails.length,
    successful: thumbnails.filter(x => x.image).length,
    thumbnails
  };
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === "/api/health" && method === "GET") {
    return json({
      ok: true,
      service: "Apna Nazariya AI API",
      version: "4.0"
    });
  }

  if (path === "/api/secret-check" && method === "GET") {
    return json({
      ok: true,
      appLoginIdConfigured: Boolean(env.APP_LOGIN_ID),
      appLoginPasswordConfigured: Boolean(env.APP_LOGIN_PASSWORD),
      databaseConfigured: Boolean(env.DB),
      aiConfigured: Boolean(env.AI)
    });
  }

  if (path === "/api/login" && method === "POST") {
    const body = await readBody(request);

    if (
      !env.APP_LOGIN_ID ||
      !env.APP_LOGIN_PASSWORD ||
      !safeEqual(String(body.loginId || ""), env.APP_LOGIN_ID) ||
      !safeEqual(String(body.password || ""), env.APP_LOGIN_PASSWORD)
    ) {
      return json({ ok: false, error: "गलत Login ID या Password।" }, 401);
    }

    const token = randomToken();
    const tokenHash = await sha256(token);
    const expires = new Date(
      Date.now() + SESSION_DAYS * 86400000
    ).toISOString();

    await env.DB.prepare(
      "INSERT INTO login_sessions (token_hash,expires_at) VALUES (?,?)"
    ).bind(tokenHash, expires).run();

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        ...corsHeaders,
        "Set-Cookie": cookieHeader(token)
      }
    });
  }

  if (path === "/api/logout" && method === "POST") {
    const token = cookieValue(request, "an_session");

    if (token) {
      await env.DB.prepare(
        "DELETE FROM login_sessions WHERE token_hash=?"
      ).bind(await sha256(token)).run();
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        ...corsHeaders,
        "Set-Cookie": clearCookie()
      }
    });
  }

  if (path === "/api/me" && method === "GET") {
    const loggedIn = await authenticate(request, env);
    return json({ ok: true, loggedIn });
  }

  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  if (path === "/api/profile" && method === "GET") {
    return json({ ok: true, profile: await getProfile(env) });
  }

  if (path === "/api/profile" && method === "POST") {
    const body = await readBody(request);
    const profile = await saveProfile(env, body);
    return json({ ok: true, profile });
  }

  if (path === "/api/ai" && method === "POST") {
    const body = await readBody(request);
    const prompt = String(body.prompt || "").slice(0, MAX_PROMPT_LENGTH);

    if (!prompt.trim()) {
      return json({ ok: false, error: "Prompt खाली है।" }, 400);
    }

    const output = await runModel(env, BASE_RULES, prompt, 2400);
    return json({ ok: true, output });
  }

  if (path === "/api/thumbnails/generate" && method === "POST") {
    const body = await readBody(request);
    const result = await generateThumbnail(env, body);
    return json(result);
  }

  if (path === "/api/workflow/start" && method === "POST") {
    const body = await readBody(request);

    if (!String(body.topic || "").trim()) {
      return json({ ok: false, error: "पहले video topic लिखें।" }, 400);
    }

    const agents = chooseAgents(body.topic, body.agents);
    if (!agents.length) {
      return json({ ok: false, error: "कोई valid agent चुना नहीं गया।" }, 400);
    }

    const created = await createProject(env, body, agents);

    return json({
      ok: true,
      projectId: created.projectId,
      jobId: created.jobId,
      totalSteps: agents.length,
      status: "queued"
    });
  }

  if (path === "/api/workflow/step" && method === "POST") {
    const body = await readBody(request);

    if (!body.jobId) {
      return json({ ok: false, error: "jobId जरूरी है।" }, 400);
    }

    const result = await runNextStep(env, body.jobId);
    return json({ ok: true, ...result });
  }

  if (path === "/api/workflow/resume" && method === "POST") {
    const body = await readBody(request);

    await env.DB.prepare(
      "UPDATE agent_runs SET status='queued',error=NULL WHERE job_id=? AND status='error'"
    ).bind(body.jobId).run();

    await env.DB.prepare(
      "UPDATE workflow_jobs SET status='queued',error=NULL,updated_at=? WHERE id=?"
    ).bind(now(), body.jobId).run();

    return json({ ok: true });
  }

  if (path === "/api/workflow/status" && method === "GET") {
    const jobId = url.searchParams.get("jobId");
    if (!jobId) return json({ ok: false, error: "jobId जरूरी है।" }, 400);

    const status = await workflowStatus(env, jobId);
    if (!status) return json({ ok: false, error: "Workflow नहीं मिला।" }, 404);

    return json({ ok: true, ...status });
  }

  if (path === "/api/projects" && method === "GET") {
    const result = await env.DB.prepare(
      "SELECT * FROM projects ORDER BY created_at DESC LIMIT 100"
    ).all();

    return json({ ok: true, projects: result.results || [] });
  }

  const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);

  if (projectMatch && method === "GET") {
    const projectId = projectMatch[1];

    const project = await env.DB.prepare(
      "SELECT * FROM projects WHERE id=?"
    ).bind(projectId).first();

    if (!project) return json({ ok: false, error: "Project नहीं मिला।" }, 404);

    const outputs = await env.DB.prepare(
      "SELECT * FROM project_outputs WHERE project_id=? ORDER BY created_at ASC"
    ).bind(projectId).all();

    const jobs = await env.DB.prepare(
      "SELECT * FROM workflow_jobs WHERE project_id=? ORDER BY created_at DESC"
    ).bind(projectId).all();

    return json({
      ok: true,
      project,
      outputs: outputs.results || [],
      jobs: jobs.results || []
    });
  }

  return json({ ok: false, error: "API route नहीं मिला।" }, 404);
}

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      await ensureSchema(env);

      const url = new URL(request.url);

      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env);
      }

      if (env.ASSETS) {
        return await env.ASSETS.fetch(request);
      }

      return new Response("Apna Nazariya Studio is running.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    } catch (error) {
      return json({
        ok: false,
        error: String(error?.message || error)
      }, 500);
    }
  }
};