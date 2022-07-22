/* eslint-disable no-unused-vars */
const fs = require('fs')
let addresses = require('@oceanprotocol/contracts/addresses/address.json')

async function replaceContractAddresses() {
  // load addresses file first
  if (!process.argv[2]) {
    console.error('Missing network..')
    return
  }
  if (process.env.ADDRESS_FILE) {
    console.log('Using custom ADDRESS_FILE instead of ocean-contracts npm dep')
    addresses = JSON.parse(fs.readFileSync(process.env.ADDRESS_FILE, 'utf8'))
  }

  for (const network in addresses) {
    if (process.argv[2] != network) {
      console.log('Skipping ' + network)
      continue
    }
    console.log('Creating subgraph.yaml for ' + network)
    let subgraph = fs.readFileSync('./subgraph.template.yaml', 'utf8')

    subgraph = subgraph.replace(/__NETWORK__/g, network)
    subgraph = subgraph.replace(
      /__STARTBLOCK__/g,
      addresses[network].startBlock
    )
    subgraph = subgraph.replace(
      /__ERC721FACTORYADDRESS__/g,
      "'" + addresses[network].ERC721Factory + "'"
    )
    subgraph = subgraph.replace(
      /__FACTORYROUTERADDRESS__/g,
      "'" + addresses[network].Router + "'"
    )

    subgraph = subgraph.replace(
      /__VEALLOCATEADDRESS__/g,
      "'" + addresses[network].veAllocate + "'"
    )

    subgraph = subgraph.replace(
      /__DFREWARDSADDRESS__/g,
      "'" + addresses[network].DFRewards + "'"
    )
    if (process.env.BARGE_FOLDER) {
      subgraph = subgraph.replace(
        /__BARGEFOLDER__/g,
        "'" + process.env.BARGE_FOLDER + "'"
      )
    }
    fs.writeFileSync('subgraph.yaml', subgraph, 'utf8')
  }
}

replaceContractAddresses()
