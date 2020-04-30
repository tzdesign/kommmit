# Utility for code commit 

## install

```
npm i kommmit -g
```

or with yarn

```
yarn global add kommmit
```

## usage

Simple utility for codecommit. Pull-Request focused

### Options:

*  -r, --region <region>  AWS region (default: "eu-west-1")
*  -h, --help             display help for command

### Commands:

* show <id>              Open the pull request in the browser
*  list [options]         List all pull requests
*  create                 Create a new pull request
*  close <id>             close a pull request
*  help [command]         display help for command