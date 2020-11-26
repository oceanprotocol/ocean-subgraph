import {
  BigDecimal,
  Address,
  BigInt,
  Bytes,
  dataSource,
  ethereum
} from '@graphprotocol/graph-ts'
import {
  Pool,
  User,
  PoolToken,
  PoolShare,
  TokenPrice,
  PoolTransaction,
  OceanPools, Datatoken, TokenBalance, TokenTransaction
} from '../types/schema'
import { BToken } from '../types/templates/Pool/BToken'
import { log } from '@graphprotocol/graph-ts'

export let ZERO_BD = BigDecimal.fromString('0')

let network = dataSource.network()

export let OCEAN: string = (network == 'mainnet')
  ? '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
  : '0x8967BCF84170c91B0d24D4302C2376283b0B3a07'

export function hexToDecimal(hexString: String, decimals: i32): BigDecimal {
  let bytes = Bytes.fromHexString(hexString.toString()).reverse() as Bytes
  let bi = BigInt.fromUnsignedBytes(bytes)
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return bi.divDecimal(scale)
}

export function bigIntToDecimal(amount: BigInt, decimals: i32): BigDecimal {
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return amount.toBigDecimal().div(scale)
}

export function tokenToDecimal(amount: BigDecimal, decimals: i32): BigDecimal {
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return amount.div(scale)
}

export function createPoolShareEntity(id: string, pool: string, user: string): void {
  let poolShare = new PoolShare(id)

  createUserEntity(user)

  poolShare.userAddress = user
  poolShare.poolId = pool
  poolShare.balance = ZERO_BD
  poolShare.save()
}

export function createPoolTokenEntity(id: string, pool: string, address: string): void {
  let datatoken = Datatoken.load(address)

  let poolToken = new PoolToken(id)
  poolToken.poolId = pool
  poolToken.tokenId = datatoken ? datatoken.id: ''
  poolToken.address = address
  poolToken.balance = ZERO_BD
  poolToken.denormWeight = ZERO_BD
  poolToken.save()
}

export function updatePoolLiquidity(id: string): void {
  let pool = Pool.load(id)
  let tokensList: Array<Bytes> = pool.tokensList

  if (!tokensList || pool.tokensCount.lt(BigInt.fromI32(2)) || !pool.publicSwap) return
  if (tokensList[0] != Address.fromString(OCEAN)) return

  // Find pool liquidity

  let hasPrice = false
  let hasOceanPrice = false
  let poolOcnLiquidity = ZERO_BD
  let poolDTLiquidity = ZERO_BD
  return

  let oceanPoolTokenId = id.concat('-').concat(OCEAN)
  let oceanPoolToken = PoolToken.load(oceanPoolTokenId)
  poolOcnLiquidity = oceanPoolToken.balance.div(oceanPoolToken.denormWeight).times(pool.totalWeight)
  let DT = tokensList[1].toHexString()
  let dtTokenPrice = TokenPrice.load(DT)
  if (dtTokenPrice !== null) {
    let poolTokenId = id.concat('-').concat(DT)
    let poolToken = PoolToken.load(poolTokenId)
    poolDTLiquidity = TokenPrice.price.times(poolToken.balance).div(poolToken.denormWeight).times(pool.totalWeight)
    hasPrice = true
  }

  // // Create or update token price
  //
  // if (hasPrice) {
  //   for (let i: i32 = 0; i < tokensList.length; i++) {
  //     let tokenPriceId = tokensList[i].toHexString()
  //     let tokenPrice = TokenPrice.load(tokenPriceId)
  //     if (tokenPrice == null) {
  //       tokenPrice = new TokenPrice(tokenPriceId)
  //       tokenPrice.poolTokenId = ''
  //       tokenPrice.poolLiquidity = ZERO_BD
  //     }
  //
  //     let poolTokenId = id.concat('-').concat(tokenPriceId)
  //     let poolToken = PoolToken.load(poolTokenId)
  //
  //     if (
  //       (tokenPrice.poolTokenId == poolTokenId || poolLiquidity.gt(tokenPrice.poolLiquidity)) &&
  //       (tokenPriceId != WETH.toString() || (pool.tokensCount.equals(BigInt.fromI32(2)) && hasUsdPrice))
  //     ) {
  //       tokenPrice.price = ZERO_BD
  //
  //       if (poolToken.balance.gt(ZERO_BD)) {
  //         tokenPrice.price = poolLiquidity.div(pool.totalWeight).times(poolToken.denormWeight).div(poolToken.balance)
  //       }
  //
  //       tokenPrice.symbol = poolToken.symbol
  //       tokenPrice.name = poolToken.name
  //       tokenPrice.decimals = poolToken.decimals
  //       tokenPrice.poolLiquidity = poolLiquidity
  //       tokenPrice.poolTokenId = poolTokenId
  //       tokenPrice.save()
  //     }
  //   }
  // }

  // Update pool liquidity

  let liquidity = ZERO_BD
  let denormWeight = ZERO_BD

  for (let i: i32 = 0; i < tokensList.length; i++) {
    let tokenPriceId = tokensList[i].toHexString()
    let tokenPrice = TokenPrice.load(tokenPriceId)
    if (tokenPrice !== null) {
      let poolTokenId = id.concat('-').concat(tokenPriceId)
      let poolToken = PoolToken.load(poolTokenId)
      if (poolToken.denormWeight.gt(denormWeight)) {
        denormWeight = poolToken.denormWeight
        liquidity = tokenPrice.price.times(poolToken.balance).div(poolToken.denormWeight).times(pool.totalWeight)
      }
    }
  }

  let factory = OceanPools.load('1')
  factory.totalLiquidity = factory.totalLiquidity.minus(pool.liquidity).plus(liquidity)
  factory.save()

  pool.liquidity = liquidity
  pool.save()
}

