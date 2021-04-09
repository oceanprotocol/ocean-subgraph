/* eslint-disable no-unused-vars */
var fs = require('fs')

async function replaceContractAddresses() {
  // load barge addresses first
  try {
    const data = JSON.parse(fs.readFileSync(process.env.ADDRESS_FILE, 'utf8'))
    const {
      DTFactory,
      // eslint-disable-next-line no-unused-vars
      BFactory,
      // eslint-disable-next-line no-unused-vars
      FixedRateExchange,
      // eslint-disable-next-line no-unused-vars
      Metadata
    } = data.development
    let subgraph = fs.readFileSync('subgraph.yaml', 'utf8')
    if (!data) {
      return false
    }
    // BFactory
    subgraph = subgraph.replace(
      /0xbe0083053744ECb871510C88dC0f6b77Da162706/g,
      BFactory
    )
    // dt factory
    subgraph = subgraph.replace(
      /0x57317f97E9EA49eBd19f7c9bB7c180b8cDcbDeB9/g,
      DTFactory
    )
    // metadata
    subgraph = subgraph.replace(
      /0x1a4b70d8c9DcA47cD6D0Fb3c52BB8634CA1C0Fdf/g,
      Metadata
    )
    // fixed rate exchgage
    subgraph = subgraph.replace(
      /0x608d05214E42722B94a54cF6114d4840FCfF84e1/g,
      FixedRateExchange
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
