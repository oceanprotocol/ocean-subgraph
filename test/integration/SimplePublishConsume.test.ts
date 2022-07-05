import {
  // Aquarius,
  // Datatoken,
  Erc20CreateParams,
  ProviderInstance,
  // ProviderFees,
  Nft,
  NftFactory,
  NftCreateData,
  getHash,
  sleep,
  PoolCreationParams
} from '@oceanprotocol/lib'
import { Addresses } from './utils'
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

const addresses: Addresses = data.development
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
  it('should publish a dataset (create NFT + ERC20)', async () => {
    const nft = new Nft(web3)
    // const datatoken = new Datatoken(web3)
    const Factory = new NftFactory(addresses.erc721FactoryAddress, web3)
    const accounts = await web3.eth.getAccounts()
    const publisherAccount = accounts[0]
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
    const datatokenAddress = result.events.TokenCreated.returnValues[0]

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
  })
  it('should publish and transfer an NFT', async () => {
    const nft = new Nft(web3)
    const Factory = new NftFactory(addresses.erc721FactoryAddress, web3)
    const accounts = await web3.eth.getAccounts()
    const publisherAccount = accounts[0]
    const newOwnerAccount = accounts[1].toLowerCase()

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

  it('Creates a pool and saves fields correctly', async () => {
    const accounts = await web3.eth.getAccounts()
    const factoryOwner = accounts[3]
    const nftData: NftCreateData = {
      name: '72120Bundle',
      symbol: '72Bundle',
      templateIndex: 1,
      tokenURI: 'https://oceanprotocol.com/nft/',
      transferable: true,
      owner: null
    }
    // CREATE A POOL
    // we prepare transaction parameters objects
    const poolParams: PoolCreationParams = {
      ssContract: addresses.sideStakingAddress,
      baseTokenAddress: addresses.daiAddress,
      baseTokenSender: addresses.erc721FactoryAddress,
      publisherAddress: factoryOwner,
      marketFeeCollector: factoryOwner,
      poolTemplateAddress: addresses.poolTemplateAddress,
      rate: '1',
      baseTokenDecimals: 18,
      vestingAmount: '10000',
      vestedBlocks: 2500000,
      initialBaseTokenLiquidity: '2000',
      swapFeeLiquidityProvider: '0.001',
      swapFeeMarketRunner: '0.001'
    }

    const ercParams = {
      templateIndex: 1,
      minter: factoryOwner,
      paymentCollector: accounts[4],
      mpFeeAddress: factoryOwner,
      feeToken: '0x00000',
      cap: '1000000',
      feeAmount: '0',
      name: 'ERC20B1',
      symbol: 'ERC20DT1Symbol'
    }

    const nftFactory = new NftFactory(
      addresses.erc721FactoryAddress,
      web3,
      8996
    )

    const txReceipt = await nftFactory.createNftErc20WithPool(
      factoryOwner,
      nftData,
      ercParams,
      poolParams
    )

    const erc20Token =
      txReceipt.events.TokenCreated.returnValues.newTokenAddress
    const poolAddress = txReceipt.events.NewPool.returnValues.poolAddress

    // user1 has no dt1
    console.log('erc20Token', erc20Token)
    console.log('poolAddress', poolAddress)
  })
})
