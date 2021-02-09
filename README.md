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

This subgraph is deployed under `/subgraphs/name/oceanprotocol/ocean-subgraph/` namespace for all networks the Ocean Protocol contracts are deployed to:

- [subgraph.mainnet.oceanprotocol.com](https://subgraph.mainnet.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph/graphql)
- [subgraph.ropsten.oceanprotocol.com](https://subgraph.ropsten.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph/graphql)
- [subgraph.rinkeby.oceanprotocol.com](https://subgraph.ropsten.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph/graphql)

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

First clone repo and install dependencies:

```bash
git clone https://github.com/oceanprotocol/ocean-subgraph/
cd ocean-subgraph
npm i
```

Developing and testing any change requires them to be deployed against a locally running graph-node and some other components running in Docker. Make sure you have Docker and Docker Compose installed on your machine, then prepare the Docker setup:

```bash
cd docker
./setup.sh
```

Then add your Infura key as environment variable with a `.env` file, and start everything up with Docker Compose:

```bash
# create .env and modify
cp .env.example .env

docker-compose --env-file .env up
```

The default network for development is Rinkeby. If you want to switch to another network you have to modify the `docker/docker-compose.yml` file within `environment.ethereum`.

You now have a local graph-node running and can start deploying your changes to it. To do so, follow the [Deployment instructions](#️-deployment).

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

Do the following to deploy the ocean-subgraph to a graph-node running locally:

```bash
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
