const fs = require("fs");
const path = require("path");

async function main() {
  const filePath = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\68e784a9-9a25-4511-8817-37eed50ac76f\\.user_uploaded\\uploaded_media_1790141197930.img';
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString("base64");
  
  console.log("Audio size:", buffer.length);
  
  const res = await fetch("https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/test-audio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.SUPABASE_ANON_KEY // we don't have this, wait! The edge function might need anon key if it's not anon
    },
    body: JSON.stringify({ base64, mimetype: "audio/ogg" })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

main().catch(console.error);
