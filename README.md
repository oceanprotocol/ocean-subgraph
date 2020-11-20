# Ocean Protocol Subgraph

## Running locally
* Install the Graph: `https://thegraph.com/docs/quick-start`
  * You can skip running ganache-cli and connect directly to `mainnet` using Infura
  
```bash
git clone https://github.com/graphprotocol/graph-node/
cd graph-node/docker
./setup.sh
# Update this line in the `docker-compose.yml` file with your Infura ProjectId
#   ethereum: 'mainnet:https://mainnet.infura.io/v3/INFURA_PROJECT_ID'
docker-compose up

```

* Install Graph CLI globally with npm
```bash
npm install -g @graphprotocol/graph-cli
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
