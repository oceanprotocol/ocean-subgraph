# Add contract as dataSource and use local Subgraph + Ganache + Brownie 
To develop new features on top of `ocean-subgraph`, it pays to deploy a local Subgraph that consumes from Ganache, so you can deploy your Contracts, execute their functionality, and query the Subgraph to verify Events are being Handled correctly, w/ the right Schema being yielded.  
  
The following doc takes you through:  
1. Configuring `docker-compose.yml` to run an internal Subgraph that consumes from a local Ganache.
2. Configuring `df-py` + Brownie to connect to the `ocean-subgraph` Ganache so we can deploy our local contracts.
3. Adding our smart contract as a dataSource for our internal Subgraph. We can then handle contract events, and transform that data into queryable entities using GQL.
4. Finally, we can hook our contracts into Testing & verifying that your subgraph is working as intended.  
  
Note 1: For this tutorial, you should be using multiple terminal windows. These will be referred to at the top of each section.

Note 2: For this example, we're going to use the `df-py` repository and integrate `veAllocate` contract into `ocean-subgraph`

Note 3: For the sake of versatility, the example below is being executed using `df-py` while verification is being done by hand by viewing & querying GQL on the browser.
  
### 1. ocean-subgraph - Add & Connect Ganache
Section 1 takes place inside `ocean-subgraph` terminal window.

You should have this repository configured and working on your machine.

We now need to update `./docker/docker-compose.yml` to implement a local instance of Ganache. Our `graph-node` needs to listen to Ganache for events, so we update the ethereum url.
```
services:
  ganache:
    image: trufflesuite/ganache-cli:latest
    ports:
      - 8545:8545
    entrypoint: ["node", "/app/ganache-core.docker.cli.js", "--db", "./ganache_cache","--chainId","0x2324","--networkId","0x2324","--gasLimit","10000000000","--gasPrice","1","---hardfork","istanbul","--mnemonic","${GANACHE_MNEMONIC}", "-e", "100", "-a", "20"]
  graph-node:
    environment:
      ethereum: 'development:http://ganache:8545'
```

Great, our docker environment is now setup. We can finally deploy it by typing `docker-compose up` inside of `./docker/`.

### 2a. df-py - Configure to connect to Subgraph
Section 2 takes place inside `df-py` terminal window.

You should have this repository configured and working on your machine.

First, we make sure that we're inside our venv by typing `source venv/bin/activate/`. Again, we're assuming your requirements.txt, and other dependencies have been properly initialized.

We now `df-py` connect to Ganache via Brownie. To do this, we're going to add a network so Brownie can listen to our Ganache service.
```
brownie networks add Ethereum subgraph-ganache host=http://127.0.0.1:8545, chainid=8996
```

We then update our `brownie-config.yaml` so that it uses the network above by default.
```
networks:
  default: subgraph-ganache
```

You should now be able to verify that the accounts from `subgraph-ganache` are working from inside `df-py` brownie.
```
brownie console --network subgraph-ganache
>>> accounts[0].balance()
100000000000000000000
```

### 2b. df-py - Configure dftools and deploy contracts
This section continues from Section 2.

We can now, also configure dftools to use accounts from Ganache, and deploy contracts into `ocean-subgraph`.

Look inside the `ocean-subgraph` terminal for the private accounts that were generated for you inside of Ganache. Copy one of their private keys, and do the following inside of `df-py/(venv)/`
```
export DFTOOL_KEY=0xYourUserPrivateKeyFromGanache
export WEB3_INFURA_PROJECT_ID=YourInfuraKey
```

You should now be able to deploy a newToken + veOCEAN + veAllocate contracts.
```
  // deploy a new token
  dftool newToken 8996
  
  // use the token address from above to deploy veOcean
  dftool newVeOcean 8996 token_address

  // deploy veAllocate
  dftool newVeAllocate 8996
```

You will need the address from the new `veAllocate` contract you just deployed for the next section. This contract will be used in the future so our subgraph can listen for events.

### 3a. ocean-subgraph - Initialize the project
Section 3 takes place inside `ocean-subgraph` terminal.

We're going to now generate `subgraph.yaml` so we can start connecting the veOCEAN contract into the logic of `ocean-subpgrah`.

We begin by running the following node script from the root folder.
```
node ./scripts/generatenetworkssubgraphs.js
```

Here, we're going to configure our local `subgraph.yaml` file so we can serve our local ganache, contracts, and everything that `df-py` depends on.

Use this file for all of your development until you have things sorted out. If you make any mistakes, you can just recreate the file. You should make your final changes inside of `subgraph.template.yaml` before submitting a PR.

### 3b. ocean-subgraph - Configure dataSources

We now configure our `subgraph.yaml` to talk to ganache and add our veAllocate Contract as a dataSource.  

Our first step is to reset our `subgraph.yaml` so that it can consume all the events. Do a search for `startBlock` and make sure all params are initialized to 0.
```
- kind: ethereum/contract
    source:
      startBlock: 0
```
  
We then add our contract as a dataSource. We get our address from Section 2b `dftool newVeAllocate 8996` and enter it in the `dataSources` section of the `subgraph.yaml` file.
```
dataSources:
  - kind: ethereum/contract
    name: veAllocate
    network: development
    source:
      address: 0x0000000000000000000000000000000
      abi: veAllocate
      startBlock: 0
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      file: ./src/mappings/veAllocate.ts
      entities:
        - veAllocate
      abis:
        - name: veAllocate
          file: ./abis/veAllocate.json
      eventHandlers:
        - event: AllocationSet(address indexed sender, address indexed nft, uint256 indexed chainId, uint256 amount)
          handler: handleAllocationSet
```

As you can see, we have also imported our `veAllocate.json ABI` file into the project, added the contract events we want to handle, and created a mapping script `./src/mappings/veAllocate.ts` so we can handle all the vents for the Subgraph.

Note: This tutorial will not go into details of how to do this work. Someone can create a separate guide on how to handle internal logic, define GraphQL entities, and save records into GraphQL.

_Please review the PR associated with this README for more intuition on this_
  
### 4a. ocean-subgraph - run: `npm run codegen`
From the root folder run this command. 

You'll have to do this again every time you change `schema.graphql`  
  
### 4b. ocean-subgraph - run: `npm run create:local`
From the root folder run this command. 

You'll have to do this again every time you run step 5a.

### 4c. ocean-subgraph - run: `npm run deploy:local`
From the root folder run this command.

You'll have to do this again when you write any new subgraph code (mappings, utils, etc...).  
  
### 5. ocean-subgraph - restart docker 
Restart docker containers via `docker-compose up`  
  
### 6. df-py - Execute onchain events + query subgraph
You can now start performing your onchain + contract tests and see records inside of your local subgraph.
  
As an example, you may use the following command inside `dftools` to generate many onchain events for Ganache.
```
dftool manyrandom 8996
```