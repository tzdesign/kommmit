const { execSync } = require("child_process");


let repo = "";
let branch = "";
try {
  repo = execSync("git rev-parse --show-toplevel")
    .toString()
    .trim()
    .split("/")
    .pop();
  branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
} catch {
  process.exit();
}

module.exports = {
  repo,
  branch,
};
