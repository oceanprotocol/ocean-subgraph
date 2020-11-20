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
  Transaction,
  OceanPools
} from '../types/schema'
import { BToken } from '../types/templates/Pool/BToken'
import { log } from '@graphprotocol/graph-ts'

export let ZERO_BD = BigDecimal.fromString('0')

let network = dataSource.network()

export let OCEAN: string = (network == 'mainnet')
  ? '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
  : '0x8967BCF84170c91B0d24D4302C2376283b0B3a07'

export function hexToDecimal(hexString: String, decimals: i32): BigDecimal {
  let bytes = Bytes.fromHexString(hexString).reverse() as Bytes
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
  let token = BToken.bind(Address.fromString(address))
  let symbol = ''
  let name = ''
  let decimals = 18

  // COMMENT THE LINES BELOW OUT FOR LOCAL DEV ON KOVAN
  let symbolCall = token.try_symbol()
  let nameCall = token.try_name()

  if (!symbolCall.reverted) {
    symbol = symbolCall.value
  }

  if (!nameCall.reverted) {
    name = nameCall.value
  }

  // COMMENT THE LINES ABOVE OUT FOR LOCAL DEV ON KOVAN

  // !!! COMMENT THE LINES BELOW OUT FOR NON-LOCAL DEPLOYMENT
  // This code allows Symbols to be added when testing on local Kovan
  /*
  if(address == '0xd0a1e359811322d97991e03f863a0c30c2cf029c')
    symbol = 'WETH';
  else if(address == '0x1528f3fcc26d13f7079325fb78d9442607781c8c')
    symbol = 'DAI'
  else if(address == '0xef13c0c8abcaf5767160018d268f9697ae4f5375')
    symbol = 'MKR'
  else if(address == '0x2f375e94fc336cdec2dc0ccb5277fe59cbf1cae5')
    symbol = 'USDC'
  else if(address == '0x1f1f156e0317167c11aa412e3d1435ea29dc3cce')
    symbol = 'BAT'
  else if(address == '0x86436bce20258a6dcfe48c9512d4d49a30c4d8c4')
    symbol = 'SNX'
  else if(address == '0x8c9e6c40d3402480ace624730524facc5482798c')
    symbol = 'REP'
  */
  // !!! COMMENT THE LINES ABOVE OUT FOR NON-LOCAL DEPLOYMENT

  let poolToken = new PoolToken(id)
  poolToken.poolId = pool
  poolToken.address = address
  poolToken.name = name
  poolToken.symbol = symbol
  poolToken.decimals = decimals
  poolToken.balance = ZERO_BD
  poolToken.denormWeight = ZERO_BD
  poolToken.save()
}

export function updatePoolLiquidity(id: string): void {
  let pool = Pool.load(id)
  let tokensList: Array<Bytes> = pool.tokensList

  if (!tokensList || pool.tokensCount.lt(BigInt.fromI32(2)) || !pool.publicSwap) return

  // Find pool liquidity

  let hasPrice = false
  let hasOceanPrice = false
  let poolLiquidity = ZERO_BD

  // if (tokensList.includes(Address.fromString(OCEAN))) {
  //   let oceanPoolTokenId = id.concat('-').concat(OCEAN)
  //   let oceanPoolToken = PoolToken.load(oceanPoolTokenId)
  //   poolLiquidity = oceanPoolToken.balance.div(oceanPoolToken.denormWeight).times(pool.totalWeight)
  //   hasPrice = true
  //   hasOceanPrice = true
  // } else {
  //   let DT = tokensList[1].toHexString()
  //   let dtTokenPrice = TokenPrice.load(DT)
  //   if (dtTokenPrice !== null) {
  //     let poolTokenId = id.concat('-').concat(DT)
  //     let poolToken = PoolToken.load(poolTokenId)
  //     poolLiquidity = wethTokenPrice.price.times(poolToken.balance).div(poolToken.denormWeight).times(pool.totalWeight)
  //     hasPrice = true
  //   }
  // }
  //
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

export function saveTransaction(event: ethereum.Event, eventName: string): void {
  let tx = event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString())
  let userAddress = event.transaction.from.toHex()
  let transaction = Transaction.load(tx)
  if (transaction == null) {
    transaction = new Transaction(tx)
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

export function createUserEntity(address: string): void {
  if (User.load(address) == null) {
    let user = new User(address)
    user.save()
  }
}
