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


### Options:
*  -r, --region <region>   AWS region (Default is your ENV AWS_DEFAULT_REGION or eu-west, because i like it) (default: "eu-west-1")
*  -o, --open              list only open request
*  -d, --show-description  show the description (default: false)
*  -m, --max <number>      limit for requests (default: 10)
*  -a, --all-branches      will show all branches. Default shows current branches only (default: false)
*  -h, --help              display help for command

### Commands:
*  request                 Create a new pull request
*  show <id>               Open the pull request in the browser
*  list                    Lists all pull request (Default presents current branch only)