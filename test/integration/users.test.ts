import {
  DatatokenCreateParams,
  NftFactory,
  NftCreateData,
  sleep,
  FreCreationParams,
  ZERO_ADDRESS,
  FixedRateExchange,
  Datatoken,
  ProviderFees,
  signHash
} from '@oceanprotocol/lib'
import MockERC20 from '@oceanprotocol/contracts/artifacts/contracts/utils/mock/MockERC20Decimals.sol/MockERC20Decimals.json'
import { assert } from 'chai'
import Web3 from 'web3'
import { homedir } from 'os'
import fs from 'fs'
import { fetch } from 'cross-fetch'
import { AbiItem } from 'web3-utils/types'

const sleepMs = 1700

const data = JSON.parse(
  fs.readFileSync(
    process.env.ADDRESS_FILE ||
      `${homedir}/.ocean/ocean-contracts/artifacts/address.json`,
    'utf8'
  )
)
async function userQuery(user: string) {
  const query = {
    query: `query {
              user(id:"${user}"){    
                  id
                  tokenBalancesOwned {id}
                  orders {id, lastPriceToken{id}}
                  freSwaps {id}
                  totalOrders
                  totalSales
                  __typename
              }}`
  }
  const response = await fetch(
    'http://127.0.0.1:9000/subgraphs/name/oceanprotocol/ocean-subgraph',
    {
      method: 'POST',
      body: JSON.stringify(query)
    }
  )
  const data = (await response.json()).data.user
  return data
}

const addresses = data.development
const web3 = new Web3('http://127.0.0.1:8545')

