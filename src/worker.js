const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";

const SESSION_DAYS = 14;
const MAX_PROMPT_LENGTH = 24000;
const MAX_SOURCE_URLS = 5;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_SOURCE_TEXT = 9000;

const BASE_RULES = `
तुम Apna Nazariya के अनुभवी Hindi YouTube Production Team हो।
Channel tagline: सोच अपनी, फैसला आपका।

भाषा:
- सरल बोलचाल वाली हिंदी, हल्का UP/desi touch।
- दो भाइयों की स्वाभाविक बातचीत; टीवी एंकर जैसी चिल्लाहट या नकली बहस नहीं।
- Host 1: गंभीर, डेटा और सिस्टम पर ध्यान।
- Host 2: आम आदमी, युवा और जमीनी नजरिया।

Editorial Rules:
- तथ्य, राय, आरोप और अनुमान अलग-अलग बताओ।
- कोई आंकड़ा, तारीख, बयान, स्रोत या घटना invent मत करो।
- सत्यापन संभव न हो तो UNVERIFIED / NEEDS SOURCE लिखो।
- बिना प्रमाण किसी राजनीतिक दल या व्यक्ति पर आरोप मत लगाओ।
- URL खोलकर सत्यापन करने का दावा तभी करो जब उपलब्ध source material वास्तव में पढ़ा गया हो।
- पुरानी जानकारी को वर्तमान बताकर पेश मत करो।
- Script बोलने लायक हो, निबंध जैसी नहीं।
- दोनों hosts को संतुलित बोलने का समय दो।
- fabricated citations या fake statistics मत देना।
- अंत में: सोच अपनी, फैसला आपका।
`;

