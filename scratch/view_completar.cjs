const fs = require("fs");
const c = fs.readFileSync("scratch/bind_code.js", "utf8");
const i = c.indexOf('s.tipo === "Completar"');
if (i !== -1) {
  console.log(c.substring(i, i + 1500));
} else {
  console.log("not found in bind_code");
}
