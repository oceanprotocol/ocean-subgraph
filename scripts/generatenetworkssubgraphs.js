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
    const subgraphVe = fs.readFileSync('./subgraph_ve.template.yaml', 'utf8')
    if (addresses[network].veOCEAN) {
      console.log('\t Adding veOCEAN')
      // fix identation , due to vs auto format (subgraph_ve.template is moved to left)
      const lines = subgraphVe.split('\n')
      for (let line = 0; line < lines.length; line++) {
        subgraph += '  ' + lines[line] + '\n'
      }
    }

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
      /__VEOCEANADDRESS__/g,
      "'" + addresses[network].veOCEAN + "'"
    )

    subgraph = subgraph.replace(
      /__VEDELEGATIONADDRESS__/g,
      "'" + addresses[network].veDelegation + "'"
    )

    subgraph = subgraph.replace(
      /__VEFEEDISTRIBUTORNADDRESS__/g,
      "'" + addresses[network].veFeeDistributor + "'"
    )

    subgraph = subgraph.replace(
      /__DFREWARDSADDRESS__/g,
      "'" + addresses[network].DFRewards + "'"
    )
    fs.writeFileSync('subgraph.yaml', subgraph, 'utf8')
  }
}

replaceContractAddresses()
