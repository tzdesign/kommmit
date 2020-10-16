const { program } = require("commander");
const AWS = require("aws-sdk");
const Table = require("cli-table");
const { repo, branch } = require("../utils/info");
const moment = require("moment");
const { columns } = require("term-size")();

const spinner = new (require("cli-spinner").Spinner)();

program
  .command("list")
  .description("List all pull requests")
  .option("-o, --open", "list only open request",false)
  .option("-d, --show-description", "show the description", false)
  .option("-m, --max <number>", "limit for requests", 10)
  .option(
    "-a, --all-branches",
    "will show all branches. Default shows current branches only",
    false
  )
  .action(async ({ open, max, showDescription, allBranches }) => {
    let pullRequestStatus =  open ? "OPEN" : undefined;

    const { region } = program;
    const cc = new AWS.CodeCommit({ region });
    const head = ["id", "name", "status", "created", "updated", "author"];
    const colWidths = [6, 60, 15, 18, 18, 18];

    if (showDescription) {
      head.push("description");
      colWidths.push(60);
    }

    if (columns < 150) {
      head.splice(3, 2);
      colWidths.splice(3, 2);
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

        if (columns < 150) {
          row.splice(3, 2);
        }

        table.push(row);
      }
    }

    console.log(table.toString());
  });
