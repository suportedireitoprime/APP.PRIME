import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const html = await Deno.readTextFile("C:/Users/ext_wpereira/.gemini/antigravity-ide/brain/7d3135ba-0f9c-4d35-9cd0-40b52a747717/.system_generated/steps/1531/content.md");
const $ = cheerio.load(html);

$('a').each((_, element) => {
  if ($(element).text().includes('DETRAN - SP')) {
    console.log("Found DETRAN SP");
    console.log("Parent:", $(element).parent()[0].tagName, "GGP:", $(element).parent().parent().attr('class'));
    console.log("Has img?", $(element).find('img').length > 0);
  }
});
