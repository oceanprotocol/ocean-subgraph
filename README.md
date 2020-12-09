# Ocean Protocol Subgraph

## Running locally

* Install Graph CLI globally with npm
```bash
npm install -g @graphprotocol/graph-cli
```

* Install/run the Graph: `https://thegraph.com/docs/quick-start`
  * You can skip running ganache-cli and connect directly to `mainnet` using Infura
  
```bash
git clone https://github.com/graphprotocol/graph-node/
cd graph-node/docker
./setup.sh
# Update this line in the `docker-compose.yml` file with your Infura ProjectId
#   ethereum: 'mainnet:https://mainnet.infura.io/v3/INFURA_PROJECT_ID'
docker-compose up

```

Note: making contract calls using Infura fails with `missing trie node` errors. 
The fix requires editing `ethereum_adapter.rs` line 434 to use the latest block 
instead of a specific block number. 
Replace:
`web3.eth().call(req, Some(block_id)).then(|result| {` 
with `web3.eth().call(req, Some(BlockNumber::Latest.into())).then(|result| {`   

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

* Once the graph node is ready, do the following to deploy the ocean-subgraph to the local graph-node
```bash
git clone https://github.com/oceanprotocol/ocean-subgraph/
cd ocean-subgraph
npm i
npm run codegen
npm run create:local
npm run deploy:local

```

* You can edit the event handler code and then run `npm run deploy:local`
  * Running deploy will fail if the code has no changes
  * Sometimes deploy will fail no matter what, in this case:
    * Stop the docker-compose run (`docker-compose down`) 
    * Delete the `ipfs` and `postgres` folders in `graph-node/docker/data` 
    * Restart docker-compose
    * Run `npm run create:local` to create the ocean-subgraph
    * Run `npm run deploy:local` to deploy the ocean-subgraph