const AGENTS = {
  "AI Manager": { role: "Executive Producer", task: "पूरे वीडियो प्रोजेक्ट की योजना बनाओ। Topic angle, audience, format, research requirements और production checklist तैयार करो।" },
  "Trend Hunter": { role: "Trend Researcher", task: "विषय के संभावित trend angles, audience interest, search intent और discussion opportunities बताओ। Live trend होने का दावा मत करना।" },
  "Competitor Intelligence": { role: "Competitor Analyst", task: "दिए गए reference channel URLs और user-provided notes के आधार पर positioning, presentation patterns, gaps और differentiation strategy बनाओ। यह Worker YouTube channel pages/videos को स्वतः fetch या watch नहीं करता; केवल URL देखकर किसी channel के content, views या strategy के बारे में दावा मत करना। ठोस competitor analysis के लिए user से video links, transcripts या observations माँगो।" },
  "Research & Source Collector": { role: "Evidence Researcher", task: "दिए गए source material से Evidence Ledger बनाओ। हर claim को अलग ID दो; exact claim, source title, URL, उपलब्ध publication date, छोटा supporting excerpt, relevant table/section (केवल यदि text में मौजूद हो), definition/methodology और limitation लिखो। Source text में न मिलने वाली बात को NEEDS SOURCE या UNVERIFIED कहो। Source suggestions को पढ़े हुए sources की तरह पेश मत करो।" },
  "Independent Fact Checker": { role: "Independent Verification Editor", task: "Research Ledger और उपलब्ध source material को स्वतंत्र रूप से audit करो। हर मुख्य claim के लिए verdict VERIFIED / PARTIALLY VERIFIED / NEEDS SOURCE / CONTRADICTED दो। संख्या के numerator, denominator, age group, geography, period, unit, survey definition और comparison basis जाँचो। Research Agent का निष्कर्ष प्रमाण नहीं है; मूल source text से समर्थन देखो। कोई page/table/quote invent मत करो। अंत में SCRIPT-SAFE FACTS और DO-NOT-USE CLAIMS अलग दो।" },
  "Research & Fact Check": { role: "Legacy Research Editor", task: "पुराने projects के लिए research brief बनाओ। हर claim को VERIFIED FROM PROVIDED MATERIAL, NEEDS SOURCE या UNVERIFIED में classify करो। उपलब्ध source material का exact title/URL बताओ; page/table number मत गढ़ो।" },
  "Human Scriptwriter": { role: "Hindi Scriptwriter", task: "दो hosts के लिए पूरी बोलने योग्य natural conversational Hindi YouTube script लिखो। पहले Fact Checker के SCRIPT-SAFE FACTS इस्तेमाल करो। NEEDS SOURCE, PARTIALLY VERIFIED या UNVERIFIED claims को पक्के तथ्य की तरह मत बोलो। Hook, context, दोनों hosts के सवाल-जवाब, grounded examples (काल्पनिक हों तो साफ label), counterpoint, transitions, conclusion और CTA शामिल करो। Host dialogue संतुलित रखो; निबंध या TV debate नहीं।" },
  "Editorial Quality Controller": { role: "Editorial Standards Editor", task: "पूरी draft script का कठोर editorial audit करो। Factual accuracy, source traceability, neutrality, defamation risk, unsupported generalization, दोहराव, natural two-host dialogue, pacing, duration और audience clarity जाँचो। Critical issues और minor improvements अलग करो। अंत में स्पष्ट बताओ: REVISION REQUIRED या READY FOR FINAL APPROVAL। कोई claim खुद से verify मत करना; source evidence न हो तो flag करो।" },
  "Script Revision Specialist": { role: "Senior Script Doctor", task: "Scriptwriter की पूरी script को Editorial Quality Controller की findings के आधार पर सुधारो। पूरा revised script दो, केवल सुझाव नहीं। Unsupported facts हटाओ या स्पष्ट qualification दो; verified facts का अर्थ/आँकड़ा न बदलो; दोनों hosts की natural voice बनाए रखो। यदि कोई revision आवश्यक नहीं तो स्पष्ट लिखो कि draft unchanged है।" },
  "Final Approval & Quality Score": { role: "Chief Editorial Reviewer", task: "पूरे source ledger, fact-check, original script, editorial review और revised script का अंतिम audit करो। 100 में score दो: Accuracy 30, Evidence 25, Neutrality 15, Natural Dialogue 15, Retention 10, Completeness 5। हर score का कारण और unresolved risk बताओ। APPROVE तभी करो जब कुल score कम से कम 85 हो और कोई critical unsupported factual claim, fabricated citation, serious bias/defamation risk न हो तथा पूरी usable script मौजूद हो। अन्यथा HOLD करो। Output की पहली line में बिल्कुल यह machine-readable marker दो: FINAL_DECISION: APPROVE या FINAL_DECISION: HOLD। Score AI editorial estimate है, objective guarantee नहीं। HOLD होने पर साफ बताओ कि किन चीजों को human review/fix करना है।" },
  "Hook & Retention": { role: "Retention Editor", task: "पहले 30 seconds के hooks, curiosity loops, pattern interrupts, transitions और retention improvements बनाओ।" },
  "Title Specialist": { role: "YouTube Title Editor", task: "10 आकर्षक लेकिन ईमानदार titles बनाओ। Clickbait से बचो। Best title चुनकर कारण बताओ।" },
  "Thumbnail Designer": { role: "Thumbnail Creative Director", task: "तीन thumbnail concepts बनाओ। Visual, headline, subline, subject placement, contrast और emotional angle बताओ।" },
  "SEO Specialist": { role: "YouTube SEO Editor", task: "Description, relevant keywords, tags, chapters और hashtags बनाओ। Unrelated trending keywords मत जोड़ो।" },
  "Shorts Producer": { role: "Short-form Producer", task: "Long video से 3-5 Shorts concepts निकालो। हर Short के लिए hook, spoken script, suggested visuals और CTA दो।" },
  "Live Producer": { role: "Live Show Producer", task: "Live show rundown, host handoffs, audience questions, discussion segments और moderation checklist बनाओ।" },
  "Editing Assistant": { role: "Video Editing Supervisor", task: "दो अलग Android phones पर रिकॉर्ड footage को synchronize और edit करने की step-by-step योजना दो। Timeline, cuts, B-roll, captions, transitions, audio cleanup, music levels और export settings बताओ। किसी app को खुद operate करने का दावा मत करना।" },
  "Publishing Assistant": { role: "Publishing Manager", task: "YouTube upload checklist, title, description, thumbnail, playlist, audience settings, subtitles, pinned comment, end screen और publishing schedule तैयार करो। Upload खुद करने का दावा मत करना।" },
  "Analytics Specialist": { role: "YouTube Data Analyst", task: "दिए गए analytics का विश्लेषण करो। CTR, impressions, views, average view duration, retention और traffic sources के आधार पर actionable insights दो। आंकड़े न दिए हों तो invent मत करो; missing metrics की सूची दो।" },
  "Growth Strategist": { role: "Channel Growth Strategist", task: "Channel के लिए practical growth plan, content pillars, weekly schedule, improvement priorities और next-video experiments बनाओ।" }
};

const DEFAULT_SEQUENCE = [
  "AI Manager", "Trend Hunter", "Competitor Intelligence", "Research & Source Collector",
  "Independent Fact Checker", "Human Scriptwriter", "Hook & Retention",
  "Editorial Quality Controller", "Script Revision Specialist", "Final Approval & Quality Score",
  "Title Specialist", "Thumbnail Designer", "SEO Specialist", "Shorts Producer",
  "Live Producer", "Editing Assistant", "Publishing Assistant", "Analytics Specialist", "Growth Strategist"
];

