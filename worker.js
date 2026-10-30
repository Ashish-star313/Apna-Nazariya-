export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,X-Project-PIN"};
  if(request.method==="OPTIONS") return new Response(null,{headers:cors});
  if(url.pathname==="/api/health") return Response.json({ok:true,service:"Apna Nazariya AI API"}, {headers:cors});
  if(url.pathname.startsWith("/api/")) {
   if(!env.PROJECT_PIN || request.headers.get("X-Project-PIN")!==env.PROJECT_PIN)
    return Response.json({ok:false,error:"Unauthorized"}, {status:401,headers:cors});
   if(url.pathname==="/api/profile" && request.method==="POST") {
    const body=await request.json();
    await env.DB.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)").bind("voice",String(body.voice||"")).run();
    await env.DB.prepare("DELETE FROM channels").run();
    for(const link of (body.channels||[]).slice(0,50)) await env.DB.prepare("INSERT INTO channels (url) VALUES (?)").bind(String(link).slice(0,500)).run();
    return Response.json({ok:true},{headers:cors});
   }
   if(url.pathname==="/api/profile" && request.method==="GET") {
    const voice=await env.DB.prepare("SELECT value FROM settings WHERE key='voice'").first();
    const channels=await env.DB.prepare("SELECT url FROM channels ORDER BY id").all();
    return Response.json({ok:true,voice:voice?.value||"",channels:channels.results||[]},{headers:cors});
   }
   return Response.json({ok:false,error:"Not found"},{status:404,headers:cors});
  }
  return env.ASSETS.fetch(request);
 }
};