const cheerio = require('cheerio');
const fs = require('fs');
const html = fs.readFileSync('C:/Users/ext_wpereira/.gemini/antigravity-ide/brain/7d3135ba-0f9c-4d35-9cd0-40b52a747717/.system_generated/steps/1231/content.md', 'utf8');
const $ = cheerio.load(html);

const concursos = [];
$('ul.noticias.link-d > li > a').each((_, element) => {
    const link = $(element).attr('href');
    const titulo = $(element).attr('title') || $(element).text().trim();
    if (link && link.includes('/noticias/') && titulo.length > 10) {
        concursos.push({titulo, link});
    }
});
console.log(concursos);
