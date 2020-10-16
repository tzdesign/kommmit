const AWS = require("aws-sdk");
const inquirer = require("inquirer");
const { execSync } = require("child_process");
const { repo, branch } = require("../utils/info");
const { program } = require("commander");
const opn = require("open");

program
  .command("create")
  .description("Create a new pull request")
  .option(
    "-t, --target-branch <string>",
    "target branch for pull request",
    "master"
  )
  .action(async ({ targetBranch }) => {
    const branches = execSync("git branch -r --no-color")
      .toString()
      .split("\n")
      .map(name => name.trim().replace("origin/", ""))
      .filter(name => /remotes\/.*/g.test(name) === false)
      .filter(name => /\*/g.test(name) === false)
      .filter(name => /HEAD/g.test(name) === false)
      .filter(name => name !== "" && name !== "master")
      .sort((a,b) => a === branch ? -1 : a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));


    inquirer
      .prompt([
        {
          name: "branch",
          message: "Which branch:",
          type: "list",
          choices: branches,
        },
        {
          name: "title",
          message: "Title:",
          type: "input",
          default: ({ branch }) =>
            execSync(`git log origin/${branch} -1 --pretty=%B --no-color`)
              .toString()
              .trim()
              .split("\n")
              .shift(),
        },
        {
          name: "description",
          message: "description:",
          type: "input",
          default: ({ branch }) =>
            execSync(`git log origin/${branch} -1 --pretty=%B --no-color`)
              .toString()
              .trim(),
        },
        {
          name: "confirmed",
          message: ({ branch }) =>
            `ready to add pull-request ${branch} » ${targetBranch}`,
          type: "confirm",
        },
      ])
      .then(async ({ branch, title, description, confirmed }) => {
        if (confirmed === false) {
          return;
        }

        var params = {
          targets: [
            {
              repositoryName: repo,
              sourceReference: branch,
              destinationReference: targetBranch,
            },
          ],
          title,
          description,
        };
        const { region } = program;
        const cc = new AWS.CodeCommit({ region });
        const creation = await cc.createPullRequest(params).promise();

        inquirer
          .prompt([
            {
              name: "open",
              message: ({ branch }) => `Open the PR in the browser?`,
              type: "confirm",
            },
          ])
          .then(async ({ open }) => {
            const {
              pullRequest: { pullRequestId: id },
            } = creation;

            if (open) {
              opn(
                `https://${region}.console.aws.amazon.com/codesuite/codecommit/repositories/${repo}/pull-requests/${id}/details?region=${region}`
              );
            }
          });
      });
  });