const ALLOWED_SOURCE_HOSTS = [
  "mospi.gov.in", "pib.gov.in", "data.gov.in", "labour.gov.in",
  "rbi.org.in", "niti.gov.in", "indiabudget.gov.in", "cpcb.nic.in",
  "moef.gov.in", "prsindia.org", "cmie.com", "ilo.org",
  "worldbank.org", "imf.org", "un.org", "who.int", "cag.gov.in",
  "eci.gov.in", "sansad.in", "legislative.gov.in", "mha.gov.in",
  "education.gov.in", "mohfw.gov.in", "ncrb.gov.in"
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, ...extraHeaders }
  });
}
function now() { return new Date().toISOString(); }
function uuid() { return crypto.randomUUID(); }
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
async function sha256(value) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
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
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch { return {}; }
}

async function ensureSchema(env) {
  if (!env.DB) throw new Error("D1 Database binding उपलब्ध नहीं है।");
  const statements = [
    `CREATE TABLE IF NOT EXISTS login_sessions (token_hash TEXT PRIMARY KEY, expires_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS channels (id TEXT PRIMARY KEY, url TEXT)`,
    `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '', topic TEXT NOT NULL DEFAULT '', status TEXT, created_at TEXT, updated_at TEXT, input_json TEXT)`,
    `CREATE TABLE IF NOT EXISTS workflow_jobs (id TEXT PRIMARY KEY, project_id TEXT, status TEXT, current_step INTEGER DEFAULT 0, total_steps INTEGER DEFAULT 0, error TEXT, created_at TEXT, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS agent_runs (id TEXT PRIMARY KEY, job_id TEXT, project_id TEXT, agent_name TEXT, status TEXT, output TEXT, error TEXT, created_at TEXT, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS project_outputs (id TEXT PRIMARY KEY, project_id TEXT, agent_name TEXT, content TEXT, created_at TEXT)`
  ];
  for (const sql of statements) await env.DB.prepare(sql).run();
}

async function authenticate(request, env) {
  const token = cookieValue(request, "an_session");
  if (!token) return false;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    "SELECT token_hash, expires_at FROM login_sessions WHERE token_hash=?"
  ).bind(tokenHash).first();
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM login_sessions WHERE token_hash=?").bind(tokenHash).run();
    return false;
  }
  return true;
}

async function runModel(env, systemPrompt, userPrompt, maxTokens = 2400) {
  if (!env.AI) throw new Error("Cloudflare AI binding उपलब्ध नहीं है।");
  let result;
  try {
    result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.55,
      chat_template_kwargs: { enable_thinking: false }
    });
  } catch (error) {
    console.error("Workers AI execution error:", error);
    throw new Error("Workers AI Error: " + String(error?.message || error));
  }

  function extractText(value) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === "string") return item;
        if (typeof item?.text === "string") return item.text;
        if (typeof item?.content === "string") return item.content;
        return "";
      }).filter(Boolean).join("\n");
    }
    if (value && typeof value === "object") {
      for (const key of ["text", "content", "response", "output_text"]) {
        if (typeof value[key] === "string") return value[key];
      }
      if (Array.isArray(value.content)) return extractText(value.content);
    }
    return "";
  }

  let output = typeof result === "string" ? result :
    extractText(result?.response) ||
    extractText(result?.output_text) ||
    extractText(result?.text) ||
    extractText(result?.content) ||
    extractText(result?.result?.response) ||
    extractText(result?.choices?.[0]?.message?.content) ||
    extractText(result?.result?.choices?.[0]?.message?.content);

  output = String(output || "").trim();
  if (!output) {
    let info = "Unknown response";
    try { info = JSON.stringify(result).slice(0, 1000); } catch {}
    console.error("Workers AI empty response:", info);
    throw new Error("AI ने खाली जवाब दिया। Model response: " + info);
  }
  return output;
}

async function getProfile(env) {
  const rows = await env.DB.prepare("SELECT key,value FROM settings").all();
  const profile = {};
  for (const row of rows.results || []) profile[row.key] = row.value;
  const channels = await env.DB.prepare("SELECT url FROM channels").all();
  profile.referenceChannels = (channels.results || []).map(x => x.url);
  return profile;
}

