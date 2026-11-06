// Redeploy after login secrets configuration
const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const SESSION_DAYS = 14;
const MAX_PROMPT_LENGTH = 12000;
const MAX_OUTPUT_CONTEXT = 9000;

const BASE_RULES = `
तुम Apna Nazariya के अनुभवी Hindi YouTube Production Assistant हो।

ब्रांड: अपना नज़रिया
टैगलाइन: सोच अपनी, फैसला आपका।
भाषा: सरल, स्वाभाविक बोलचाल वाली हिंदी, हल्का UP/desi touch।
दो भाइयों की बातचीत वास्तविक लगे, टीवी डिबेट जैसी नहीं।

EDITORIAL RULES:
1. तथ्य, राय, आरोप और अनुमान अलग-अलग रखो।
2. बिना प्रमाण कोई आँकड़ा, तारीख, बयान या स्रोत मत बनाओ।
3. स्रोत उपलब्ध न हो तो UNVERIFIED बताओ।
4. काल्पनिक उदाहरण को वास्तविक घटना मत बताओ।
5. Misleading clickbait मत बनाओ।
6. दूसरे Creators की स्क्रिप्ट कॉपी मत करो।
7. अपनी तरफ से live browsing या YouTube research करने का दावा मत करो।
8. उपलब्ध जानकारी और assumptions अलग रखो।
9. जरूरी जानकारी गायब हो तो स्पष्ट बताओ।
10. हर जवाब उपयोगी, स्पष्ट और व्यवस्थित होना चाहिए।

IMPORTANT:
इस Worker AI API में live web browsing उपलब्ध नहीं है।
दिए गए URLs अपने आप खुलने या verify होने की गारंटी नहीं है।
बिना वास्तविक प्रमाण किसी claim को VERIFIED मत बताना।
`;

const AGENTS = {
  "AI Manager": `
तुम Executive Producer हो।
काम को छोटे और स्पष्ट चरणों में बाँटो।
दिए गए काम के अनुसार specialist की भूमिका समझो।
Missing information, risks और quality checklist बताओ।
अंत में अगले Agent के लिए उपयोगी निर्देश दो।
`,

  "Trend Hunter": `
तुम Topic Research Planner हो।
Audience relevance, timeliness, interest और verification difficulty का विश्लेषण करो।
Live trend data उपलब्ध न होने पर साफ बताओ।
पुराने ज्ञान को आज का trend मत बताओ।
5 practical topic angles और उनके verification points दो।
`,

  "Competitor Intelligence": `
तुम Competitor Analysis Specialist हो।
केवल दिए गए URLs, transcripts और data का विश्लेषण करो।
Titles, hooks, formats, audience questions और content gaps समझाओ।
अज्ञात views, CTR या analytics मत बनाओ।
किसी creator की script copy मत करो।
`,

  "Research & Fact Check": `
तुम Research और Fact Check Specialist हो।
मुख्य factual claims अलग-अलग सूचीबद्ध करो।
हर claim के लिए:
- दावा
- उपलब्ध प्रमाण
- स्रोत URL, यदि वास्तव में दिया गया हो
- तारीख, यदि उपलब्ध हो
- स्थिति: VERIFIED / UNVERIFIED / FALSE / NEEDS CONTEXT
- आगे क्या जाँचना चाहिए

बिना स्रोत किसी claim को VERIFIED मत बताना।
`,

  "Human Scriptwriter": `
तुम Apna Nazariya के मुख्य Human Scriptwriter हो।

दो असली भारतीय भाइयों की स्वाभाविक बातचीत लिखो।

STYLE:
- रोजमर्रा की हिंदी।
- छोटे और मध्यम संवाद।
- भारी भाषण और फिल्मी नाटकीयता से बचो।
- दोनों Hosts की आवाज और नजरिया अलग रखो।
- नकली बहस या नकली सहमति मत बनाओ।
- प्रमाणित उदाहरण ही वास्तविक घटना की तरह लिखो।
- काल्पनिक उदाहरण को काल्पनिक बताओ।

STRUCTURE:
1. मजबूत Hook।
2. आम आदमी की समस्या।
3. Host 1 का नजरिया।
4. Host 2 का सवाल या अलग तर्क।
5. दोनों पक्षों की कमजोरियाँ और मजबूती।
6. उपलब्ध तथ्य और Source Notes।
7. दर्शक के लिए नया नजरिया।
8. अंत में सोचने वाला सवाल और CTA।

पहले 3 Hook विकल्प दो।
फिर पूरी बातचीत।
Speaker names Host 1 और Host 2 रखो।
अनुमानित समय बताओ।
अंत में Source Notes और Unverified Claims दो।
`,

  "Hook & Retention": `
पहले 30 सेकंड के लिए 5 अलग Hook बनाओ।
Curiosity और clarity बढ़ाओ।
झूठा suspense मत बनाओ।
Pacing, transitions और repetition की समीक्षा करो।
`,

  "Title Specialist": `
12 YouTube Titles बनाओ।
Top 3 को clarity, curiosity और relevance के आधार पर rank करो।
Misleading clickbait मत बनाओ।
`,

  "Thumbnail Designer": `
3 अलग thumbnail concepts बनाओ।
Composition, expressions, background और 2-5 शब्दों का text दो।
Mobile readability प्राथमिकता हो।
Fabricated evidence या misleading visuals मत सुझाओ।
`,

  "SEO Specialist": `
Accurate YouTube description, chapters, keywords,
hashtags, source links और pinned comment बनाओ।
Keyword stuffing मत करो।
`,

  "Shorts Producer": `
दिए गए transcript से standalone Shorts ideas बनाओ।
Hook, timestamps केवल उपलब्ध हों तो,
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
जहाँ data नहीं है, साफ बताओ।
`,

  "Growth Strategist": `
Channel growth के लिए practical weekly plan बनाओ।
Actual analytics और assumptions अलग रखो।
हर सुझाव के साथ उद्देश्य और measurement बताओ।
`
};

