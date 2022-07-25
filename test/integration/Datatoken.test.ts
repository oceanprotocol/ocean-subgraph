import {
  Erc20CreateParams,
  ProviderInstance,
  Nft,
  NftFactory,
  NftCreateData,
  getHash,
  sleep
} from '@oceanprotocol/lib'
import { assert } from 'chai'
import Web3 from 'web3'
import { SHA256 } from 'crypto-js'
import { homedir } from 'os'
import fs from 'fs'
import { fetch } from 'cross-fetch'
import { TransactionReceipt } from 'web3-core'

const data = JSON.parse(
  fs.readFileSync(
    process.env.ADDRESS_FILE ||
      `${homedir}/.ocean/ocean-contracts/artifacts/address.json`,
    'utf8'
  )
)

const addresses = data.development
// const aquarius = new Aquarius('http://127.0.0.1:5000')
const web3 = new Web3('http://127.0.0.1:8545')

const providerUrl = 'http://172.15.0.4:8030'
const subgraphUrl =
  'http://127.0.0.1:9000/subgraphs/name/oceanprotocol/ocean-subgraph'
const assetUrl = [
  {
    type: 'url',
    url: 'https://raw.githubusercontent.com/oceanprotocol/testdatasets/main/shs_dataset_test.txt',
    method: 'GET'
  }
]
const ddo = {
  '@context': ['https://w3id.org/did/v1'],
  id: 'did:op:efba17455c127a885ec7830d687a8f6e64f5ba559f8506f8723c1f10f05c049c',
  version: '4.0.0',
  chainId: 4,
  nftAddress: '0x0',
  metadata: {
    created: '2021-12-20T14:35:20Z',
    updated: '2021-12-20T14:35:20Z',
    type: 'dataset',
    name: 'dfgdfgdg',
    description: 'd dfgd fgd dfg dfgdfgd dfgdf',
    tags: [''],
    author: 'dd',
    license: 'https://market.oceanprotocol.com/terms',
    additionalInformation: {
      termsAndConditions: true
    }
  },
  services: [
    {
      id: 'notAnId',
      type: 'access',
      files: '',
      datatokenAddress: '0xa15024b732A8f2146423D14209eFd074e61964F3',
      serviceEndpoint: 'https://providerv4.rinkeby.oceanprotocol.com',
      timeout: 0
    }
  ]
}

