import {
  DatatokenCreateParams,
  ProviderInstance,
  Nft,
  NftFactory,
  NftCreateData,
  getHash,
  sleep,
  Datatoken,
  ProviderFees,
  ZERO_ADDRESS,
  signHash
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
  const templateIndex = 1
  let datatokenAddress: string
  let nft: Nft
  let Factory: NftFactory
  let factoryAddress: string
  let accounts: string[]
  let publisher: string
  let user1: string
  let user2: string
  let user3: string
  let erc721Address: string
  let time: number
  let blockNumber: number

  before(async () => {
    nft = new Nft(web3)
    factoryAddress = addresses.ERC721Factory.toLowerCase()
    Factory = new NftFactory(factoryAddress, web3)
    accounts = await web3.eth.getAccounts()
    publisher = accounts[0].toLowerCase()
    user1 = accounts[1].toLowerCase()
    user2 = accounts[2].toLowerCase()
    user3 = accounts[3].toLowerCase()
  })

  it('should publish an NFT & datatoken', async () => {
    const date = new Date()
    time = Math.floor(date.getTime() / 1000)
    blockNumber = await web3.eth.getBlockNumber()

    const nftParams: NftCreateData = {
      name: nftName,
      symbol: nftSymbol,
      templateIndex,
      tokenURI: '',
      transferable: true,
      owner: publisher
    }
    const erc20Params: DatatokenCreateParams = {
      templateIndex,
      cap,
      feeAmount: publishMarketFeeAmount,
      paymentCollector: '0x0000000000000000000000000000000000000000',
      feeToken,
      minter: publisher,
      mpFeeAddress: marketPlaceFeeAddress
    }
    const result = await Factory.createNftWithDatatoken(
      publisher,
      nftParams,
      erc20Params
    )
    erc721Address = result.events.NFTCreated.returnValues[0].toLowerCase()
    datatokenAddress = result.events.TokenCreated.returnValues[0].toLowerCase()

    // Check values before updating metadata
    await sleep(2000)
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
          lastPriceValue
        }}`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    await sleep(2000)
    const dt = (await initialResponse.json()).data.token
    assert(dt !== undefined, 'undefined token')
    const dtTx = dt.tx

    const tx: TransactionReceipt = await web3.eth.getTransactionReceipt(dtTx)
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

    assert(dt.templateId === templateIndex, 'incorrect value for: templateId')
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
    assert(dt.lastPriceValue === '0', 'incorrect value for: lastPriceValue')
  })

  it('Correct Datatoken fields after updating metadata', async () => {
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

    // Check values before updating metadata
    await sleep(2000)
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
          lastPriceValue
        }}`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    await sleep(2000)
    const dt = (await initialResponse.json()).data.token
    assert(dt !== undefined, 'undefined token')
    const dtTx = dt.tx

    const tx: TransactionReceipt = await web3.eth.getTransactionReceipt(dtTx)
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
    assert(dt.templateId === templateIndex, 'incorrect value for: templateId')
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
    assert(dt.lastPriceValue === '0', 'incorrect value for: lastPriceValue')
  })

  it('Check datatoken orders are updated correctly after publishing & ordering a datatoken', async () => {
    // Start with publishing a new datatoken
    const nftParams: NftCreateData = {
      name: 'newNFT',
      symbol: 'newTST',
      templateIndex,
      tokenURI: '',
      transferable: true,
      owner: publisher
    }
    const erc20Params: DatatokenCreateParams = {
      templateIndex,
      cap: '100000',
      feeAmount: '0',
      paymentCollector: ZERO_ADDRESS,
      feeToken: ZERO_ADDRESS,
      minter: publisher,
      mpFeeAddress: ZERO_ADDRESS
    }
    const result = await Factory.createNftWithDatatoken(
      publisher,
      nftParams,
      erc20Params
    )
    await sleep(2000)
    const newDtAddress = result.events.TokenCreated.returnValues[0]

    const datatoken = new Datatoken(web3, 8996)
    await datatoken.mint(newDtAddress, publisher, '100', user1)
    const user1balance = await datatoken.balance(newDtAddress, user1)
    const user2balance = await datatoken.balance(newDtAddress, user2)
    assert(Number(user1balance) === 100, 'Invalid user1 balance')
    assert(Number(user2balance) === 0, 'Invalid user2 balance')

    const query = {
      query: `query {token(id: "${newDtAddress.toLowerCase()}"){id,orderCount,orders {id, nftOwner{id}, lastPriceToken{id}}}}`
    }

    await sleep(2000)
    let response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })

    const initialToken = (await response.json()).data.token

    assert(initialToken, 'Invalid initialToken')
    assert(initialToken.orderCount === '0', 'Invalid initial orderCount')
    assert(initialToken.orders.length === 0, 'Invalid initial orders')

    const providerData = JSON.stringify({ timeout: 0 })
    const providerFeeToken = ZERO_ADDRESS
    const providerFeeAmount = '10000'
    const providerValidUntil = '0'
    const message = web3.utils.soliditySha3(
      { t: 'bytes', v: web3.utils.toHex(web3.utils.asciiToHex(providerData)) },
      { t: 'address', v: user3 },
      { t: 'address', v: providerFeeToken },
      { t: 'uint256', v: providerFeeAmount },
      { t: 'uint256', v: providerValidUntil }
    )
    assert(message, 'Invalid message')
    const { v, r, s } = await signHash(web3, message, user3)
    const setProviderFee: ProviderFees = {
      providerFeeAddress: user3,
      providerFeeToken,
      providerFeeAmount,
      v,
      r,
      s,
      providerData: web3.utils.toHex(web3.utils.asciiToHex(providerData)),
      validUntil: providerValidUntil
    }
    assert(setProviderFee, 'Invalid setProviderFee')
    const orderTx = await datatoken.startOrder(
      newDtAddress,
      user1,
      user2,
      1,
      setProviderFee
    )
    assert(orderTx, 'Invalid orderTx')
    const orderId = `${orderTx.transactionHash.toLowerCase()}-${newDtAddress.toLowerCase()}-${user1.toLowerCase()}`

    await sleep(2000)
    response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })

    const token = (await response.json()).data.token

    assert(token, 'Invalid token')
    assert(token.orderCount === '1', 'Invalid orderCount after order')
    assert(token.orders[0].id === orderId)
    assert(token.orders[0].lastPriceToken.id === ZERO_ADDRESS)
    assert(token.orders[0].nftOwner.id === publisher, 'invalid nftOwner')
  })
})
