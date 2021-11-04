/* eslint-disable no-unused-vars */
var fs = require('fs')

async function replaceContractAddresses() {
  // load barge addresses first
  try {
    const data = JSON.parse(
      fs.readFileSync(
        '/home/mihai/.ocean/ocean-contracts/artifacts/address.json',
        'utf8'
      )
    )
    const {
      DTFactory,
      // eslint-disable-next-line no-unused-vars
      ERC721Factory
    } = data.development
    let subgraph = fs.readFileSync('subgraph.yaml', 'utf8')
    if (!data) {
      return false
    }
    // ERC721Factory
    subgraph = subgraph.replace(
      /0x17d55A3501999FFBF9b0623cDB258611419d01F5/g,
      ERC721Factory
    )
    // network
    subgraph = subgraph.replace(/network: mainnet/g, 'network: barge')

    // startBlocks
    subgraph = subgraph.replace(/startBlock:[ 0-9].*/g, 'startBlock: 0')

    fs.writeFileSync('subgraph.barge.yaml', subgraph, 'utf8')
  } catch (e) {
    console.error('Failed to load address.json')
    console.error(e)
    process.exit(1)
  }
}

replaceContractAddresses()
