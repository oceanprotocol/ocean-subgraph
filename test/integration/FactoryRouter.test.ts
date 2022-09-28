import {
  Router,
  NftFactory,
  calculateEstimatedGas,
  sendTx,
  sleep
} from '@oceanprotocol/lib'
import { AbiItem } from 'web3-utils'
import { assert } from 'chai'
import Web3 from 'web3'
import { homedir } from 'os'
import fs from 'fs'
import { fetch } from 'cross-fetch'

const data = JSON.parse(
  fs.readFileSync(
    process.env.ADDRESS_FILE ||
      `${homedir}/.ocean/ocean-contracts/artifacts/address.json`,
    'utf8'
  )
)

const addresses = data.development
const web3 = new Web3('http://127.0.0.1:8545')

const subgraphUrl =
  'http://127.0.0.1:9000/subgraphs/name/oceanprotocol/ocean-subgraph'

const minAbi = [
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'mint',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as AbiItem[]

async function getSubgraphApprovedTokens() {
  const tokens: string[] = []
  const initialQuery = {
    query: `query{
            opcs{
              approvedTokens{
                id
              }
            }
          }`
  }
  const initialResponse = await fetch(subgraphUrl, {
    method: 'POST',
    body: JSON.stringify(initialQuery)
  })
  const info = (await initialResponse.json()).data.opcs[0].approvedTokens
  for (let i = 0; i < info.length; i++) tokens.push(info[i].id)
  return tokens
}

describe('FactoryRouter tests', async () => {
  let factory
  let router: Router
  let ownerAccount: string
  let Alice: string
  let Bob: string
  let datatokenAddress
  // let nft1, nft2, nft3
  // let chainId
  // const configHelper = new ConfigHelper()
  // const config = configHelper.getConfig('development')

  before(async () => {
    const accounts = await web3.eth.getAccounts()
    // chainId = await web3.eth.getChainId()
    ownerAccount = accounts[0]
    Alice = accounts[1]
    Bob = accounts[2]

    const tokenContract = new web3.eth.Contract(minAbi, addresses.Ocean)
    const estGas = await calculateEstimatedGas(
      ownerAccount,
      tokenContract.methods.mint,
      Alice,
      web3.utils.toWei('100000')
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.mint,
      Alice,
      web3.utils.toWei('100000')
    )
    await sendTx(
      ownerAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.mint,
      Bob,
      web3.utils.toWei('100000')
    )
    router = new Router(addresses.Router, web3)
    // nftFactory = new NftFactory(addresses.ERC721Factory, web3)
    factory = new NftFactory(addresses.ERC721Factory, web3)
  })

  it('Ocean token should be in the approve token list', async () => {
    // since we can only lock once, we test if tx fails or not
    // so if there is already a lock, skip it
    const tokens = await getSubgraphApprovedTokens()
    assert(tokens.includes(addresses.Ocean.toLowerCase()))
    assert(tokens.length === 1)
  })
  it('Owner should add another token in the approved list', async () => {
    const nftName = 'testNFT'
    const nftSymbol = 'TST'
    const marketPlaceFeeAddress = '0x1230000000000000000000000000000000000000'
    const feeToken = '0x3210000000000000000000000000000000000000'
    const publishMarketFeeAmount = '0.1'
    const cap = '10000'
    const templateIndex = 1
    const result = await factory.createNftWithDatatoken(
      Alice,
      {
        name: nftName,
        symbol: nftSymbol,
        templateIndex,
        tokenURI: '',
        transferable: true,
        owner: Alice
      },
      {
        templateIndex,
        cap,
        feeAmount: publishMarketFeeAmount,
        paymentCollector: '0x0000000000000000000000000000000000000000',
        feeToken,
        minter: Alice,
        mpFeeAddress: marketPlaceFeeAddress,
        name: 'DT1',
        symbol: 'DT1'
      }
    )
    datatokenAddress = result.events.TokenCreated.returnValues[0].toLowerCase()
    await router.addApprovedToken(ownerAccount, datatokenAddress)
    await sleep(2000)
    const tokens = await getSubgraphApprovedTokens()
    assert(tokens.includes(datatokenAddress.toLowerCase()))
    assert(tokens.length === 2)
  })

  it('Owner should remove token from the approved list', async () => {
    await router.removeApprovedToken(ownerAccount, datatokenAddress)
    await sleep(2000)
    const tokens = await getSubgraphApprovedTokens()
    assert(!tokens.includes(datatokenAddress.toLowerCase()))
    assert(tokens.length === 1)
  })
})
