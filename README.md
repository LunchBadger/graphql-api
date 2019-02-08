# graphql-api

## Build image

### Login to AWS

`aws ecr get-login --no-include-email --region us-west-2 | sh -`

### Helper function to make build and push easier (create it once)

```shell
alias lbdbgql='function _lbdbgql(){ tag=$1; shift; docker build -t graphql . && docker tag graphql:latest 410240865662.dkr.ecr.us-west-2.amazonaws.com/graphql:$tag && docker push 410240865662.dkr.ecr.us-west-2.amazonaws.com/graphql:$tag $*; };_lbdbgql'

```

### Build and push

`lbdbgql 0.1.1`

