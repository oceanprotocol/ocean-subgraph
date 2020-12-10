[![banner](https://raw.githubusercontent.com/oceanprotocol/art/master/github/repo-banner%402x.png)](https://oceanprotocol.com)

<h1 align="center">ocean-subgraph</h1>

> 🦀 Ocean Protocol Subgraph

[![Build Status](https://travis-ci.com/oceanprotocol/ocean-subgraph.svg&branch=main)](https://travis-ci.com/oceanprotocol/ocean.js)
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
  datatokens {
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

**All pool transactions for a user**

```graphql
{
  poolTransactions(
    orderBy: timestamp
    where: { userAddressStr: $userAddress }
  ) {
    poolAddressStr
  }
}
```

## 🦑 Development

```bash
npm i
npm start
```

- Install/run the Graph: `https://thegraph.com/docs/quick-start`

  - You can skip running ganache-cli and connect directly to `mainnet` using Infura

```bash
git clone https://github.com/graphprotocol/graph-node/
cd graph-node/docker
./setup.sh
# Update this line in the `docker-compose.yml` file with your Infura ProjectId
#   ethereum: 'mainnet:https://mainnet.infura.io/v3/INFURA_PROJECT_ID'
docker-compose up
```

Note: making contract calls using Infura fails with `missing trie node` errors. The fix requires editing `ethereum_adapter.rs` line 434 to use the latest block instead of a specific block number. Replace: `web3.eth().call(req, Some(block_id)).then(|result| {` with `web3.eth().call(req, Some(BlockNumber::Latest.into())).then(|result| {`

To run the graph-node with this fix it must be run from source.

First, delete the `graph-node` container from the `docker-compose.yml` file
then run `docker-compose up` to get the postgresql and ipfs services running.

Now you can build and run the graph-node from source

```
cargo run -p graph-node --release > graphnode.log --
  --postgres-url postgres://graph-node:let-me-in@localhost:5432/graph-node
  --ethereum-rpc mainnet:https://mainnet.infura.io/v3/INFURA_PROJECT_ID
  --ipfs 127.0.0.1:5001
```

- Once the graph node is ready, do the following to deploy the ocean-subgraph to the local graph-node

```bash
git clone https://github.com/oceanprotocol/ocean-subgraph/
cd ocean-subgraph
npm i
npm run codegen
npm run create:local
npm run deploy:local
```

- You can edit the event handler code and then run `npm run deploy:local`
  - Running deploy will fail if the code has no changes
  - Sometimes deploy will fail no matter what, in this case:
    - Stop the docker-compose run (`docker-compose down`)
    - Delete the `ipfs` and `postgres` folders in `graph-node/docker/data`
    - Restart docker-compose
    - Run `npm run create:local` to create the ocean-subgraph
    - Run `npm run deploy:local` to deploy the ocean-subgraph

## ✨ Code Style

For linting and auto-formatting you can use from the root of the project:

```bash
# lint all js with eslint
npm run lint

# auto format all js & css with prettier, taking all configs into account
npm run format
```

## ⬆️ Releases

Releases are managed semi-automatically. They are always manually triggered from a developer's machine with release scripts. From a clean `main` branch you can run the release task bumping the version accordingly based on semantic versioning:

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

## 🏛 License

```
Copyright ((C)) 2020 Ocean Protocol Foundation

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
