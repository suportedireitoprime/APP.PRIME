import { YoutubeTranscript } from "npm:youtube-transcript";

const videoId = "zI_kiwJ2S2Y";
try {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  console.log("Transcript length:", transcript.length);
  if (transcript.length > 0) {
    console.log("First snippet:", transcript[0].text);
  }
} catch (e) {
  console.error("Error:", e.message);
}