function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const parts = cookie.split(";");

  for (const part of parts) {
    const index = part.indexOf("=");
    if (index < 0) continue;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (key === name) return value;
  }

  return "";
}

function makeCookie(token, maxAge) {
  return [
    `an_session=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ].join("; ");
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));

  return Array.from(bytes)
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a, b) {
  const encoder = new TextEncoder();
  const x = encoder.encode(String(a || ""));
  const y = encoder.encode(String(b || ""));

  let diff = x.length ^ y.length;
  const max = Math.max(x.length, y.length);

  for (let i = 0; i < max; i++) {
    diff |= (x[i] || 0) ^ (y[i] || 0);
  }

  return diff === 0;
}

function sameOrigin(request, url) {
  const origin = request.headers.get("Origin");

  if (!origin) return true;

  try {
    return new URL(origin).origin === url.origin;
  } catch {
    return false;
  }
}

function makeId() {
  return crypto.randomUUID();
}

async function authenticate(request, env) {
  const token = getCookie(request, "an_session");

  if (!token || !env.DB) return null;

  const tokenHash = await sha256(token);

  const session = await env.DB.prepare(`
    SELECT id, expires_at
    FROM login_sessions
    WHERE token_hash = ?
    LIMIT 1
  `).bind(tokenHash).first();

  if (!session) return null;

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await env.DB.prepare(
      "DELETE FROM login_sessions WHERE id = ?"
    ).bind(session.id).run();

    return null;
  }

  await env.DB.prepare(`
    UPDATE login_sessions
    SET last_seen_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(session.id).run();

  return {
    id: session.id,
    tokenHash
  };
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function runModel(env, systemPrompt, userPrompt) {
  if (!env.AI) {
    throw new Error("AI binding missing");
  }

  const result = await env.AI.run(MODEL, {
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    chat_template_kwargs: {
      enable_thinking: false
    },
    max_tokens: 1800,
    temperature: 0.65
  });

  const answer =
    result?.choices?.[0]?.message?.content ||
    result?.response ||
    "";

  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("Model returned an empty answer");
  }

  return answer.trim();
}

function buildAgentPrompt(agent, input, previousOutputs) {
  const history = previousOutputs
    .map(item => {
      return `
AGENT: ${item.agent_name}
OUTPUT:
${String(item.output_text || "").slice(0, 2200)}
`;
    })
    .join("\n")
    .slice(-MAX_OUTPUT_CONTEXT);

  return `
PROJECT: APNA NAZARIYA

TOPIC:
${input.topic || ""}

ADDITIONAL CONTEXT:
${input.extra || "कोई अतिरिक्त जानकारी नहीं।"}

CREATOR VOICE:
${input.voice || "सरल बोलचाल वाली हिंदी, हल्का UP/desi touch।"}

REFERENCE CHANNELS:
${(input.channels || []).join("\n") || "कोई URL नहीं दिया गया।"}

PREVIOUS AGENT OUTPUTS:
${history || "यह पहला specialist step है।"}

CURRENT AGENT:
${agent}

CURRENT AGENT INSTRUCTIONS:
${AGENTS[agent] || "काम का स्पष्ट और उपयोगी जवाब दो।"}

ध्यान रहे:
- पुराने outputs को बिना जाँच सही मत मानो।
- गलत या unsupported claim को आगे मत बढ़ाओ।
- जरूरी कमी हो तो स्पष्ट लिखो।
- पूरा जवाब हिंदी में और human review के लिए तैयार रखो।
`;
}

/*
  Workflow routing:
  AI Manager हमेशा पहला step है।
  बाकी Agents विषय और उपयोगकर्ता के काम के अनुसार चुने जाते हैं।
  यह routing rule-based है, live browsing नहीं।
*/
function chooseAgents(topic, extra) {
  const text = `${topic} ${extra}`.toLowerCase();
  const selected = ["AI Manager"];

  const add = name => {
    if (!selected.includes(name)) selected.push(name);
  };

  if (
    /trend|trending|viral|आज|ताजा|ताज़ा|current|news|खबर|मुद्दा|विषय/i.test(text)
  ) {
    add("Trend Hunter");
  }

  if (
    /competitor|competitors|reference channel|दूसरे चैनल|प्रतिस्पर्धी|youtube channel/i.test(text)
  ) {
    add("Competitor Intelligence");
  }

  if (
    /fact|verify|research|रिसर्च|स्रोत|आंक|आँक|सरकार|राजनीति|चुनाव|बेरोजगार|रोजगार|कानून|दावा|डेटा|data/i.test(text)
  ) {
    add("Research & Fact Check");
  }

  if (
    /script|स्क्रिप्ट|वीडियो|video|discussion|चर्चा|बातचीत|long form/i.test(text)
  ) {
    add("Human Scriptwriter");
    add("Hook & Retention");
    add("Title Specialist");
    add("Thumbnail Designer");
    add("SEO Specialist");
  }

  if (/shorts|short video|रील|reel/i.test(text)) {
    add("Shorts Producer");
  }

  if (/live|लाइव|stream|स्ट्रीम/i.test(text)) {
    add("Live Producer");
  }

  if (/analytics|analysis|ctr|retention|views|views|youtube studio|एनालिटिक्स/i.test(text)) {
    add("Analytics Specialist");
  }

  if (/growth|strategy|channel grow|ग्रोथ|विकास|योजना/i.test(text)) {
    add("Growth Strategist");
  }

  if (selected.length === 1) {
    add("Research & Fact Check");
    add("Human Scriptwriter");
    add("Hook & Retention");
    add("Title Specialist");
    add("Thumbnail Designer");
    add("SEO Specialist");
  }

  return selected;
}

async function saveProfile(env, body) {
  const voice = String(body.voice || "").slice(0, 5000);

  await env.DB.prepare(`
    INSERT OR REPLACE INTO settings (key, value)
    VALUES ('voice', ?)
  `).bind(voice).run();

  /*
    Default: पुराने URLs को सुरक्षित रखते हुए नए URLs जोड़ो।
    Replace तभी होगा जब replaceChannels=true स्पष्ट रूप से भेजा जाए।
  */
  if (Array.isArray(body.channels)) {
    const channels = [...new Set(
      body.channels
        .map(x => String(x || "").trim())
        .filter(x => /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(x))
        .map(x => x.slice(0, 500))
    )].slice(0, 50);

    const statements = [];

    if (body.replaceChannels === true) {
      statements.push(
        env.DB.prepare("DELETE FROM channels")
      );
    }

    for (const link of channels) {
      statements.push(
        env.DB.prepare(`
          INSERT INTO channels (url)
          SELECT ?
          WHERE NOT EXISTS (
            SELECT 1 FROM channels WHERE url = ?
          )
        `).bind(link, link)
      );
    }

    if (statements.length) {
      await env.DB.batch(statements);
    }
  }
}

async function getProfile(env) {
  const voice = await env.DB.prepare(`
    SELECT value FROM settings WHERE key = 'voice'
  `).first();

  const channels = await env.DB.prepare(`
    SELECT id, url FROM channels ORDER BY id
  `).all();

  return {
    ok: true,
    voice: voice?.value || "",
    channels: channels.results || []
  };
}

async function startWorkflow(env, body) {
  const topic = String(body.topic || "").trim();
  const extra = String(body.extra || "").trim();

  if (!topic || topic.length > 5000 || extra.length > 5000) {
    return json({
      ok: false,
      error: "Valid topic is required. Maximum length is 5000 characters."
    }, 400);
  }

  const profile = await getProfile(env);

  const input = {
    topic,
    extra,
    voice: String(body.voice || profile.voice || "").slice(0, 5000),
    channels: Array.isArray(body.channels)
      ? body.channels.slice(0, 50)
      : (profile.channels || []).map(x => x.url)
  };

  const agents = chooseAgents(topic, extra);
  const projectId = makeId();
  const jobId = makeId();

  const statements = [
    env.DB.prepare(`
      INSERT INTO projects
      (id, title, topic, status)
      VALUES (?, ?, ?, 'active')
    `).bind(projectId, topic.slice(0, 180), topic),

    env.DB.prepare(`
      INSERT INTO workflow_jobs
      (id, project_id, status, current_step, input_json)
      VALUES (?, ?, 'queued', ?, ?)
    `).bind(
      jobId,
      projectId,
      agents[0],
      JSON.stringify(input)
    )
  ];

  agents.forEach((agent, index) => {
    statements.push(
      env.DB.prepare(`
        INSERT INTO agent_runs
        (id, job_id, agent_name, status, input_text)
        VALUES (?, ?, ?, 'queued', ?)
      `).bind(
        `${jobId}_${String(index).padStart(3, "0")}`,
        jobId,
        agent,
        JSON.stringify(input)
      )
    );
  });

  await env.DB.batch(statements);

  return json({
    ok: true,
    projectId,
    jobId,
    agents,
    totalSteps: agents.length,
    status: "queued"
  });
}

async function getWorkflowStatus(env, jobId) {
  const job = await env.DB.prepare(`
    SELECT *
    FROM workflow_jobs
    WHERE id = ?
  `).bind(jobId).first();

  if (!job) {
    return json({ ok: false, error: "Workflow not found" }, 404);
  }

  /*
    यदि Worker अचानक बंद हुआ और Agent 10 मिनट से running है,
    तो उसे queued कर दो ताकि user Resume कर सके।
  */
  await env.DB.prepare(`
    UPDATE agent_runs
    SET status = 'queued',
        error_message = 'Previous execution interrupted; ready to retry'
    WHERE job_id = ?
      AND status = 'running'
      AND started_at < datetime('now', '-10 minutes')
  `).bind(jobId).run();

  await env.DB.prepare(`
    UPDATE workflow_jobs
    SET status = 'paused',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
      AND status = 'running'
      AND NOT EXISTS (
        SELECT 1 FROM agent_runs
        WHERE job_id = ? AND status = 'running'
      )
      AND EXISTS (
        SELECT 1 FROM agent_runs
        WHERE job_id = ? AND status = 'queued'
      )
  `).bind(jobId, jobId, jobId).run();

  const updatedJob = await env.DB.prepare(`
    SELECT * FROM workflow_jobs WHERE id = ?
  `).bind(jobId).first();

  const steps = await env.DB.prepare(`
    SELECT id, agent_name, status, error_message,
           attempt_count, started_at, completed_at
    FROM agent_runs
    WHERE job_id = ?
    ORDER BY id
  `).bind(jobId).all();

  return json({
    ok: true,
    job: updatedJob,
    steps: steps.results || []
  });
}

async function executeWorkflowStep(env, jobId) {
  const job = await env.DB.prepare(`
    SELECT * FROM workflow_jobs WHERE id = ?
  `).bind(jobId).first();

  if (!job) {
    return json({ ok: false, error: "Workflow not found" }, 404);
  }

  if (job.status === "completed") {
    return json({ ok: true, done: true, status: "completed" });
  }

  if (job.status === "paused") {
    return json({
      ok: false,
      paused: true,
      error: "Workflow is paused. Resume it first."
    }, 409);
  }

  const running = await env.DB.prepare(`
    SELECT id FROM agent_runs
    WHERE job_id = ? AND status = 'running'
    LIMIT 1
  `).bind(jobId).first();

  if (running) {
    return json({
      ok: false,
      error: "An Agent is already running. Do not start another step."
    }, 409);
  }

  const next = await env.DB.prepare(`
    SELECT * FROM agent_runs
    WHERE job_id = ? AND status = 'queued'
    ORDER BY id
    LIMIT 1
  `).bind(jobId).first();

  if (!next) {
    await env.DB.prepare(`
      UPDATE workflow_jobs
      SET status = 'completed',
          current_step = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(jobId).run();

    await env.DB.prepare(`
      UPDATE projects
      SET status = 'completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(job.project_id).run();

    return json({ ok: true, done: true, status: "completed" });
  }

  /*
    Conditional update: एक ही Agent को दो requests एक साथ
    execute न कर सकें।
  */
  const lock = await env.DB.prepare(`
    UPDATE agent_runs
    SET status = 'running',
        started_at = CURRENT_TIMESTAMP,
        attempt_count = attempt_count + 1,
        error_message = NULL
    WHERE id = ? AND status = 'queued'
  `).bind(next.id).run();

  if (!lock.meta || lock.meta.changes !== 1) {
    return json({
      ok: false,
      error: "Agent was claimed by another request. Refresh status."
    }, 409);
  }

  await env.DB.prepare(`
    UPDATE workflow_jobs
    SET status = 'running',
        current_step = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(next.agent_name, jobId).run();

  const input = JSON.parse(job.input_json || "{}");

  const previous = await env.DB.prepare(`
    SELECT agent_name, output_text
    FROM agent_runs
    WHERE job_id = ?
      AND status = 'completed'
    ORDER BY id
  `).bind(jobId).all();

  try {
    const prompt = buildAgentPrompt(
      next.agent_name,
      input,
      previous.results || []
    );

    const systemPrompt = `
${BASE_RULES}

CURRENT SPECIALIST:
${next.agent_name}

SPECIALIST INSTRUCTIONS:
${AGENTS[next.agent_name] || "काम का स्पष्ट और उपयोगी जवाब दो।"}

तुम्हें केवल वर्तमान Agent का काम करना है।
`;

    const answer = await runModel(env, systemPrompt, prompt);

    await env.DB.batch([
      env.DB.prepare(`
        UPDATE agent_runs
        SET status = 'completed',
            output_text = ?,
            completed_at = CURRENT_TIMESTAMP,
            error_message = NULL
        WHERE id = ?
      `).bind(answer, next.id),

      env.DB.prepare(`
        INSERT INTO project_outputs
        (id, project_id, job_id, output_type, title, content)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        makeId(),
        job.project_id,
        jobId,
        "agent_output",
        next.agent_name,
        answer
      )
    ]);

    const remaining = await env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM agent_runs
      WHERE job_id = ? AND status != 'completed'
    `).bind(jobId).first();

    if (Number(remaining?.total || 0) === 0) {
      await env.DB.prepare(`
        UPDATE workflow_jobs
        SET status = 'completed',
            current_step = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(jobId).run();

      await env.DB.prepare(`
        UPDATE projects
        SET status = 'completed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(job.project_id).run();

      return json({
        ok: true,
        done: true,
        status: "completed",
        agent: next.agent_name,
        answer
      });
    }

    await env.DB.prepare(`
      UPDATE workflow_jobs
      SET status = 'queued',
          current_step = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(jobId).run();

    return json({
      ok: true,
      done: false,
      status: "queued",
      agent: next.agent_name,
      answer
    });

  } catch (error) {
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE agent_runs
        SET status = 'queued',
            error_message = ?
        WHERE id = ?
      `).bind(
        String(error.message || error).slice(0, 1000),
        next.id
      ),

      env.DB.prepare(`
        UPDATE workflow_jobs
        SET status = 'paused',
            current_step = ?,
            error_message = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        next.agent_name,
        String(error.message || error).slice(0, 1000),
        jobId
      )
    ]);

    return json({
      ok: false,
      paused: true,
      agent: next.agent_name,
      error: String(error.message || error).slice(0, 1000)
    }, 502);
  }
}

