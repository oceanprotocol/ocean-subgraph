import {
  DatatokenCreateParams,
  Nft,
  NftFactory,
  NftCreateData,
  sleep
} from '@oceanprotocol/lib'
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

describe('Tests coverage without provider/aquarius', async () => {
  let nft: Nft
  let Factory: NftFactory
  let accounts: string[]
  let publisherAccount: string
  let newOwnerAccount: string
  let time: number

  before(async () => {
    nft = new Nft(web3)
    Factory = new NftFactory(addresses.ERC721Factory, web3)
    accounts = await web3.eth.getAccounts()
    publisherAccount = accounts[0]
    newOwnerAccount = accounts[1].toLowerCase()
    const date = new Date()
    time = Math.floor(date.getTime() / 1000)
  })

  it('should publish a dataset (create NFT + ERC20)', async () => {
    const nftParams: NftCreateData = {
      name: 'testNFT',
      symbol: 'TST',
      templateIndex: 1,
      tokenURI: '',
      transferable: true,
      owner: publisherAccount
    }
    const erc20Params: DatatokenCreateParams = {
      templateIndex: 1,
      cap: '100000',
      feeAmount: '0',
      paymentCollector: '0x0000000000000000000000000000000000000000',
      feeToken: '0x0000000000000000000000000000000000000000',
      minter: publisherAccount,
      mpFeeAddress: '0x0000000000000000000000000000000000000000'
    }
    const result = await Factory.createNftWithDatatoken(
      publisherAccount,
      nftParams,
      erc20Params
    )
    const erc721Address = result.events.NFTCreated.returnValues[0]

    // graph tests here
    await sleep(3000)
    const graphNftToken = erc721Address.toLowerCase()
    const query = {
      query: `query {
          nft(id:"${graphNftToken}"){symbol,id,eventIndex}}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    await sleep(3000)
    const queryResult = await response.json()
    assert(queryResult.data.nft.id === graphNftToken)
    console.log(
      '85 line queryResult.data.nft.eventIndex: ',
      queryResult.data.nft.eventIndex
    )
    assert(
      queryResult.data.nft.eventIndex !== null &&
        queryResult.data.nft.eventIndex > 0
    )
  })

  it('should publish and transfer an NFT', async () => {
    const nftParams: NftCreateData = {
      name: 'testNFT',
      symbol: 'TST',
      templateIndex: 1,
      tokenURI: '',
      transferable: true,
      owner: publisherAccount
    }
    const erc20Params: DatatokenCreateParams = {
      templateIndex: 1,
      cap: '100000',
      feeAmount: '0',
      paymentCollector: '0x0000000000000000000000000000000000000000',
      feeToken: '0x0000000000000000000000000000000000000000',
      minter: publisherAccount,
      mpFeeAddress: '0x0000000000000000000000000000000000000000'
    }
    const result = await Factory.createNftWithDatatoken(
      publisherAccount,
      nftParams,
      erc20Params
    )
    await sleep(3000)
    const erc721Address = result.events.NFTCreated.returnValues[0]
    const nftAddress = erc721Address.toLowerCase()

    // Transfer the NFT
    const tx = await nft.transferNft(
      nftAddress,
      publisherAccount,
      newOwnerAccount
    )

    await sleep(3000)
    const query2 = {
      query: `query {
          nft(id:"${nftAddress}"){
            symbol,
            id,
            owner{id}, 
            transferable, 
            transferHistory(orderBy: timestamp, orderDirection: desc){id,nft,oldOwner,newOwner,txId,eventIndex,timestamp,block}
          }}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query2)
    })
    await sleep(3000)
    const queryResult = await response.json()
    const transferHistory = queryResult.data.nft.transferHistory[0]

    assert(queryResult.data.nft.owner.id === newOwnerAccount)
    assert(
      transferHistory.id ===
        `${nftAddress}-${
          tx.transactionHash
        }-${tx.events.Transfer.logIndex.toFixed(1)}`,
      'Invalid transferHistory Id'
    )
    assert(transferHistory.txId === tx.transactionHash, 'invalid txId')
    assert(
      transferHistory.eventIndex === tx.events.Transfer.logIndex,
      'invalid eventIndex'
    )
    assert(transferHistory.timestamp)

    assert(transferHistory.timestamp >= time - 500, 'incorrect value timestamp')
    assert(transferHistory.timestamp < time + 500, 'incorrect value timestamp')
    assert(transferHistory.block === tx.blockNumber, 'blockNumber')
  })
})
