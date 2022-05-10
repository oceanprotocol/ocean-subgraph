[![banner](https://raw.githubusercontent.com/oceanprotocol/art/master/github/repo-banner%402x.png)](https://oceanprotocol.com)

<h1 align="center">ocean-subgraph</h1>

> 🦀 Ocean Protocol Subgraph

<center>

[![Build Status](https://github.com/oceanprotocol/ocean-subgraph/workflows/CI/badge.svg)](https://github.com/oceanprotocol/ocean-subgraph/actions)

</center>

<center>

[![js oceanprotocol](https://img.shields.io/badge/js-oceanprotocol-7b1173.svg)](https://github.com/oceanprotocol/eslint-config-oceanprotocol)

</center>

- [🏄 Get Started](#-get-started)
- [⛵ Example Queries](#-example-queries)
- [🏊 Development on barge](#-development-on-barge)
- [🏊 Deploying graphs for live networks](#-Deploying-graphs-for-live-networks)
- [🔍 Testing](#-testing)
- [✨ Code Style](#-code-style)
- [🛳 Releases](#️-releases)
- [⬆️ Deployment](#️-deployment)
- [🏛 License](#-license)

## 🏄 Get Started

This subgraph is deployed under `/subgraphs/name/oceanprotocol/ocean-subgraph/` namespace for all networks the Ocean Protocol contracts are deployed to:

- [v4.subgraph.ropsten.oceanprotocol.com](https://v4.subgraph.ropsten.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph/graphql)
- [v4.subgraph.rinkeby.oceanprotocol.com](https://v4.subgraph.rinkeby.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph/graphql)
- [v4.subgraph.mumbai.oceanprotocol.com](https://v4.subgraph.mumbai.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph/graphql)
- [v4.subgraph.moonbase.oceanprotocol.com](https://v4.subgraph.moonbase.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph/graphql)

## ⛵ Example Queries

**All pools**

```graphql
{
  pools(orderBy: baseTokenLiquidity, orderDirection: desc) {
    id
    datatoken {
      address
    }
    baseToken {
      symbol
    }
    baseTokenLiquidity
    datatokenLiquidity
  }
}
```

**Pools with the highest liquidity**

```graphql
{
  pools(where: {datatokenLiquidity_gte: 1}, orderBy: baseTokenLiquidity, orderDirection: desc, first: 15) {
    id
    datatoken {
      address
    }
    baseToken {
      symbol
    }
    baseTokenLiquidity
    datatokenLiquidity
  }
}
```

**All Data NFTs**

```graphql
{
  nfts(orderBy: createdTimestamp, orderDirection: desc){
    id,
    symbol,
    name,
    creator,
    createdTimestamp
  }
}
```

**All pool transactions for a given user**

```graphql
{
    poolTransactions(
      orderBy: timestamp
      orderDirection: desc
      where: { user: $user }
      first: 1000
    ) {
      baseToken {
        symbol
        address
      }
      baseTokenValue
      datatoken {
        symbol
        address
      }
      datatokenValue
      type
      tx
      timestamp
      pool {
        datatoken {
          id
        }
        id
      }
    }
  }
```

> Note: all ETH addresses like `$user` in above example need to be passed as a lowercase string.

**All pool transactions for a given user in an individual pool**

```graphql
{
    poolTransactions(
      orderBy: timestamp
      orderDirection: desc
      where: { pool: $pool, user: $user }
      first: 1000
    ) {
      baseToken {
        symbol
        address
      }
      baseTokenValue
      datatoken {
        symbol
        address
      }
      datatokenValue
      type
      tx
      timestamp
      pool {
        datatoken {
          id
        }
        id
      }
    }
  }
```

## 🏊 Development on Barge


1. Clone [barge](https://github.com/oceanprotocol/barge) and run it in another terminal:

```bash
git clone https://github.com/oceanprotocol/barge.git
cd barge
./start_ocean.sh --with-thegraph
```

If you have cloned Barge previously, make sure you are using the latest version by running `git pull`.

2. Switch back to your main terminal and clone the repo and install dependencies:

```bash
git clone https://github.com/oceanprotocol/ocean-subgraph/
cd ocean-subgraph
npm i
```

3. Let the components know where to pickup the smart contract addresses. 
```
export ADDRESS_FILE="${HOME}/.ocean/ocean-contracts/artifacts/address.json"
```

4. Generate the subgraphs
```bash
node ./scripts/generatenetworkssubgraphs.js barge
npm run codegen
```

5. To deploy a subgraph use:

npm run create:local-barge
npm run deploy:local-barge

```bash
npm run create:local
npm run deploy:local
```

- Alternatively, if you want to get the sub-graph quickly running on barge, you can run `npm run quickstart:barge` which combines steps 4-5 above.

You now have a local graph-node running on http://127.0.0.1:9000/subgraphs/name/oceanprotocol/ocean-subgraph/graphql


## 🏊 Deploying graphs for live networks


1. Clone the repo and install dependencies:

```bash
git clone https://github.com/oceanprotocol/ocean-subgraph/
cd ocean-subgraph
npm i
```

2. Generate & deploy on rinkeby
```bash
npm run quickstart:rinkeby
```


## 🔍 Testing

- Please note: the `npm run test` command is currently not working due to [this issue](https://github.com/graphprotocol/graph-ts/issues/113).

To run the integration tests locally, first start up barge by following the instructions above, then run the following terminal commands from the ocean-subgraph folder: 

```Bash
export ADDRESS_FILE="${HOME}/.ocean/ocean-contracts/artifacts/address.json"
npm run test-integration
```

## ✨ Code Style

For linting and auto-formatting you can use from the root of the project:

```bash
# lint all js with eslint
npm run lint

# auto format all js & css with prettier, taking all configs into account
npm run format
```

## 🛳 Releases

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

## ⬆️ Deployment

Do the following to deploy the ocean-subgraph to a graph-node running locally, pointed against `mainnet`:

```bash
npm run codegen

# deploy
npm run create:local
npm run deploy:local
```

To deploy a subgraph connected to Rinkeby or Ropsten test networks, use instead:

```bash
# Rinkeby
npm run create:local-rinkeby
npm run deploy:local-rinkeby

# Ropsten
npm run create:local-ropsten
npm run deploy:local-ropsten
```

You can edit the event handler code and then run `npm run deploy:local`, with some caveats:

- Running deploy will fail if the code has no changes
- Sometimes deploy will fail no matter what, in this case:
  - Stop the docker-compose run (`docker-compose down` or Ctrl+C)
      This should stop the graph-node, ipfs and postgres containers
  - Delete the `ipfs` and `postgres` folders in `/docker/data` (`rm -rf ./docker/data/*`)
  - Run `docker-compose up` to restart graph-node, ipfs and postgres
  - Run `npm run create:local` to create the ocean-subgraph
  - Run `npm run deploy:local` to deploy the ocean-subgraph

> To deploy to one of the remote nodes run by Ocean, you can do port-forwarding and the above `:local` commands will work as is.

## 🏛 License

```
Copyright ((C)) 2022 Ocean Protocol Foundation

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