async function saveProfile(env, body) {
  const allowed = ["creatorVoice", "hostOne", "hostTwo", "channelName", "tagline", "language", "extraRules"];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      await env.DB.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)")
        .bind(key, String(body[key]).slice(0, 5000)).run();
    }
  }
  if (Array.isArray(body.referenceChannels)) {
    await env.DB.prepare("DELETE FROM channels").run();
    for (const url of body.referenceChannels.slice(0, 20)) {
      if (typeof url === "string" && url.trim()) {
        await env.DB.prepare("INSERT INTO channels (id,url) VALUES (?,?)")
          .bind(uuid(), url.trim().slice(0, 500)).run();
      }
    }
  }
  return getProfile(env);
}

function chooseAgents(requested) {
  if (Array.isArray(requested) && requested.length) {
    return [...new Set(requested.filter(name => AGENTS[name]))];
  }
  return DEFAULT_SEQUENCE;
}

function buildAgentPrompt(agentName, input, previousOutputs, profile, sourceMaterial = "") {
  const agent = AGENTS[agentName];
  const previous = previousOutputs.slice(-6)
    .map(x => `\n\n### ${x.agent_name}\n${x.content}`).join("\n");
  return `
PROJECT TOPIC:
${input.topic || "विषय उपलब्ध नहीं"}

VIDEO FORMAT: ${input.format || "Long video"}
TARGET DURATION: ${input.duration || "8-10 मिनट"}
EXTRA INSTRUCTIONS: ${input.instructions || "कोई अतिरिक्त निर्देश नहीं"}

CREATOR PROFILE:
${JSON.stringify(profile || {})}

REFERENCE CHANNELS:
${(profile?.referenceChannels || []).join("\n")}

SOURCE MATERIAL (provided URLs से प्राप्त सामग्री; इसे ही उपलब्ध evidence मानो):
${sourceMaterial || "इस workflow में कोई source URL उपलब्ध नहीं कराया गया। किसी claim को verified मत बताना।"}

PREVIOUS WORK:
${previous || "यह पहला चरण है।"}

CURRENT AGENT: ${agentName}
AGENT ROLE: ${agent.role}
TASK: ${agent.task}

Output में fact/opinion/allegation/assumption अलग रखो। यदि source text में page/table number उपलब्ध नहीं है तो page/table number मत बनाओ।
${BASE_RULES}
`;
}

function isAllowedHost(host) {
  return ALLOWED_SOURCE_HOSTS.some(domain => host === domain || host.endsWith("." + domain));
}

async function fetchSourceAsMarkdown(env, rawUrl) {
  let parsed;
  try { parsed = new URL(rawUrl); } catch { throw new Error("Invalid URL: " + rawUrl); }
  if (parsed.protocol !== "https:") throw new Error("केवल HTTPS source URLs स्वीकार हैं: " + rawUrl);
  if (!isAllowedHost(parsed.hostname.toLowerCase())) {
    throw new Error("यह source domain allowlist में नहीं है: " + parsed.hostname + ". Official domain allowlist में ही URL दें।");
  }
  if (parsed.username || parsed.password) throw new Error("URL में username/password स्वीकार नहीं हैं।");

  const response = await fetch(parsed.toString(), {
    method: "GET",
    redirect: "manual",
    headers: {
      "User-Agent": "ApnaNazariyaResearchBot/1.0",
      "Accept": "text/html,application/pdf,text/plain,application/json"
    }
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error("Source redirect हुआ; सुरक्षा के लिए redirect follow नहीं किया: " + rawUrl);
  }
  if (!response.ok) throw new Error(`Source fetch failed (${response.status}): ${rawUrl}`);

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!/(application\/pdf|text\/html|application\/xhtml\+xml|text\/plain|application\/json)/.test(contentType)) {
    throw new Error("Unsupported content type (" + contentType + "): " + rawUrl);
  }
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_SOURCE_BYTES) throw new Error("Source file 8 MB से बड़ा है: " + rawUrl);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_SOURCE_BYTES) throw new Error("Source file 8 MB से बड़ा है: " + rawUrl);

  let markdown = "";
  if (contentType.includes("application/pdf") || contentType.includes("text/html") || contentType.includes("xhtml")) {
    if (!env.AI || typeof env.AI.toMarkdown !== "function") {
      throw new Error("इस account के AI binding में toMarkdown उपलब्ध नहीं है।");
    }
    const blob = new Blob([buffer], { type: contentType.split(";")[0] });
    const converted = await env.AI.toMarkdown({
      name: parsed.pathname.split("/").pop() || "source",
      blob
    });
    if (converted?.error) throw new Error("Document conversion failed: " + converted.error);
    markdown = Array.isArray(converted) ?
      converted.map(x => x.data || "").join("\n") :
      String(converted?.data || converted?.text || "");
  } else {
    markdown = new TextDecoder().decode(buffer);
  }
  markdown = markdown.trim().slice(0, MAX_SOURCE_TEXT);
  if (!markdown) throw new Error("Source से readable text नहीं मिला: " + rawUrl);
  return {
    url: parsed.toString(),
    title: response.headers.get("x-document-title") || parsed.pathname.split("/").pop() || parsed.hostname,
    contentType,
    text: markdown
  };
}

