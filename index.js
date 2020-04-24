#!/usr/bin/env node
require("colors");
const moment = require("moment");
const inquirer = require("inquirer");
var Table = require("cli-table");
var Spinner = require("cli-spinner").Spinner;
var spinner = new Spinner();

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_DEFAULT_REGION,
} = process.env;

if (AWS_ACCESS_KEY_ID === undefined || AWS_SECRET_ACCESS_KEY === undefined) {
  console.log(
    `please define the envoirment variables ${`AWS_ACCESS_KEY_ID`.red} and ${
      `AWS_SECRET_ACCESS_KEY`.red
    } `
  );
  process.exit(1);
}

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

const AWS = require("aws-sdk");

const { program } = require("commander");
program
  .name("kommit 🔥")
  .description("Simple utility for codecommit. Pull-Request focused")
  .option(
    "-r, --region <region>",
    "AWS region (Default is your ENV AWS_DEFAULT_REGION or eu-west, because i like it)",
    AWS_DEFAULT_REGION || "eu-west-1"
  );

program
  .command("request")
  .description("Create a new pull request")
  .action(async (_, { region }) => {
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
              repositoryName: repo /* required */,
              sourceReference: branch /* required */,
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

program
  .command("show <id>")
  .description("Open the pull request in the browser")
  .action((id) => {
    const { region } = program;
    execSync(
      `open "https://${region}.console.aws.amazon.com/codesuite/codecommit/repositories/${repo}/pull-requests/${id}/details?region=${region}"`
    );
  });

/**
 * LIST
 */
program
  .command("list")
  .description("List all pull requests")
  .option("-o, --open", "list only open request")
  .option("-d, --show-description", "show the description", false)
  .option("-m, --max <number>", "limit for requests", 10)
  .option(
    "-a, --all-branches",
    "will show all branches. Default shows current branches only",
    false
  )
  .action(async ({ open, max, showDescription, allBranches }) => {
    let pullRequestStatus = undefined;
    if (open !== undefined) {
      pullRequestStatus = open ? "OPEN" : "CLOSED";
    }

    const { region } = program;
    const cc = new AWS.CodeCommit({ region });
    const head = ["id", "name", "status", "created", "updated", "author"];
    const colWidths = [6, 60, 15, 18, 18, 18];

    if (showDescription) {
      head.push("description");
      colWidths.push(60);
    }

    const table = new Table({ head, colWidths });

    const { pullRequestIds } = await cc
      .listPullRequests({
        maxResults: max,
        repositoryName: repo,
        pullRequestStatus,
      })
      .promise();

    for (const pullRequestId of pullRequestIds) {
      spinner.start();
      const {
        pullRequest: {
          title,
          authorArn,
          pullRequestStatus,
          creationDate,
          lastActivityDate,
          description,
          pullRequestTargets: [{ sourceReference }],
          ...rest
        },
      } = await cc.getPullRequest({ pullRequestId }).promise();
      spinner.stop(true);
      const author = authorArn.split(/[\\/]/).pop();
      const requestBranch = sourceReference.split(/[\\/]/).pop();

      const status =
        pullRequestStatus === "OPEN"
          ? pullRequestStatus.red
          : pullRequestStatus.green;

      if (requestBranch === branch || allBranches) {
        const row = [
          String(pullRequestId).bold,
          title.green,
          status,
          moment(creationDate).fromNow(),
          moment(lastActivityDate).fromNow(),
          author.green,
        ];

        if (showDescription) {
          row.push(description || "");
        }
        table.push(row);
      }
    }

    console.log(table.toString());
  });

(async () => {
  await program.parse(process.argv);
})();