export function decrPoolCount(finalized: boolean): void {
  let factory = OceanPools.load('1')
  factory.poolCount -= 1
  if (finalized) factory.finalizedPoolCount -= 1
  factory.save()
}

export function savePoolTransaction(event: ethereum.Event, eventName: string): void {
  let tx = event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString())
  let userAddress = event.transaction.from.toHex()
  let transaction = PoolTransaction.load(tx)
  if (transaction == null) {
    transaction = new PoolTransaction(tx)
  }
  transaction.event = eventName
  transaction.poolAddress = event.address.toHex()
  transaction.userAddress = userAddress
  transaction.gasUsed = event.transaction.gasUsed.toBigDecimal()
  transaction.gasPrice = event.transaction.gasPrice.toBigDecimal()
  transaction.tx = event.transaction.hash
  transaction.timestamp = event.block.timestamp.toI32()
  transaction.block = event.block.number.toI32()
  transaction.save()

  createUserEntity(userAddress)
}

export function saveTokenTransaction(event: ethereum.Event, eventName: string): void {
  let tx = event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString())
  let userAddress = event.transaction.from.toHex()
  let transaction = TokenTransaction.load(tx)
  if (transaction == null) {
    transaction = new TokenTransaction(tx)
  }
  transaction.event = eventName
  transaction.datatokenAddress = event.address.toHex()
  transaction.userAddress = userAddress
  transaction.gasUsed = event.transaction.gasUsed.toBigDecimal()
  transaction.gasPrice = event.transaction.gasPrice.toBigDecimal()
  transaction.tx = event.transaction.hash
  transaction.timestamp = event.block.timestamp.toI32()
  transaction.block = event.block.number.toI32()
  transaction.save()

  createUserEntity(userAddress)
}

export function createUserEntity(address: string): void {
  if (User.load(address) == null) {
    let user = new User(address)
    user.save()
  }
}

export function createTokenBalanceEntity(id: string, token: string, user: string): void {
  if (TokenBalance.load(id) != null) return

  let tokenBalance = new TokenBalance(id)
  createUserEntity(user)
  tokenBalance.userAddress = user
  tokenBalance.datatokenId = token
  tokenBalance.balance = ZERO_BD
  tokenBalance.save()
}

export function updateDatatokenBalance(): void {

}