async function collectSources(env, urls) {
  const clean = [...new Set((Array.isArray(urls) ? urls : [])
    .filter(x => typeof x === "string" && x.trim())
    .map(x => x.trim()))].slice(0, MAX_SOURCE_URLS);
  const sources = [];
  const errors = [];
  for (const url of clean) {
    try { sources.push(await fetchSourceAsMarkdown(env, url)); }
    catch (error) { errors.push({ url, error: String(error?.message || error) }); }
  }
  return { sources, errors };
}

function sourceContext(result) {
  if (!result?.sources?.length) return "";
  return result.sources.map((s, i) =>
    `SOURCE ${i + 1}\nTitle: ${s.title}\nURL: ${s.url}\nContent type: ${s.contentType}\nExtracted text:\n${s.text}`
  ).join("\n\n---\n\n").slice(0, MAX_SOURCE_TEXT * 2);
}

async function createProject(env, input, agents) {
  const projectId = uuid(), jobId = uuid(), timestamp = now();
  await env.DB.prepare(
    "INSERT INTO projects (id,topic,status,created_at,updated_at,input_json) VALUES (?,?,?,?,?,?)"
  ).bind(projectId, String(input.topic || "Untitled Project").slice(0, 500),
    "running", timestamp, timestamp, JSON.stringify(input)).run();

  await env.DB.prepare(
    "INSERT INTO workflow_jobs (id,project_id,status,current_step,total_steps,error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)"
  ).bind(jobId, projectId, "queued", 0, agents.length, null, timestamp, timestamp).run();

  for (const name of agents) {
    await env.DB.prepare(
      "INSERT INTO agent_runs (id,job_id,project_id,agent_name,status,output,error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)"
    ).bind(uuid(), jobId, projectId, name, "queued", null, null, timestamp, timestamp).run();
  }
  return { projectId, jobId };
}

async function workflowStatus(env, jobId) {
  const job = await env.DB.prepare("SELECT * FROM workflow_jobs WHERE id=?").bind(jobId).first();
  if (!job) return null;
  const runs = await env.DB.prepare(
    "SELECT * FROM agent_runs WHERE job_id=? ORDER BY rowid ASC"
  ).bind(jobId).all();
  return { job, agents: runs.results || [] };
}

