const { execSync } = require("child_process");
const { repo } = require("../utils/info");
const { program } = require("commander");
var opn = require("open");

program
  .command("show <id>")
  .description("Open the pull request in the browser")
  .action(id => {
    const { region } = program;
    opn(
      `https://${region}.console.aws.amazon.com/codesuite/codecommit/repositories/${repo}/pull-requests/${id}/details?region=${region}`
    );
  });
