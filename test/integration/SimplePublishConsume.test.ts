import {
  Datatoken,
  Erc20CreateParams,
  ProviderInstance,
  ProviderFees,
  Nft,
  NftFactory,
  NftCreateData,
  getHash,
  sleep,
  ZERO_ADDRESS,
  signHash
} from '@oceanprotocol/lib'
import { assert } from 'chai'
import Web3 from 'web3'
import { SHA256 } from 'crypto-js'
import { homedir } from 'os'
import fs from 'fs'
import { fetch } from 'cross-fetch'
import { getOrderId } from '../../src/mappings/utils/orderUtils'

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

describe('Simple Publish & consume test', async () => {
  let datatokenAddress: string
  let datatoken: Datatoken
  let nft: Nft
  let Factory: NftFactory
  let accounts: string[]
  let publisherAccount: string
  let newOwnerAccount: string
  // let user1: string
  let user2: string
  let user3: string

  before(async () => {
    nft = new Nft(web3)
    Factory = new NftFactory(addresses.ERC721Factory, web3)
    accounts = await web3.eth.getAccounts()
    publisherAccount = accounts[0]
    newOwnerAccount = accounts[1].toLowerCase()
    //  user1 = accounts[2]
    user2 = accounts[3]
    user3 = accounts[4]
  })

  it('should publish a dataset (create NFT + ERC20)', async () => {
    // const consumerAccount = accounts[1]
    const nftParams: NftCreateData = {
      name: 'testNFT',
      symbol: 'TST',
      templateIndex: 1,
      tokenURI: '',
      transferable: true,
      owner: publisherAccount
    }
    const erc20Params: Erc20CreateParams = {
      templateIndex: 1,
      cap: '100000',
      feeAmount: '0',
      paymentCollector: '0x0000000000000000000000000000000000000000',
      feeToken: '0x0000000000000000000000000000000000000000',
      minter: publisherAccount,
      mpFeeAddress: '0x0000000000000000000000000000000000000000'
    }
    const result = await Factory.createNftWithErc20(
      publisherAccount,
      nftParams,
      erc20Params
    )
    const erc721Address = result.events.NFTCreated.returnValues[0]
    datatokenAddress = result.events.TokenCreated.returnValues[0]

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
      publisherAccount,
      0,
      providerUrl,
      '',
      '0x2',
      encryptedResponse,
      '0x' + metadataHash
    )
    // const resolvedDDO = await aquarius.waitForAqua(ddo.id)
    // assert(resolvedDDO, 'Cannot fetch DDO from Aquarius')

    // graph tests here
    await sleep(2000)
    const graphNftToken = erc721Address.toLowerCase()
    const query = {
      query: `query {
          nft(id:"${graphNftToken}"){symbol,id}}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    const queryResult = await response.json()
    assert(queryResult.data.nft.id === graphNftToken)

    /*

    // mint 1 ERC20 and send it to the consumer
    await datatoken.mint(datatokenAddress, publisherAccount, '1', consumerAccount)
    // initialize provider
    const initializeData = await ProviderInstance.initialize(
      resolvedDDO.id,
      resolvedDDO.services[0].id,
      0,
      consumerAccount,
      providerUrl
    )
    const providerFees: ProviderFees = {
      providerFeeAddress: initializeData.providerFee.providerFeeAddress,
      providerFeeToken: initializeData.providerFee.providerFeeToken,
      providerFeeAmount: initializeData.providerFee.providerFeeAmount,
      v: initializeData.providerFee.v,
      r: initializeData.providerFee.r,
      s: initializeData.providerFee.s,
      providerData: initializeData.providerFee.providerData,
      validUntil: initializeData.providerFee.validUntil
    }
    // make the payment
    const txid = await datatoken.startOrder(
      datatokenAddress,
      consumerAccount,
      consumerAccount,
      0,
      providerFees
    )
    // get the url
    const downloadURL = await ProviderInstance.getDownloadUrl(
      ddo.id,
      consumerAccount,
      ddo.services[0].id,
      0,
      txid.transactionHash,
      providerUrl,
      web3
    )
    assert(downloadURL, 'Provider getDownloadUrl failed')
    try {
      const fileData = await downloadFile(downloadURL)
    } catch (e) {
      assert.fail('Download failed')
    }
    */
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
    const erc20Params: Erc20CreateParams = {
      templateIndex: 1,
      cap: '100000',
      feeAmount: '0',
      paymentCollector: '0x0000000000000000000000000000000000000000',
      feeToken: '0x0000000000000000000000000000000000000000',
      minter: publisherAccount,
      mpFeeAddress: '0x0000000000000000000000000000000000000000'
    }
    const result = await Factory.createNftWithErc20(
      publisherAccount,
      nftParams,
      erc20Params
    )
    await sleep(2000)
    const erc721Address = result.events.NFTCreated.returnValues[0]
    const datatokenAddress = result.events.TokenCreated.returnValues[0]
    const graphNftToken = erc721Address.toLowerCase()

    const queryOriginalOwner = {
      query: `query {
          nft(id:"${graphNftToken}"){symbol,id,owner}}`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(queryOriginalOwner)
    })
    const initialResult = await initialResponse.json()
    // Checking original owner account has been set correctly
    assert(
      initialResult.data.nft.owner.toLowerCase() ===
        publisherAccount.toLowerCase()
    )

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
      publisherAccount,
      0,
      providerUrl,
      '',
      '0x2',
      encryptedResponse,
      '0x' + metadataHash
    )
    await sleep(2000)

    // Transfer the NFT
    await nft.transferNft(graphNftToken, publisherAccount, newOwnerAccount)
    await sleep(2000)
    const query2 = {
      query: `query {
          nft(id:"${graphNftToken}"){symbol,id,owner, transferable}}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query2)
    })
    const queryResult = await response.json()
    assert(queryResult.data.nft.owner === newOwnerAccount)
  })

  it('should save  provider fees after startOrder is called', async () => {
    datatoken = new Datatoken(web3, 8996)
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
    const orderTx = await datatoken.startOrder(
      datatokenAddress,
      publisherAccount,
      user2,
      1,
      setProviderFee
    )
    console.log('order', orderTx)
    const orderId = getOrderId(
      orderTx.transactionHash,
      datatokenAddress,
      publisherAccount
    )
    const query = {
      query: `query {
          order(id:"${orderId}"){id, providerFee}}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    const queryResult = await response.json()
    assert(queryResult.data.order.providerFee === setProviderFee)
  })

  it('should save provider fees after calling reuseOrder on a using a previous txId', async () => {
    const providerData = JSON.stringify({ timeout: 0 })
    const providerFeeToken = ZERO_ADDRESS
    let providerFeeAmount = '90'
    let providerValidUntil = '0'
    let message = web3.utils.soliditySha3(
      { t: 'bytes', v: web3.utils.toHex(web3.utils.asciiToHex(providerData)) },
      { t: 'address', v: user3 },
      { t: 'address', v: providerFeeToken },
      { t: 'uint256', v: providerFeeAmount },
      { t: 'uint256', v: providerValidUntil }
    )
    let { v, r, s } = await signHash(web3, message, user3)
    const setInitialProviderFee: ProviderFees = {
      providerFeeAddress: user3,
      providerFeeToken,
      providerFeeAmount,
      v,
      r,
      s,
      providerData: web3.utils.toHex(web3.utils.asciiToHex(providerData)),
      validUntil: providerValidUntil
    }
    const orderTx = await datatoken.startOrder(
      datatokenAddress,
      publisherAccount,
      user2,
      1,
      setInitialProviderFee
    )
    assert(orderTx.transactionHash, ' Failed to start order')

    // Check initial provider fee has been set correctly
    const orderId = getOrderId(
      orderTx.transactionHash,
      datatokenAddress,
      publisherAccount
    )
    const query = {
      query: `query {
        OrderReuse(id:"${orderId}"){id, providerFee}}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    const queryResult = await response.json()
    assert(
      queryResult.data.order.providerFee === setInitialProviderFee,
      'Initial provider fee was not correctly set'
    )

    providerFeeAmount = '90'
    providerValidUntil = '0'
    message = web3.utils.soliditySha3(
      { t: 'bytes', v: web3.utils.toHex(web3.utils.asciiToHex(providerData)) },
      { t: 'address', v: user3 },
      { t: 'address', v: providerFeeToken },
      { t: 'uint256', v: providerFeeAmount },
      { t: 'uint256', v: providerValidUntil }
    )
    const msgResult = await signHash(web3, message, user3)
    v = msgResult.v
    r = msgResult.r
    s = msgResult.s

    const setNewProviderFee: ProviderFees = {
      providerFeeAddress: user3,
      providerFeeToken,
      providerFeeAmount,
      v,
      r,
      s,
      providerData: web3.utils.toHex(web3.utils.asciiToHex(providerData)),
      validUntil: providerValidUntil
    }

    const reusedOrder = await datatoken.reuseOrder(
      datatokenAddress,
      user2,
      orderTx.transactionHash,
      setNewProviderFee
    )
    assert(reusedOrder.events.OrderReused.event === 'OrderReused')
    assert(reusedOrder.events.ProviderFee.event === 'ProviderFee')

    // Check the new provider fee has been set in OrderReuse
    const query2 = {
      query: `query {
        OrderReuse(id:"${reusedOrder.transactionHash}"){id, providerFee}}`
    }
    const response2 = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query2)
    })
    const queryResult2 = await response2.json()
    assert(
      queryResult2.data.order.providerFee === setNewProviderFee,
      'New provider fees have not been correctly set in OrderReuse'
    )
  })
})