async function runNextStep(env, jobId) {
  const job = await env.DB.prepare("SELECT * FROM workflow_jobs WHERE id=?").bind(jobId).first();
  if (!job) throw new Error("Workflow नहीं मिला।");
  if (job.status === "completed") return { completed: true };
  if (job.status === "needs_review") return { completed: false, needsReview: true, decision: "HOLD" };

  const next = await env.DB.prepare(
    "SELECT * FROM agent_runs WHERE job_id=? AND status='queued' ORDER BY rowid ASC LIMIT 1"
  ).bind(jobId).first();

  if (!next) {
    await env.DB.prepare("UPDATE workflow_jobs SET status='completed',updated_at=? WHERE id=?").bind(now(), jobId).run();
    await env.DB.prepare("UPDATE projects SET status='completed',updated_at=? WHERE id=?").bind(now(), job.project_id).run();
    return { completed: true };
  }

  await env.DB.prepare("UPDATE workflow_jobs SET status='running',error=NULL,updated_at=? WHERE id=?").bind(now(), jobId).run();
  await env.DB.prepare("UPDATE agent_runs SET status='running',error=NULL,updated_at=? WHERE id=?").bind(now(), next.id).run();

  try {
    const project = await env.DB.prepare("SELECT * FROM projects WHERE id=?").bind(job.project_id).first();
    const input = JSON.parse(project.input_json || "{}");
    const previous = await env.DB.prepare(
      "SELECT agent_name,content FROM project_outputs WHERE project_id=? ORDER BY created_at ASC"
    ).bind(job.project_id).all();
    const profile = await getProfile(env);

    let sources = input.sourceMaterial || "";
    if (["Research & Source Collector", "Independent Fact Checker", "Research & Fact Check"].includes(next.agent_name) && Array.isArray(input.sourceUrls) && input.sourceUrls.length) {
      const fetched = await collectSources(env, input.sourceUrls);
      sources = sourceContext(fetched);
      if (fetched.errors.length) {
        sources += "\n\nSOURCE FETCH ERRORS:\n" + JSON.stringify(fetched.errors, null, 2);
      }
      if (!sources) sources = "कोई source पढ़ा नहीं जा सका। Errors: " + JSON.stringify(fetched.errors);
    }

    const prompt = buildAgentPrompt(next.agent_name, input, previous.results || [], profile, sources);
    const output = await runModel(env, BASE_RULES, prompt.slice(0, MAX_PROMPT_LENGTH), 3200);
    const timestamp = now();

    await env.DB.prepare("UPDATE agent_runs SET status='completed',output=?,updated_at=? WHERE id=?")
      .bind(output, timestamp, next.id).run();
    await env.DB.prepare(
      "INSERT INTO project_outputs (id,project_id,agent_name,content,created_at) VALUES (?,?,?,?,?)"
    ).bind(uuid(), job.project_id, next.agent_name, output, timestamp).run();

    const counts = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM agent_runs WHERE job_id=? AND status='completed'"
    ).bind(jobId).first();
    const pending = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM agent_runs WHERE job_id=? AND status IN ('queued','running')"
    ).bind(jobId).first();
    const completed = Number(pending?.total || 0) === 0;

    // Human-in-the-loop editorial gate: a missing/unclear decision is treated as HOLD.
    if (next.agent_name === "Final Approval & Quality Score") {
      const decision = output.match(/FINAL_DECISION\s*:\s*(APPROVE|HOLD)/i);
      const approved = Boolean(decision && decision[1].toUpperCase() === "APPROVE");
      if (!approved) {
        await env.DB.prepare("UPDATE agent_runs SET status='blocked',error='Editorial approval pending' WHERE job_id=? AND status='queued'")
          .bind(jobId).run();
        await env.DB.prepare("UPDATE workflow_jobs SET current_step=?,status='needs_review',error='Final editorial approval is HOLD or unclear',updated_at=? WHERE id=?")
          .bind(Number(counts?.total || 0), timestamp, jobId).run();
        await env.DB.prepare("UPDATE projects SET status='needs_review',updated_at=? WHERE id=?")
          .bind(timestamp, job.project_id).run();
        return { completed: false, needsReview: true, decision: "HOLD", agent: next.agent_name, output };
      }
    }

    await env.DB.prepare("UPDATE workflow_jobs SET current_step=?,status=?,updated_at=? WHERE id=?")
      .bind(Number(counts?.total || 0), completed ? "completed" : "running", timestamp, jobId).run();
    await env.DB.prepare("UPDATE projects SET status=?,updated_at=? WHERE id=?")
      .bind(completed ? "completed" : "running", timestamp, job.project_id).run();

    return { completed, agent: next.agent_name, output };
  } catch (error) {
    const message = String(error?.message || error);
    await env.DB.prepare("UPDATE agent_runs SET status='error',error=?,updated_at=? WHERE id=?")
      .bind(message, now(), next.id).run();
    await env.DB.prepare("UPDATE workflow_jobs SET status='paused',error=?,updated_at=? WHERE id=?")
      .bind(message, now(), jobId).run();
    await env.DB.prepare("UPDATE projects SET status='paused',updated_at=? WHERE id=?")
      .bind(now(), job.project_id).run();
    throw error;
  }
}

async function generateThumbnail(env, body) {
  if (!env.AI) throw new Error("AI binding उपलब्ध नहीं है।");
  const topic = String(body.topic || "").slice(0, 500);
  const headline = String(body.headline || topic).slice(0, 150);
  const subline = String(body.subline || "").slice(0, 150);
  if (!topic.trim()) throw new Error("Thumbnail topic खाली है।");

  const styles = [
    "cinematic documentary news photography, dramatic lighting",
    "realistic editorial photojournalism, strong visual storytelling",
    "minimal modern news documentary background, high contrast",
    "cinematic realistic public issue documentary scene",
    "dramatic split composition, realistic photography"
  ];
  const thumbnails = [];
  for (let i = 0; i < styles.length; i++) {
    const prompt = `Create a professional YouTube thumbnail background. Topic: ${topic}. Style: ${styles[i]}. 16:9 horizontal, photorealistic. No text, letters, logo or watermark. Keep clear negative space for Hindi headline overlay. Do not depict fabricated evidence or fake news screenshots.`;
    try {
      const result = await env.AI.run(IMAGE_MODEL, { prompt, width: 1280, height: 720 });
      let imageData = result?.image || result?.data?.image || result;
      if (imageData instanceof ArrayBuffer) imageData = new Uint8Array(imageData);
      if (imageData instanceof Uint8Array) {
        let binary = "";
        for (let i = 0; i < imageData.length; i += 0x8000) {
          binary += String.fromCharCode(...imageData.subarray(i, i + 0x8000));
        }
        imageData = btoa(binary);
      }
      thumbnails.push(typeof imageData === "string" ? {
        id: uuid(), name: `Concept ${i + 1}`,
        image: imageData.startsWith("data:") ? imageData : `data:image/jpeg;base64,${imageData}`,
        headline, subline
      } : { id: uuid(), name: `Concept ${i + 1}`, error: "Image response format समझ नहीं आया।" });
    } catch (error) {
      thumbnails.push({ id: uuid(), name: `Concept ${i + 1}`, error: String(error?.message || error) });
    }
  }
  return { ok: true, total: thumbnails.length, successful: thumbnails.filter(x => x.image).length, thumbnails };
}

