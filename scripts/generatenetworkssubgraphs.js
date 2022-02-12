/* eslint-disable no-unused-vars */
var fs = require('fs')
var addresses = require('@oceanprotocol/contracts/addresses/address.json')

async function replaceContractAddresses() {
  // load addresses file first
  if(process.env.ADDRESS_FILE){
      addresses = JSON.parse(fs.readFileSync( process.env.ADDRESS_FILE,'utf8'))
  }
  console.log(process.argv)
  for (const network in addresses) {
    if(process.argv[2] && process.argv[2] != network){
        console.log('Skipping '+network)
        continue
    }
    console.log("Creating subgraph."+network+".yaml")
    let subgraph = fs.readFileSync('./scripts/subgraph.yaml', 'utf8')

    subgraph = subgraph.replace(/__NETWORK__/g, network)
    subgraph = subgraph.replace(/__STARTBLOCK__/g, addresses[network]['startBlock'])
    subgraph = subgraph.replace(/__ERC721FACTORYADDRESS__/g, "'"+addresses[network]['ERC721Factory']+"'")
    subgraph = subgraph.replace(/__FIXEDRATEEXCHANGEADDRESS__/g, "'"+addresses[network]['FixedPrice']+"'")
    subgraph = subgraph.replace(/__DISPENSERADDRESS__/g, "'"+addresses[network]['FixedPrice']+"'")
    subgraph = subgraph.replace(/__FACTORYROUTERADDRESS__/g, "'"+addresses[network]['Router']+"'")
    if(network != 'development')
      fs.writeFileSync('subgraph.'+network+'.yaml', subgraph, 'utf8')
    else
    fs.writeFileSync('subgraph.yaml', subgraph, 'utf8')
  }
  return
  try {

    // const data = JSON.parse(
    //   fs.readFileSync(
    //     '/home/mihai/.ocean/ocean-contracts/artifacts/address.json',
    //     'utf8'
    //   )
    // )
    // const {
    //   DTFactory,
    //   // eslint-disable-next-line no-unused-vars
    //   ERC721Factory
    // } = data.development
    // let subgraph = fs.readFileSync('subgraph.yaml', 'utf8')
    // if (!data) {
    //   return false
    // }

    const ERC721Factory = '0x0599a4a2873B38D836E10302De1ca4834F7BDF4E'
    const FixedRateExchange = '0x2356DeCd8CFB6c6f2bf46b5ED4531818B4662337'
    const Dispenser = '0xb119b8895801111ff323ba63a77D4Fe78ED057a5'

    // ERC721Factory
    subgraph = subgraph.replace(
      /0x0599a4a2873B38D836E10302De1ca4834F7BDF4E/g,
      ERC721Factory
    )

    subgraph = subgraph.replace(
      /0x2356DeCd8CFB6c6f2bf46b5ED4531818B4662337/g,
      FixedRateExchange
    )

    subgraph = subgraph.replace(
      /0xb119b8895801111ff323ba63a77D4Fe78ED057a5/g,
      Dispenser
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
