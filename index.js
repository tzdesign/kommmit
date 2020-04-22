#!/usr/bin/env node
require("colors");
const moment = require("moment");
const inquirer = require("inquirer");

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

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
try {
  repo = execSync("git rev-parse --show-toplevel")
    .toString()
    .trim()
    .split("/")
    .pop();
} catch {
  process.exit();
}

const AWS = require("aws-sdk");

const cc = new AWS.CodeCommit({ region: "eu-west-1" });

const { program } = require("commander");
program
  .name("kommit 🔥")
  .description(
    "This is the most beautiful thing on earth. Just kidding took me just 1h"
  )
  .option(
    "-r, --region",
    "AWS region (Default is eu-west, because i like it)",
    "eu-west-1"
  );

program.command("request").action(async () => {
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

      const creation = await cc.createPullRequest(params).promise();
      console.log(creation);
    });
});

/**
 * LIST
 */
program
  .command("pull")
  .option("-o, --open", "list only open request")
  .option("-d, --show-description", "show the description", false)
  .option("-m, --max <number>", "limit for requests", 5)
  .action(async ({ open, max, showDescription }) => {
    const { pullRequestIds } = await cc
      .listPullRequests({
        maxResults: max,
        repositoryName: repo,
        pullRequestStatus: open ? "OPEN" : "CLOSED",
      })
      .promise();

    for (const pullRequestId of pullRequestIds) {
      const {
        pullRequest: {
          title,
          authorArn,
          pullRequestStatus,
          creationDate,
          description,
        },
      } = await cc.getPullRequest({ pullRequestId }).promise();
      const author = authorArn.split("/").pop();
      console.log(
        `[${pullRequestStatus}]`.blue +
          `${title.green} from ${author.green} at ${moment(creationDate).format(
            "LLL"
          )}`
      );
      if (showDescription) {
        console.log(`
        
        ${description}
        
        `);
      }
    }
  });

(async () => {
  await program.parse(process.argv);
})();
