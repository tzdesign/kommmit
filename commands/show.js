const { execSync } = require("child_process");
const { repo } = require("../utils/info");
const { program } = require("commander");

program
  .command("show <id>")
  .description("Open the pull request in the browser")
  .action((id) => {
    const { region } = program;
    execSync(
      `open "https://${region}.console.aws.amazon.com/codesuite/codecommit/repositories/${repo}/pull-requests/${id}/details?region=${region}"`
    );
  });
