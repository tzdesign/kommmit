const AWS = require("aws-sdk");
const inquirer = require("inquirer");
const { execSync } = require("child_process");
const { repo } = require("../utils/info");
const { program } = require("commander");

program
  .command("create")
  .description("Create a new pull request")
  .action(async () => {
    const branches = execSync("git branch -r --no-color")
      .toString()
      .split("\n")
      .map((name) => name.trim().replace("origin/", ""))
      .filter((name) => /remotes\/.*/g.test(name) === false)
      .filter((name) => /\*/g.test(name) === false)
      .filter((name) => /HEAD/g.test(name) === false)
      .filter((name) => name !== "" && name !== "master");

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
      ])
      .then(async ({ branch, title, description }) => {
        var params = {
          targets: [
            {
              repositoryName: repo,
              sourceReference: branch,
              destinationReference: "master",
            },
          ],
          title,
          description,
        };
        const { region } = program;
        const cc = new AWS.CodeCommit({ region });
        const creation = await cc.createPullRequest(params).promise();
        console.log(creation);
      });
  });
