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
  signHash,
  PoolCreationParams,
  approve
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

describe('Simple Publish & consume test', async () => {
  let datatokenAddress: string
  let datatoken: Datatoken
  let nft: Nft
  let Factory: NftFactory
  let accounts: string[]
  let publisherAccount: string
  let newOwnerAccount: string
  let user1: string
  let user2: string
  let user3: string
  let user4: string

  before(async () => {
    nft = new Nft(web3)
    Factory = new NftFactory(addresses.ERC721Factory, web3)
    accounts = await web3.eth.getAccounts()
    publisherAccount = accounts[0]
    newOwnerAccount = accounts[1].toLowerCase()
    user1 = accounts[2]
    user2 = accounts[3]
    user3 = accounts[4]
    user4 = accounts[4]
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
    await datatoken.mint(datatokenAddress, publisherAccount, '100', user1)
    const user1Balance = await datatoken.balance(datatokenAddress, user1)
    assert(user1Balance === '100', 'user1 has no datatokens')

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
      user1,
      user2,
      1,
      setProviderFee
    )
    const orderId = `${orderTx.transactionHash.toLocaleLowerCase()}-${datatokenAddress.toLocaleLowerCase()}-${user1.toLocaleLowerCase()}`

    const query = { query: `query {order(id:"${orderId}"){id, providerFee}}` }

    await sleep(2000)
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(query)
    })

    const queryResult = await response.json()

    const providerFeeJSON = JSON.parse(queryResult.data.order.providerFee)

    assert(
      providerFeeJSON.providerFeeAddress.toLowerCase() ===
        setProviderFee.providerFeeAddress.toLowerCase(),
      'Wrong providerFeeAddress set'
    )
    assert(
      providerFeeJSON.providerFeeAmount.toLowerCase() ===
        setProviderFee.providerFeeAmount.toLowerCase(),
      'Wrong providerFeeAmount set'
    )
    assert(
      providerFeeJSON.providerFeeToken.toLowerCase() ===
        setProviderFee.providerFeeToken.toLowerCase(),
      'Wrong providerFeeToken set'
    )
  })

  it('should save provider fees after calling reuseOrder on a using a previous txId', async () => {
    await datatoken.mint(datatokenAddress, publisherAccount, '100', user4)
    const user4Balance = await datatoken.balance(datatokenAddress, user4)
    assert(user4Balance === '100', 'publisherAccount has no datatokens')

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
      user4,
      user2,
      1,
      setInitialProviderFee
    )
    assert(orderTx.transactionHash, 'Failed to start order')

    // Check initial provider fee has been set correctly
    const orderId = `${orderTx.transactionHash.toLowerCase()}-${datatokenAddress.toLowerCase()}-${user4.toLowerCase()}`

    const initialQuery = {
      query: `query {order(id:"${orderId}"){id, providerFee}}`
    }
    await sleep(2000)
    const initialResponse = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(initialQuery)
    })
    const initialQueryResult = await initialResponse.json()
    const initialProviderFeeJSON = JSON.parse(
      initialQueryResult.data.order.providerFee
    )

    assert(
      initialProviderFeeJSON.providerFeeAddress.toLowerCase() ===
        setInitialProviderFee.providerFeeAddress.toLowerCase(),
      'Wrong initial providerFeeAddress set'
    )
    assert(
      initialProviderFeeJSON.providerFeeAmount.toLowerCase() ===
        setInitialProviderFee.providerFeeAmount.toLowerCase(),
      'Wrong initial providerFeeAmount set'
    )
    assert(
      initialProviderFeeJSON.providerFeeToken.toLowerCase() ===
        setInitialProviderFee.providerFeeToken.toLowerCase(),
      'Wrong initial providerFeeToken set'
    )

    providerFeeAmount = '990000'
    providerValidUntil = '10000'
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

    sleep(4000)
    // Check the new provider fee has been set in OrderReuse

    const reuseQuery = {
      query: `query {orderReuse(id:"${reusedOrder.transactionHash}"){id, providerFee}}`
    }

    await sleep(2000)
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(reuseQuery)
    })

    const reuseQueryResult = await response.json()

    const reuseProviderFeeJSON = JSON.parse(
      reuseQueryResult.data.orderReuse.providerFee
    )

    assert(
      reuseProviderFeeJSON.providerFeeAddress.toLowerCase() ===
        setNewProviderFee.providerFeeAddress.toLowerCase(),
      'New providerFeeAddress set in reuse order is wrong'
    )
    assert(
      reuseProviderFeeJSON.providerFeeAmount.toLowerCase() ===
        setNewProviderFee.providerFeeAmount.toLowerCase(),
      'New providerFeeAmount set in reuse order is wrong'
    )
    assert(
      reuseProviderFeeJSON.providerFeeToken.toLowerCase() ===
        setNewProviderFee.providerFeeToken.toLowerCase(),
      'New providerFeeToken set in reuse order is wrong'
    )
  })

  it('Creates a pool and saves fields correctly', async () => {
    datatoken = new Datatoken(web3, 8996)
    await datatoken.mint(datatokenAddress, publisherAccount, '100')

    const collector = accounts[4].toLowerCase()

    const nftData: NftCreateData = {
      name: '72120Bundle',
      symbol: '72Bundle',
      templateIndex: 1,
      tokenURI: 'https://oceanprotocol.com/nft/',
      transferable: true,
      owner: publisherAccount
    }

    // CREATE A POOL
    // we prepare transaction parameters objects
    const poolLiquidity = '2000'

    const poolParams: PoolCreationParams = {
      ssContract: addresses.Staking,
      baseTokenAddress: addresses.MockDAI,
      baseTokenSender: addresses.ERC721Factory,
      publisherAddress: publisherAccount,
      marketFeeCollector: publisherAccount,
      poolTemplateAddress: addresses.poolTemplate,
      rate: '1',
      baseTokenDecimals: 18,
      vestingAmount: '10000',
      vestedBlocks: 2500000,
      initialBaseTokenLiquidity: poolLiquidity,
      swapFeeLiquidityProvider: '0.001',
      swapFeeMarketRunner: '0.001'
    }
    const ecr20Symbol = 'ERC20DT1Symbol'
    const erc20Name = 'ERC20B1'
    const erc20Cap = '1000000'

    const ercParams = {
      templateIndex: 1,
      minter: publisherAccount,
      paymentCollector: collector,
      mpFeeAddress: publisherAccount,
      feeToken: addresses.MockDAI,
      cap: erc20Cap,
      feeAmount: '0',
      name: erc20Name,
      symbol: ecr20Symbol
    }

    await approve(
      web3,
      publisherAccount,
      addresses.MockDAI,
      addresses.ERC721Factory,
      poolLiquidity
    )

    const txReceipt = await Factory.createNftErc20WithPool(
      publisherAccount,
      nftData,
      ercParams,
      poolParams
    )

    const poolAddress = txReceipt.events.NewPool.returnValues.poolAddress
    const erc20Token =
      txReceipt.events.TokenCreated.returnValues.newTokenAddress
    const tx = txReceipt.transactionHash.toLowerCase()
    const txBlock = txReceipt.blockNumber

    const poolQuery = {
      query: `query {pool(id:"${poolAddress.toLocaleLowerCase()}"){
        id,
        controller,
        isFinalized,
        symbol,
        name,
        cap,
        baseToken{id},
        baseTokenLiquidity,
        baseTokenWeight,
        datatoken{id},
        datatokenLiquidity,
        datatokenWeight,
        publishMarketSwapFee,
        publishMarketSwapFeeAmount,
        liquidityProviderSwapFee,
        liquidityProviderSwapFeeAmount,
        totalShares,
        totalSwapVolume,
        spotPrice,
        joinCount,
        exitCount,
        swapCount,
        transactionCount,
        createdTimestamp,
        tx,
        block,
        shares{id},
        transactions{id},
        publishMarketFeeAddress }}`
    }

    await sleep(2000)
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      body: JSON.stringify(poolQuery)
    })
    await sleep(2000)

    const poolData = (await response.json()).data.pool
    console.log('poolData', poolData)

    // assert(poolData.controller === controller, 'controller is null')
    assert(poolData.isFinalized === true, 'isFinalized is false')
    assert(poolData.symbol === ecr20Symbol, 'invalid symbol')
    assert(poolData.name === erc20Name, 'invalid name')
    assert(poolData.cap === erc20Cap, 'invalid cap')
    assert(
      poolData.baseToken.id === addresses.MockDAI.toLowerCase(),
      'invalid baseToken'
    )
    assert(poolData.baseTokenLiquidity, 'baseTokenLiquidity is null')
    assert(poolData.baseTokenWeight, 'baseTokenWeight is null')
    assert(
      poolData.datatoken.id === erc20Token.toLowerCase(),
      'invalid datatoken'
    )
    assert(
      poolData.datatokenLiquidity === poolLiquidity,
      'invalid datatokenLiquidity'
    )
    assert(poolData.datatokenWeight, 'datatokenWeight is null')
    assert(poolData.publishMarketSwapFee, 'publishMarketSwapFee is null')
    assert(
      poolData.publishMarketSwapFeeAmount,
      'publishMarketSwapFeeAmount is null'
    )
    assert(
      poolData.liquidityProviderSwapFee,
      'liquidityProviderSwapFee is null'
    )
    assert(
      poolData.liquidityProviderSwapFeeAmount,
      'liquidityProviderSwapFeeAmount is null'
    )
    assert(poolData.totalShares, 'totalShares is null')
    assert(poolData.totalSwapVolume !== null, 'totalSwapVolume is null')
    assert(poolData.spotPrice, 'spotPrice is null')
    assert(poolData.exitCount, 'exitCount is null')
    assert(poolData.swapCount, 'swapCount is null')
    assert(poolData.transactionCount, 'transactionCount is null')
    assert(poolData.createdTimestamp !== null, 'createdTimestamp is null')
    assert(poolData.tx === tx, 'invalid tx')
    assert(poolData.block === txBlock, 'invalid block')
    assert(poolData.shares, 'shares is null')
    assert(poolData.transactions, 'transactions are null')
    assert(poolData.publishMarketFeeAddress, 'publishMarketFeeAddress is null')
  })
})
