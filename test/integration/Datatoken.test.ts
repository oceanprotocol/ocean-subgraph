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
  let datatokenAddress: string
  let nft: Nft
  let Factory: NftFactory
  let accounts: string[]
  let publisherAccount: string
  let erc721Address: string
  let nftAddress: string

  before(async () => {
    nft = new Nft(web3)
    Factory = new NftFactory(addresses.ERC721Factory, web3)
    accounts = await web3.eth.getAccounts()
    publisherAccount = accounts[0]
  })

  it('should publish a datatoken', async () => {
    const nftName = 'testNFT'
    const nftSymbol = 'TST'

    const nftParams: NftCreateData = {
      name: nftName,
      symbol: nftSymbol,
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
    erc721Address = result.events.NFTCreated.returnValues[0]
    datatokenAddress = result.events.TokenCreated.returnValues[0]

    // Check values before updating metadata
    await sleep(2000)
    nftAddress = erc721Address.toLowerCase()
    const initialQuery = {
      query: `query {
              nft(id:"${nftAddress}"){name,symbol,id}}`
    }
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    const initialNFT = (await initialResponse.json()).data.nft
    console.log('initialResult', initialNFT)
    assert(initialNFT.id === nftAddress)
    assert(initialNFT.symbol === nftSymbol)
    assert(initialNFT.name === nftName)

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

    // graph tests here
    await sleep(2000)
    const query = {
      query: `query {
          nft(id:"${nftAddress}"){symbol,id}}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    const queryResult = await response.json()
    assert(queryResult.data.nft.id === nftAddress)
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
      publisherAccount,
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
          nft(id:"${nftAddress}"){symbol,id}}`
    }
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })
    const queryResult = await response.json()
    assert(queryResult.data.nft.id === nftAddress)
  })
})
