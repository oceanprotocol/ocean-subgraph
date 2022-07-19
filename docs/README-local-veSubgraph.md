# Setup local subgraph for development
To develop new features on top of ocean-subgraph, it pay to deploy a local subgraph that points at ganache so you can deploy your contracts, execute their functionality, and query the local subgraph to verify events are being handled correctly and the right schema is being yielded.  
  
The following doc takes you through:  
1. Configuring `docker-compose.yml` to run the subgraph using a local ganache.  
2. Using `df-py` to deploy local contracts.  
3. Setting up, compiling, and deploying your local `ocean-subgraph` code
4. Testing & verifying that your subgraph is working as intended.  
  
Note 1: For this example, we're going to use the `df-py` repository and `veAllocate`

Note 2: For the sake of DRY, test coverage for the example below is being executed using `df-py`, and verification is being done by hand by viewing & querying GQL on the browser.  
  
### 1. Modify ./docker/docker-compose.yml to implement ganache
```
services:
  ganache:
    image: trufflesuite/ganache-cli:latest
    ports:
      - 8545:8545
    entrypoint: ["node", "/app/ganache-core.docker.cli.js", "--db", "./ganache_cache","--chainId","0x2324","--networkId","0x2324","--gasLimit","10000000000","--gasPrice","1","---hardfork","istanbul","--mnemonic","${GANACHE_MNEMONIC}", "-e", "1000000"]
  graph-node:
    environment:
      ethereum: 'development:http://ganache:8545'
```
  
### 2. using dftools deploy: [veOcean, veAllocate] in local net
```
  // deploy a new token on ganache
  dftool newToken 8996
  
  // use the token above to deploy veOcean on ganache
  dftool newVeOcean 8996 token_address

  // deploy veAllocate on ganache
  dftool newVeAllocate 8996
```
  
### 3a. generate `subgraph.yaml`
```
node ./scripts/generatenetworkssubgraphs.js
```
  
### 3b. update startBlock for each contract inside of `subgraph.yaml` to be 0
```
- kind: ethereum/contract
    source:
      startBlock: 0
```
  
### 4. deploy ocean-subgraph
navigate to `docker/` and deploy the containers via `docker-compose up`  
  
### 5a. run: `npm run codegen`
From the root folder run this command. 

You'll have to do this again every time you change `schema.graphql`  
  
### 5b. run: `npm run create:local`
From the root folder run this command. 

You'll have to do this again every time you run step 5a.

### 5c. run: `npm run deploy:local`
From the root folder run this command.

You'll have to do this again when you write any new subgraph code (mappings, utils, etc...).  
  
### 6. Execute onchain events + query subgraph
You can now start performing your onchain + contract tests and see the results inside of your local subgraph.  
  
As an example, you may use the following in `dftools` to monitor events inside of your local ganache.  
```
dftool manyrandom 8996
```