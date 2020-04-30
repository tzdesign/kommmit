const AWS = require("aws-sdk");
const inquirer = require("inquirer");
const { program } = require("commander");

const spinner = new (require("cli-spinner").Spinner)();

program
  .command("close <id>")
  .description("close a pull request")
  .action(async (pullRequestId) => {
    spinner.start();

    const { region } = program;
    const cc = new AWS.CodeCommit({ region });

    try {
      const {
        pullRequest: { title },
      } = await cc.getPullRequest({ pullRequestId }).promise();

      spinner.stop();
      const { close } = await inquirer.prompt([
        {
          name: "close",
          message: `Are you sure you want to close ${title.red}`,
          type: "confirm",
        },
      ]);

      if (close) {
        spinner.start();
        const {
          pullRequest: { title: closedTitle },
        } = await cc
          .updatePullRequestStatus({
            pullRequestId,
            pullRequestStatus: "CLOSED",
          })
          .promise();

        spinner.stop();
        console.log(` ${closedTitle} is now closed `.bgGreen.white);
      } else {
        console.log(" Okay, fine! ".bgRed.white);
      }
    } catch (error) {
      console.log(error);
    }
  });