async function resumeWorkflow(env, jobId) {
  const job = await env.DB.prepare(`
    SELECT * FROM workflow_jobs WHERE id = ?
  `).bind(jobId).first();

  if (!job) {
    return json({ ok: false, error: "Workflow not found" }, 404);
  }

  const running = await env.DB.prepare(`
    SELECT id FROM agent_runs
    WHERE job_id = ? AND status = 'running'
    LIMIT 1
  `).bind(jobId).first();

  if (running) {
    return json({
      ok: false,
      error: "An Agent is still running. Check status first."
    }, 409);
  }

  await env.DB.prepare(`
    UPDATE workflow_jobs
    SET status = 'queued',
        error_message = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(jobId).run();

  return json({ ok: true, status: "queued" });
}

async function listProjects(env) {
  const result = await env.DB.prepare(`
    SELECT
      p.id, p.title, p.topic, p.status,
      p.created_at, p.updated_at,
      (
        SELECT COUNT(*) FROM workflow_jobs w
        WHERE w.project_id = p.id
      ) AS workflow_count
    FROM projects p
    ORDER BY p.updated_at DESC
    LIMIT 100
  `).all();

  return json({
    ok: true,
    projects: result.results || []
  });
}

async function getProject(env, projectId) {
  const project = await env.DB.prepare(`
    SELECT * FROM projects WHERE id = ?
  `).bind(projectId).first();

  if (!project) {
    return json({ ok: false, error: "Project not found" }, 404);
  }

  const jobs = await env.DB.prepare(`
    SELECT * FROM workflow_jobs
    WHERE project_id = ?
    ORDER BY created_at DESC
  `).bind(projectId).all();

  const outputs = await env.DB.prepare(`
    SELECT id, job_id, output_type, title, content, created_at
    FROM project_outputs
    WHERE project_id = ?
    ORDER BY created_at, rowid
  `).bind(projectId).all();

  return json({
    ok: true,
    project,
    jobs: jobs.results || [],
    outputs: outputs.results || []
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (path === "/api/health" && method === "GET") {
      return json({
        ok: true,
        service: "Apna Nazariya AI API",
        version: "2.0"
      });
    }

    if (!path.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Cache-Control": "no-store"
        }
      });
    }

    if (!sameOrigin(request, url)) {
      return json({ ok: false, error: "Invalid request origin" }, 403);
    }

    if (!env.DB) {
      return json({ ok: false, error: "D1 database binding missing" }, 500);
    }

    /*
      LOGIN
    */
    if (path === "/api/login" && method === "POST") {
      if (!env.APP_LOGIN_ID || !env.APP_LOGIN_PASSWORD) {
        return json({
          ok: false,
          error: "Login secrets are not configured"
        }, 500);
      }

      const body = await readBody(request);

      if (!body) {
        return json({ ok: false, error: "Invalid JSON" }, 400);
      }

      const loginId = String(body.loginId || "");
      const password = String(body.password || "");

      if (
        loginId.length > 100 ||
        password.length > 200 ||
        !safeEqual(loginId, env.APP_LOGIN_ID) ||
        !safeEqual(password, env.APP_LOGIN_PASSWORD)
      ) {
        return json({
          ok: false,
          error: "Login ID या Password गलत है"
        }, 401);
      }

      const token = randomToken();
      const tokenHash = await sha256(token);
      const sessionId = makeId();

      const expiresAt = new Date(
        Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      await env.DB.prepare(`
        INSERT INTO login_sessions
        (id, token_hash, expires_at)
        VALUES (?, ?, ?)
      `).bind(sessionId, tokenHash, expiresAt).run();

      await env.DB.prepare(`
        DELETE FROM login_sessions
        WHERE expires_at < CURRENT_TIMESTAMP
      `).run();

      return json({
        ok: true,
        message: "Login successful",
        expiresAt
      }, 200, {
        "Set-Cookie": makeCookie(
          token,
          SESSION_DAYS * 24 * 60 * 60
        )
      });
    }

    /*
      LOGOUT: केवल इसी फोन का session delete होगा।
    */
    if (path === "/api/logout" && method === "POST") {
      const token = getCookie(request, "an_session");

      if (token) {
        const tokenHash = await sha256(token);

        await env.DB.prepare(`
          DELETE FROM login_sessions
          WHERE token_hash = ?
        `).bind(tokenHash).run();
      }

      return json({
        ok: true,
        message: "Logged out"
      }, 200, {
        "Set-Cookie": makeCookie("", 0)
      });
    }

    /*
      LOGIN STATUS
    */
    if (path === "/api/me" && method === "GET") {
      const session = await authenticate(request, env);

      return json({
        ok: true,
        authenticated: Boolean(session)
      });
    }

    /*
      बाकी सभी API के लिए login जरूरी है।
    */
    const session = await authenticate(request, env);

    if (!session) {
      return json({
        ok: false,
        error: "Unauthorized. Please login again."
      }, 401);
    }

    /*
      PROFILE
    */
    if (path === "/api/profile" && method === "GET") {
      return getProfile(env);
    }

    if (path === "/api/profile" && method === "POST") {
      const body = await readBody(request);

      if (!body) {
        return json({ ok: false, error: "Invalid JSON" }, 400);
      }

      await saveProfile(env, body);

      return json({
        ok: true,
        message: "Profile saved"
      });
    }

    /*
      MANUAL AI CHAT
    */
    if (path === "/api/ai" && method === "POST") {
      const body = await readBody(request);

      if (!body) {
        return json({ ok: false, error: "Invalid JSON" }, 400);
      }

      const prompt = String(body.prompt || "").trim();

      if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
        return json({
          ok: false,
          error: "Prompt missing or too long"
        }, 400);
      }

      const match = prompt.match(/SELECTED AGENT:\s*([^\r\n]+)/i);
      const agentName = match ? match[1].trim() : "General Assistant";

      const systemPrompt = `
${BASE_RULES}

SELECTED AGENT:
${agentName}

SPECIALIST INSTRUCTIONS:
${AGENTS[agentName] || "उपयोगकर्ता के काम का स्पष्ट, उपयोगी जवाब दो।"}
`;

      try {
        const answer = await runModel(env, systemPrompt, prompt);

        return json({
          ok: true,
          agent: agentName,
          answer
        });
      } catch (error) {
        return json({
          ok: false,
          error: "AI request failed",
          details: String(error.message || error).slice(0, 1000)
        }, 502);
      }
    }

    /*
      WORKFLOW START
    */
    if (path === "/api/workflow/start" && method === "POST") {
      const body = await readBody(request);

      if (!body) {
        return json({ ok: false, error: "Invalid JSON" }, 400);
      }

      return startWorkflow(env, body);
    }

    /*
      WORKFLOW STEP
    */
    if (path === "/api/workflow/step" && method === "POST") {
      const body = await readBody(request);
      const jobId = String(body?.jobId || "");

      if (!jobId) {
        return json({ ok: false, error: "jobId is required" }, 400);
      }

      return executeWorkflowStep(env, jobId);
    }

    /*
      WORKFLOW STATUS
    */
    if (path === "/api/workflow/status" && method === "GET") {
      const jobId = url.searchParams.get("jobId") || "";

      if (!jobId) {
        return json({ ok: false, error: "jobId is required" }, 400);
      }

      return getWorkflowStatus(env, jobId);
    }

    /*
      WORKFLOW RESUME
    */
    if (path === "/api/workflow/resume" && method === "POST") {
      const body = await readBody(request);
      const jobId = String(body?.jobId || "");

      if (!jobId) {
        return json({ ok: false, error: "jobId is required" }, 400);
      }

      return resumeWorkflow(env, jobId);
    }

    /*
      PROJECT HISTORY
    */
    if (path === "/api/projects" && method === "GET") {
      return listProjects(env);
    }

    /*
      SINGLE PROJECT DETAILS
    */
    if (path.startsWith("/api/projects/") && method === "GET") {
      const projectId = decodeURIComponent(
        path.slice("/api/projects/".length)
      );

      if (!projectId || projectId.length > 100) {
        return json({ ok: false, error: "Invalid project ID" }, 400);
      }

      return getProject(env, projectId);
    }

    return json({
      ok: false,
      error: "API route not found"
    }, 404);
  }
};