describe('User tests', async () => {
  const nftName = 'test-Fixed-Price-NFT'
  const nftSymbol = 'TST-FIXED'
  const tokenURI = 'https://oceanprotocol.com/nft/fixed'
  const cap = '10000'
  const feeAmount = '0.2'
  const price = '3'
  const publishMarketSwapFee = '0.003'
  const templateIndex = 1
  const dtAmount = '10'
  const datatoken = new Datatoken(web3, 8996)
  let datatokenAddress: string
  let fixedRateAddress: string
  let baseTokenAddress: string
  let feeAddress: string
  let Factory: NftFactory
  let factoryAddress: string
  let accounts: string[]
  let contractDeployer: string
  let publisher: string
  let exchangeId: string
  let fixedRate: FixedRateExchange
  let user1: string
  let user2: string
  let user3: string

  before(async () => {
    factoryAddress = addresses.ERC721Factory.toLowerCase()
    fixedRateAddress = addresses.FixedPrice.toLowerCase()
    baseTokenAddress = addresses.MockDAI.toLowerCase()
    Factory = new NftFactory(factoryAddress, web3)
    accounts = await web3.eth.getAccounts()
    contractDeployer = accounts[0].toLowerCase()
    feeAddress = accounts[1].toLowerCase()
    // Using different accounts from other tests to ensure that all user fields start at null
    publisher = accounts[6].toLowerCase()
    user1 = accounts[7].toLowerCase()
    user2 = accounts[8].toLowerCase()
    user3 = accounts[9].toLowerCase()
  })

  it('Deploying a Fixed Rate Exchange & Test User Fields', async () => {
    const nftParams: NftCreateData = {
      name: nftName,
      symbol: nftSymbol,
      templateIndex: 1,
      tokenURI,
      transferable: true,
      owner: publisher
    }
    const erc20Params: DatatokenCreateParams = {
      templateIndex,
      cap,
      feeAmount,
      paymentCollector: ZERO_ADDRESS,
      feeToken: ZERO_ADDRESS,
      minter: publisher,
      mpFeeAddress: feeAddress
    }
    const fixedRateParams: FreCreationParams = {
      fixedRateAddress,
      baseTokenAddress,
      owner: publisher,
      marketFeeCollector: feeAddress,
      baseTokenDecimals: 18,
      datatokenDecimals: 18,
      fixedRate: price,
      marketFee: publishMarketSwapFee,
      allowedConsumer: ZERO_ADDRESS,
      withMint: false
    }

    const result = await Factory.createNftWithDatatokenWithFixedRate(
      publisher,
      nftParams,
      erc20Params,
      fixedRateParams
    )
    datatokenAddress = result.events.TokenCreated.returnValues[0].toLowerCase()

    exchangeId =
      result.events.NewFixedRate.returnValues.exchangeId.toLowerCase()

    // Check User values
    await sleep(sleepMs)
    const user = await userQuery(publisher)

    assert(user.id === publisher, 'incorrect value for: id')
    assert(user.tokenBalancesOwned.length === 0, 'incorrect tokenBalancesOwned')
    assert(user.orders.length === 0, 'incorrect value for: orders')
    assert(user.freSwaps.length === 0, 'incorrect value for: freSwaps')
    assert(user.totalOrders === '0', 'incorrect value for: totalOrders')
    assert(user.totalSales === '0', 'incorrect value for: totalSales')
    assert(user.__typename === 'User', 'incorrect value for: __typename')
  })

  it('User1 buys a datatoken', async () => {
    const datatoken = new Datatoken(web3, 8996)
    // Mint datatokens as initial supply is 0
    await datatoken.mint(datatokenAddress, publisher, '100')
    await datatoken.approve(
      datatokenAddress,
      fixedRateAddress,
      '100',
      publisher
    )

    const daiContract = new web3.eth.Contract(
      MockERC20.abi as AbiItem[],
      addresses.MockDAI
    )
    // user1 need DAI so that they can buy the datatoken
    await daiContract.methods
      .transfer(user1, web3.utils.toWei('100'))
      .send({ from: contractDeployer })
    await daiContract.methods
      .approve(fixedRateAddress, web3.utils.toWei('10000000'))
      .send({ from: user1 })

    // user1 has no DTs before buying one
    let user1Balance = await datatoken.balance(datatokenAddress, user1)
    assert(user1Balance === '0', 'incorrect value for: user1Balance')

    fixedRate = new FixedRateExchange(fixedRateAddress, web3, 8996)
    await fixedRate.buyDatatokens(user1, exchangeId, dtAmount, '100')
    await sleep(sleepMs)

    user1Balance = await datatoken.balance(datatokenAddress, user1)
    // user1 has 1 datatoken
    assert(user1Balance === dtAmount, 'incorrect value for: user1Balance')

    // Check User values
    const user = await userQuery(user1)

    assert(user.id === user1, 'incorrect value for: id')
    assert(user.tokenBalancesOwned.length === 0, 'incorrect tokenBalancesOwned')
    assert(user.orders.length === 0, 'incorrect value for: orders')
    assert(user.freSwaps.length === 1, 'incorrect value for: freSwaps')
    assert(user.totalOrders === '0', 'incorrect value for: totalOrders')
    assert(user.totalSales === '0', 'incorrect value for: totalSales')
    assert(user.__typename === 'User', 'incorrect value for: __typename')
  })
  it('User1 sells a datatoken', async () => {
    const initialUser = await userQuery(user1)
    await datatoken.approve(datatokenAddress, fixedRateAddress, dtAmount, user1)
    const tx = (await fixedRate.sellDatatokens(user1, exchangeId, '10', '9'))
      .events?.Swapped

    assert(tx != null)
    const user = await userQuery(user1)

    assert(user.id === user1, 'incorrect value for: id')
    assert(user.tokenBalancesOwned.length === 0, 'incorrect tokenBalancesOwned')
    assert(user.orders.length === 0, 'incorrect value for: orders')
    assert(
      user.freSwaps.length === initialUser.freSwaps.length,
      'incorrect value for: freSwaps'
    )
    assert(user.totalOrders === '0', 'incorrect value for: totalOrders')
    assert(user.totalSales === '0', 'incorrect value for: totalSales')
    assert(user.__typename === 'User', 'incorrect value for: __typename')
  })

  it('Check user fields after publishing & ordering a datatoken', async () => {
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
      mpFeeAddress: feeAddress
    }
    const result = await Factory.createNftWithDatatoken(
      publisher,
      nftParams,
      erc20Params
    )
    const newDtAddress = result.events.TokenCreated.returnValues[0]

    const datatoken = new Datatoken(web3, 8996)
    await datatoken.mint(newDtAddress, publisher, '100', user3)
    const user1balance = await datatoken.balance(newDtAddress, user3)
    assert(Number(user1balance) === 100, 'Invalid user1 balance')

    const providerData = JSON.stringify({ timeout: 0 })
    const providerFeeToken = ZERO_ADDRESS
    const providerFeeAmount = '10000'
    const providerValidUntil = '0'
    const message = web3.utils.soliditySha3(
      { t: 'bytes', v: web3.utils.toHex(web3.utils.asciiToHex(providerData)) },
      { t: 'address', v: feeAddress },
      { t: 'address', v: providerFeeToken },
      { t: 'uint256', v: providerFeeAmount },
      { t: 'uint256', v: providerValidUntil }
    )
    assert(message, 'Invalid message')
    const { v, r, s } = await signHash(web3, message, feeAddress)
    const setProviderFee: ProviderFees = {
      providerFeeAddress: feeAddress,
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
      user3,
      user2,
      1,
      setProviderFee
    )
    assert(orderTx.events.OrderStarted, 'Invalid orderTx')

    await sleep(2000)

    const user = await userQuery(user3)
    assert(user.id === user3, 'incorrect value for: id')
    assert(user.tokenBalancesOwned.length === 0, 'incorrect tokenBalancesOwned')
    assert(user.orders.length === 1, 'incorrect value for: orders')
    assert(user.freSwaps.length === 0, 'incorrect value for: freSwaps')
    assert(user.totalOrders === '1', 'incorrect value for: totalOrders')
    assert(user.totalSales === '0', 'incorrect value for: totalSales')
    assert(user.__typename === 'User', 'incorrect value for: __typename')
    assert(
      user.orders[0].lastPriceToken.id === ZERO_ADDRESS,
      'incorrect value for: lastPriceToken'
    )
  })
})
