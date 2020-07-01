#!/usr/bin/env node
require("colors");

const { program } = require("commander");

const { AWS_DEFAULT_REGION } = process.env;

program
  .name("kommit 🔥")
  .description("Simple utility for codecommit. Pull-Request focused")
  .option(
    "-r, --region <region>",
    "AWS region",
    AWS_DEFAULT_REGION || "eu-west-1"
  );

require("./commands/show");
require("./commands/list");
require("./commands/create");
require("./commands/close");

(async () => {
  await program.parse(process.argv);
})();