describe('Datatoken tests', async () => {
  const nftName = 'testNFT'
  const nftSymbol = 'TST'
  const marketPlaceFeeAddress = '0x1230000000000000000000000000000000000000'
  const feeToken = '0x3210000000000000000000000000000000000000'
  const publishMarketFeeAmount = '0.1'
  const cap = '10000'
  let datatokenAddress: string
  let nft: Nft
  let Factory: NftFactory
  let factoryAddress: string
  let accounts: string[]
  let publisher: string
  let erc721Address: string
  let nftAddress: string
  let time: number
  let blockNumber: number

  before(async () => {
    nft = new Nft(web3)
    factoryAddress = addresses.ERC721Factory.toLowerCase()
    Factory = new NftFactory(factoryAddress, web3)
    accounts = await web3.eth.getAccounts()
    publisher = accounts[0].toLowerCase()
  })

  it('should publish an NFT & datatoken', async () => {
    const date = new Date()
    time = Math.floor(date.getTime() / 1000)
    blockNumber = await web3.eth.getBlockNumber()

    const nftParams: NftCreateData = {
      name: nftName,
      symbol: nftSymbol,
      templateIndex: 1,
      tokenURI: '',
      transferable: true,
      owner: publisher
    }
    const erc20Params: Erc20CreateParams = {
      templateIndex: 1,
      cap,
      feeAmount: publishMarketFeeAmount,
      paymentCollector: '0x0000000000000000000000000000000000000000',
      feeToken,
      minter: publisher,
      mpFeeAddress: marketPlaceFeeAddress
    }
    const result = await Factory.createNftWithErc20(
      publisher,
      nftParams,
      erc20Params
    )
    erc721Address = result.events.NFTCreated.returnValues[0].toLowerCase()
    datatokenAddress = result.events.TokenCreated.returnValues[0].toLowerCase()

    // Check values before updating metadata
    await sleep(2000)
    nftAddress = erc721Address.toLowerCase()
    const initialQuery = {
      query: `query {
        token(id: "${datatokenAddress}"){    
          id,
          symbol,
          name,
          decimals,
          address,
          cap,
          supply,
          isDatatoken,
          nft {id},
          minter,
          paymentManager,
          paymentCollector,
          publishMarketFeeAddress,
          publishMarketFeeAmount,
          templateId,
          holderCount,
          orderCount,
          orders {id},
          fixedRateExchanges {id},
          dispensers {id},
          createdTimestamp,
          tx,
          block,
          lastPriceToken,
          lastPriceValue
        }}`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    await sleep(2000)
    const dt = (await initialResponse.json()).data.token

    const tx: TransactionReceipt = await web3.eth.getTransactionReceipt(dt.tx)
    assert(dt.id === datatokenAddress, 'incorrect value for: id')
    assert(dt.symbol, 'incorrect value for: symbol')
    assert(dt.name, 'incorrect value for: name')
    assert(dt.decimals === 18, 'incorrect value for: decimals')
    assert(dt.address === datatokenAddress, 'incorrect value for: address')
    assert(dt.cap === cap, 'incorrect value for: cap')
    assert(dt.supply === '0', 'incorrect value for: supply')
    assert(dt.isDatatoken === true, 'incorrect value for: isDatatoken')
    assert(dt.nft.id === erc721Address, 'incorrect value for: nft.id')
    assert(dt.minter[0] === publisher, 'incorrect value for: minter')
    assert(dt.paymentManager === null, 'incorrect value for: paymentManager')
    assert(
      dt.paymentCollector === null,
      'incorrect value for: paymentCollector'
    )
    assert(
      dt.publishMarketFeeAddress === marketPlaceFeeAddress,
      'incorrect value for: publishMarketFeeAddress'
    )
    assert(
      dt.publishMarketFeeAmount === publishMarketFeeAmount,
      'incorrect value for: publishMarketFeeAmount'
    )
    assert(dt.templateId === null, 'incorrect value for: templateId')
    assert(dt.holderCount === '0', 'incorrect value for: holderCount')
    assert(dt.orderCount === '0', 'incorrect value for: orderCount')
    assert(dt.orders, 'incorrect value for: orders')
    assert(dt.fixedRateExchanges, 'incorrect value for: fixedRateExchanges')
    assert(dt.dispensers, 'incorrect value for: dispensers')
    assert(dt.createdTimestamp >= time, 'incorrect value for: createdTimestamp')
    assert(
      dt.createdTimestamp < time + 5,
      'incorrect value for: createdTimestamp'
    )
    assert(tx.from === publisher, 'incorrect value for: tx')
    assert(tx.to === factoryAddress, 'incorrect value for: tx')
    assert(tx.blockNumber >= blockNumber, 'incorrect value for: tx')
    assert(dt.block >= blockNumber, 'incorrect value for: block')
    assert(dt.block < blockNumber + 50, 'incorrect value for: block')
    assert(
      dt.lastPriceToken === '0x0000000000000000000000000000000000000000',
      'incorrect value for: lastPriceToken'
    )
    assert(dt.lastPriceValue === '0', 'incorrect value for: lastPriceValue')
  })

  it('Update metadata', async () => {
    // create the files encrypted string
    let providerResponse = await ProviderInstance.encrypt(assetUrl, providerUrl)
    ddo.services[0].files = await providerResponse
    ddo.services[0].datatokenAddress = datatokenAddress
    // update ddo and set the right did
    ddo.nftAddress = erc721Address
    const chain = await web3.eth.getChainId()
    ddo.id =
      'did:op:' +
      SHA256(web3.utils.toChecksumAddress(erc721Address) + chain.toString(10))

    providerResponse = await ProviderInstance.encrypt(ddo, providerUrl)
    const encryptedResponse = await providerResponse
    const metadataHash = getHash(JSON.stringify(ddo))
    await nft.setMetadata(
      erc721Address,
      publisher,
      0,
      providerUrl,
      '',
      '0x2',
      encryptedResponse,
      '0x' + metadataHash
    )

    // graph tests here
    await sleep(2000)
    const query = {
      query: `query {
              nft(id:"${nftAddress}"){
                id,
                symbol,
                name,
                tokenUri,
                owner,
                creator,
                address,
                providerUrl,
                assetState,
                managerRole,
                erc20DeployerRole,
                storeUpdateRole,
                metadataRole,
                template,
                transferable,
                createdTimestamp,
                tx,
                block,
                orderCount}}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    const updatedNft = (await response.json()).data.nft
    const tx: TransactionReceipt = await web3.eth.getTransactionReceipt(
      updatedNft.tx
    )
    assert(updatedNft.id === nftAddress, 'incorrect value for: id')
    assert(updatedNft.symbol === nftSymbol, 'incorrect value for: symbol')
    assert(updatedNft.name === nftName, 'incorrect value for: name')
    assert(updatedNft.tokenUri === '', 'incorrect value for: tokenUri')
    assert(updatedNft.owner === publisher, 'incorrect value for: owner')
    assert(updatedNft.creator === publisher, 'incorrect value for: creator')
    assert(
      updatedNft.managerRole[0] === publisher,
      'incorrect value for: managerRole'
    )
    assert(
      updatedNft.erc20DeployerRole[0] === factoryAddress,
      'incorrect value for: erc20DeployerRole'
    )
    assert(
      updatedNft.storeUpdateRole === null,
      'incorrect value for: storeUpdateRole'
    )
    assert(
      updatedNft.metadataRole === null,
      'incorrect value for: metadataRole'
    )
    assert(updatedNft.template === '', 'incorrect value for: template')
    assert(
      updatedNft.transferable === true,
      'incorrect value for: transferable'
    )
    assert(
      updatedNft.createdTimestamp >= time,
      'incorrect value for: createdTimestamp'
    )
    assert(
      updatedNft.createdTimestamp < time + 5,
      'incorrect value for: createdTimestamp'
    )
    assert(tx.from === publisher, 'incorrect value for: tx')
    assert(tx.to === factoryAddress, 'incorrect value for: tx')
    assert(tx.blockNumber >= blockNumber, 'incorrect value for: tx')
    assert(updatedNft.block >= blockNumber, 'incorrect value for: block')
    assert(updatedNft.block < blockNumber + 50, 'incorrect value for: block')
    assert(updatedNft.orderCount === '0', 'incorrect value for: orderCount')
  })
})