async function handleApi(request, env) {
  const url = new URL(request.url), path = url.pathname, method = request.method;

  if (path === "/api/health" && method === "GET") {
    return json({ ok: true, service: "Apna Nazariya AI API", version: "6.0" });
  }
  if (path === "/api/secret-check" && method === "GET") {
    return json({
      ok: true, appLoginIdConfigured: Boolean(env.APP_LOGIN_ID),
      appLoginPasswordConfigured: Boolean(env.APP_LOGIN_PASSWORD),
      databaseConfigured: Boolean(env.DB), aiConfigured: Boolean(env.AI),
      documentConversionAvailable: Boolean(env.AI && typeof env.AI.toMarkdown === "function")
    });
  }
  if (path === "/api/login" && method === "POST") {
    const body = await readBody(request);
    if (!env.APP_LOGIN_ID || !env.APP_LOGIN_PASSWORD ||
      !safeEqual(String(body.loginId || ""), env.APP_LOGIN_ID) ||
      !safeEqual(String(body.password || ""), env.APP_LOGIN_PASSWORD)) {
      return json({ ok: false, error: "गलत Login ID या Password।" }, 401);
    }
    const token = randomToken(), tokenHash = await sha256(token);
    const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
    await env.DB.prepare("INSERT INTO login_sessions (token_hash,expires_at) VALUES (?,?)")
      .bind(tokenHash, expires).run();
    return json({ ok: true }, 200, { "Set-Cookie": cookieHeader(token) });
  }
  if (path === "/api/logout" && method === "POST") {
    const token = cookieValue(request, "an_session");
    if (token) await env.DB.prepare("DELETE FROM login_sessions WHERE token_hash=?")
      .bind(await sha256(token)).run();
    return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
  }
  if (path === "/api/me" && method === "GET") {
    return json({ ok: true, loggedIn: await authenticate(request, env) });
  }
  if (!(await authenticate(request, env))) return json({ ok: false, error: "Unauthorized" }, 401);

  if (path === "/api/profile" && method === "GET") return json({ ok: true, profile: await getProfile(env) });
  if (path === "/api/profile" && method === "POST") {
    return json({ ok: true, profile: await saveProfile(env, await readBody(request)) });
  }
  if (path === "/api/ai" && method === "POST") {
    const body = await readBody(request);
    const prompt = String(body.prompt || "").slice(0, MAX_PROMPT_LENGTH);
    if (!prompt.trim()) return json({ ok: false, error: "Prompt खाली है।" }, 400);
    let sourceText = "";
    let sourceErrors = [];
    if (Array.isArray(body.sourceUrls) && body.sourceUrls.length) {
      const fetched = await collectSources(env, body.sourceUrls);
      sourceText = sourceContext(fetched);
      sourceErrors = fetched.errors;
    }
    const finalPrompt = sourceText
      ? `${prompt}\n\nPROVIDED SOURCE MATERIAL:\n${sourceText}\n\nSource material से बाहर की बात को verified मत बताना।`
      : prompt;
    const output = await runModel(env, BASE_RULES, finalPrompt.slice(0, MAX_PROMPT_LENGTH), 3000);
    return json({ ok: true, output, sourcesRead: sourceText ? body.sourceUrls.length - sourceErrors.length : 0, sourceErrors });
  }
  if (path === "/api/research/fetch" && method === "POST") {
    const body = await readBody(request);
    const result = await collectSources(env, body.sourceUrls);
    return json({
      ok: true,
      sources: result.sources.map(s => ({ title: s.title, url: s.url, contentType: s.contentType, text: s.text })),
      errors: result.errors
    });
  }
  if (path === "/api/thumbnails/generate" && method === "POST") {
    return json(await generateThumbnail(env, await readBody(request)));
  }
  if (path === "/api/workflow/start" && method === "POST") {
    const body = await readBody(request);
    if (!String(body.topic || "").trim()) return json({ ok: false, error: "पहले video topic लिखें।" }, 400);
    body.sourceUrls = Array.isArray(body.sourceUrls) ? body.sourceUrls.slice(0, MAX_SOURCE_URLS) : [];
    const agents = chooseAgents(body.agents);
    if (!agents.length) return json({ ok: false, error: "कोई valid agent चुना नहीं गया।" }, 400);
    const created = await createProject(env, body, agents);
    return json({ ok: true, projectId: created.projectId, jobId: created.jobId, totalSteps: agents.length, status: "queued" });
  }
  if (path === "/api/workflow/step" && method === "POST") {
    const body = await readBody(request);
    if (!body.jobId) return json({ ok: false, error: "jobId जरूरी है।" }, 400);
    return json({ ok: true, ...await runNextStep(env, body.jobId) });
  }
  if (path === "/api/workflow/resume" && method === "POST") {
    const body = await readBody(request);
    if (!body.jobId) return json({ ok: false, error: "jobId जरूरी है।" }, 400);
    await env.DB.prepare("UPDATE agent_runs SET status='queued',error=NULL WHERE job_id=? AND status='error'")
      .bind(body.jobId).run();
    await env.DB.prepare("UPDATE workflow_jobs SET status='queued',error=NULL,updated_at=? WHERE id=?")
      .bind(now(), body.jobId).run();
    await env.DB.prepare("UPDATE projects SET status='running',updated_at=? WHERE id=?")
      .bind(now(), (await env.DB.prepare("SELECT project_id FROM workflow_jobs WHERE id=?").bind(body.jobId).first())?.project_id || "").run();
    return json({ ok: true });
  }
  if (path === "/api/workflow/continue" && method === "POST") {
    const body = await readBody(request);
    if (!body.jobId) return json({ ok: false, error: "jobId जरूरी है।" }, 400);
    const job = await env.DB.prepare("SELECT * FROM workflow_jobs WHERE id=?").bind(body.jobId).first();
    if (!job) return json({ ok: false, error: "Workflow नहीं मिला।" }, 404);
    if (job.status !== "needs_review") return json({ ok: false, error: "यह workflow editorial review पर रुका नहीं है।" }, 409);
    await env.DB.prepare("UPDATE agent_runs SET status='queued',error=NULL WHERE job_id=? AND status='blocked'")
      .bind(body.jobId).run();
    await env.DB.prepare("UPDATE workflow_jobs SET status='queued',error=NULL,updated_at=? WHERE id=?")
      .bind(now(), body.jobId).run();
    await env.DB.prepare("UPDATE projects SET status='running',updated_at=? WHERE id=?")
      .bind(now(), job.project_id).run();
    return json({ ok: true, message: "Human review के बाद workflow आगे बढ़ेगा।" });
  }
  if (path === "/api/workflow/status" && method === "GET") {
    const jobId = url.searchParams.get("jobId");
    if (!jobId) return json({ ok: false, error: "jobId जरूरी है।" }, 400);
    const status = await workflowStatus(env, jobId);
    if (!status) return json({ ok: false, error: "Workflow नहीं मिला।" }, 404);
    return json({ ok: true, ...status });
  }
  if (path === "/api/projects" && method === "GET") {
    const result = await env.DB.prepare("SELECT * FROM projects ORDER BY created_at DESC LIMIT 100").all();
    return json({ ok: true, projects: result.results || [] });
  }
  const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch && method === "GET") {
    const projectId = projectMatch[1];
    const project = await env.DB.prepare("SELECT * FROM projects WHERE id=?").bind(projectId).first();
    if (!project) return json({ ok: false, error: "Project नहीं मिला।" }, 404);
    const outputs = await env.DB.prepare("SELECT * FROM project_outputs WHERE project_id=? ORDER BY created_at ASC")
      .bind(projectId).all();
    const jobs = await env.DB.prepare("SELECT * FROM workflow_jobs WHERE project_id=? ORDER BY created_at DESC")
      .bind(projectId).all();
    return json({ ok: true, project, outputs: outputs.results || [], jobs: jobs.results || [] });
  }
  return json({ ok: false, error: "API route नहीं मिला।" }, 404);
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        await ensureSchema(env);
        return await handleApi(request, env);
      }
      if (env.ASSETS) return await env.ASSETS.fetch(request);
      return new Response("Apna Nazariya Studio is running.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    } catch (error) {
      console.error("Apna Nazariya Worker Error:", error);
      return json({ ok: false, error: String(error?.message || error) }, 500);
    }
  }
};
