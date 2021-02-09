[![banner](https://raw.githubusercontent.com/oceanprotocol/art/master/github/repo-banner%402x.png)](https://oceanprotocol.com)

<h1 align="center">ocean-subgraph</h1>

> 🦀 Ocean Protocol Subgraph

[![Build Status](https://github.com/oceanprotocol/ocean-subgraph/workflows/CI/badge.svg)](https://github.com/oceanprotocol/ocean-subgraph/actions)
[![js oceanprotocol](https://img.shields.io/badge/js-oceanprotocol-7b1173.svg)](https://github.com/oceanprotocol/eslint-config-oceanprotocol)

- [🏄 Get Started](#-get-started)
- [🧶 Example Queries](#-example-queries)
- [🦑 Development](#-development)
- [✨ Code Style](#-code-style)
- [⬆️ Releases](#️-releases)
- [🛳 Production](#-production)
- [⬆️ Deployment](#️-deployment)
- [🏛 License](#-license)

## 🏄 Get Started

This subgraph is deployed for all networks the Ocean Protocol contracts are deployed to:

- [subgraph.mainnet.oceanprotocol.com](https://subgraph.mainnet.oceanprotocol.com)
- [subgraph.ropsten.oceanprotocol.com](https://subgraph.ropsten.oceanprotocol.com)
- [subgraph.rinkeby.oceanprotocol.com](https://subgraph.ropsten.oceanprotocol.com)

## 🧶 Example Queries

**All pools**

```graphql
{
  pools(orderBy: oceanReserve, orderDirection: desc) {
    consumePrice
    datatokenReserve
    oceanReserve
    spotPrice
    swapFee
    transactionCount
  }
}
```

**All datatokens**

```graphql
{
  datatokens(orderBy: createTime, orderDirection: desc) {
    address
    symbol
    name
    cap
    supply
    publisher
    holderCount
  }
}
```

**All pool transactions for a given user**

```graphql
{
  poolTransactions(
    where: { userAddressStr: $userAddress }
    orderBy: timestamp
    orderDirection: desc
  ) {
    poolAddressStr
  }
}
```

> Note: all ETH addresses like `$userAddress` in above example need to be passed in lowercase.

## 🦑 Development

Prepare the docker setup:
```bash
cd docker
./setup.sh
```
Edit docker-compose and add your infura key & network

Start :
```bash
docker-compose up
```
To use with ifura key create a .env file (look at .env.example)
```bash
docker-compose --env-file .env up
```

Switch to a new terminal:

To deploy the ocean-subgraph to graph-node, see the `Deployment` section below.

You can make changes to the event handlers and/or features and re-deploy, again see the `Deployment` section below.

## ✨ Code Style

For linting and auto-formatting you can use from the root of the project:

```bash
# lint all js with eslint
npm run lint

# auto format all js & css with prettier, taking all configs into account
npm run format
```

## ⬆️ Releases

Releases are managed semi-automatically. They are always manually triggered from a developer's 
machine with release scripts. From a clean `main` branch you can run the release task bumping 
the version accordingly based on semantic versioning:

```bash
npm run release
```

The task does the following:

- bumps the project version in `package.json`, `package-lock.json`
- auto-generates and updates the CHANGELOG.md file from commit messages
- creates a Git tag
- commits and pushes everything
- creates a GitHub release with commit messages as description
- Git tag push will trigger Travis to do a npm release

For the GitHub releases steps a GitHub personal access token, exported as `GITHUB_TOKEN` is required. [Setup](https://github.com/release-it/release-it#github-releases)

## 🛳 Production

## ⬆️ Deployment
- Do the following to deploy the ocean-subgraph to a graph-node running locally:

```bash
git clone https://github.com/oceanprotocol/ocean-subgraph/
cd ocean-subgraph
npm i
npm run codegen
npm run create:local
npm run deploy:local
```

The above will deploy ocean-subgraph connecting to mainnet. To create/deploy subgraph connecting to Rinkeby or Ropsten test net, 
use :local-rinkeby or :local-ropsten with either create or deploy command.

- You can edit the event handler code and then run `npm run deploy:local`
  - Running deploy will fail if the code has no changes
  - Sometimes deploy will fail no matter what, in this case:
    - Stop the docker-compose run (`docker-compose down` or Ctrl+C)
      This should stop the graph-node, ipfs and postgres containers
    - Delete the `ipfs` and `postgres` folders in `/docker/data` (`rm -rf ./docker/data/*`)
    - Run `docker-compose up` to restart graph-node, ipfs and postgres
    - Run `npm run create:local` to create the ocean-subgraph
    - Run `npm run deploy:local` to deploy the ocean-subgraph

Note: to deploy to one of the remote nodes run by Ocean,  you can do port-forwarding then using the 
above `local` create/deploy commands will work as is.

## 🏛 License

```
Copyright ((C)) 2021 Ocean Protocol Foundation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
