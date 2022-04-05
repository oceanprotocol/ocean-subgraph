import { BigInt, Address } from '@graphprotocol/graph-ts'
import {
  LOG_EXIT,
  LOG_JOIN,
  LOG_SETUP,
  LOG_SWAP,
  PublishMarketFeeChanged,
  SwapFeeChanged
} from '../@types/templates/BPool/BPool'
import { Transfer } from '../@types/templates/BPool/BToken'
import {
  decimal,
  integer,
  PoolTransactionType,
  ZERO_ADDRESS
} from './utils/constants'
import { weiToDecimal } from './utils/generic'
import {
  addLiquidity,
  addPoolSwap,
  getGlobalStats,
  removeLiquidity
} from './utils/globalUtils'
import {
  calcSpotPrice,
  getPool,
  getPoolTransaction,
  getPoolShare,
  getPoolSnapshot,
  getPoolLpSwapFee,
  getPoolPublisherMarketFee
} from './utils/poolUtils'
import { getToken } from './utils/tokenUtils'
import { getUser } from './utils/userUtils'

// kinda redundant code in join/swap/exit
export function handleJoin(event: LOG_JOIN): void {
  const pool = getPool(event.address.toHex())
  const user = getUser(event.params.caller.toHex())
  const poolTx = getPoolTransaction(event, user.id, PoolTransactionType.JOIN)

  pool.transactionCount = pool.transactionCount.plus(integer.ONE)
  pool.joinCount = pool.joinCount.plus(integer.ONE)

  // get token,  update pool transaction, poolSnapshot

  const token = getToken(event.params.tokenIn, false)
  const ammount = weiToDecimal(
    event.params.tokenAmountIn.toBigDecimal(),
    token.decimals
  )
  if (token.isDatatoken) {
    poolTx.datatoken = token.id
    poolTx.datatokenValue = ammount

    pool.datatokenLiquidity = pool.datatokenLiquidity.plus(ammount)
  } else {
    poolTx.baseToken = token.id
    poolTx.baseTokenValue = ammount
    pool.baseTokenLiquidity = pool.baseTokenLiquidity.plus(ammount)

    addLiquidity(token.id, ammount)
  }

  poolTx.save()
  pool.save()

  if (pool.isFinalized) {
    const poolSnapshot = getPoolSnapshot(pool.id, event.block.timestamp.toI32())
    poolSnapshot.baseTokenLiquidity = pool.baseTokenLiquidity
    poolSnapshot.datatokenLiquidity = pool.datatokenLiquidity
    poolSnapshot.totalShares = pool.totalShares
    poolSnapshot.save()
  }
}

export function handleExit(event: LOG_EXIT): void {
  const pool = getPool(event.address.toHex())
  const user = getUser(event.params.caller.toHex())
  const poolTx = getPoolTransaction(event, user.id, PoolTransactionType.EXIT)

  pool.transactionCount = pool.transactionCount.plus(integer.ONE)
  pool.joinCount = pool.joinCount.plus(integer.ONE)

  // get token and update pool transaction, value is negative because this is an exit event.
  const token = getToken(event.params.tokenOut, false)
  const poolSnapshot = getPoolSnapshot(pool.id, event.block.timestamp.toI32())
  const ammount = weiToDecimal(
    event.params.tokenAmountOut.toBigDecimal(),
    token.decimals
  )
  if (token.isDatatoken) {
    poolTx.datatoken = token.id
    poolTx.datatokenValue = ammount

    pool.datatokenLiquidity = pool.datatokenLiquidity.minus(ammount)
  } else {
    poolTx.baseToken = token.id
    poolTx.baseTokenValue = ammount

    pool.baseTokenLiquidity = pool.baseTokenLiquidity.minus(ammount)
    removeLiquidity(token.id, ammount)
  }

  poolSnapshot.baseTokenLiquidity = pool.baseTokenLiquidity
  poolSnapshot.datatokenLiquidity = pool.datatokenLiquidity
  poolSnapshot.totalShares = pool.totalShares

  poolSnapshot.save()
  poolTx.save()
  pool.save()
}

export function handleSwap(event: LOG_SWAP): void {
  const pool = getPool(event.address.toHex())
  const user = getUser(event.params.caller.toHex())
  const poolTx = getPoolTransaction(event, user.id, PoolTransactionType.SWAP)

  pool.transactionCount = pool.transactionCount.plus(integer.ONE)
  pool.joinCount = pool.joinCount.plus(integer.ONE)

  const poolSnapshot = getPoolSnapshot(pool.id, event.block.timestamp.toI32())
  const tokenOut = getToken(event.params.tokenOut, false)
  const tokenIn = getToken(event.params.tokenIn, false)
  let spotPrice = decimal.ZERO

  const ammountOut = weiToDecimal(
    event.params.tokenAmountOut.toBigDecimal(),
    tokenOut.decimals
  )
  const tokenOutNewBalance = weiToDecimal(
    event.params.outBalance.toBigDecimal(),
    tokenOut.decimals
  )
  const tokenInNewBalance = weiToDecimal(
    event.params.inBalance.toBigDecimal(),
    tokenIn.decimals
  )

  if (tokenOut.isDatatoken) {
    poolTx.datatoken = tokenOut.id
    poolTx.datatokenValue = ammountOut.neg()

    pool.datatokenLiquidity = tokenOutNewBalance
  } else {
    poolTx.baseToken = tokenOut.id
    poolTx.baseTokenValue = ammountOut.neg()

    spotPrice = weiToDecimal(
      event.params.newSpotPrice.toBigDecimal(),
      tokenOut.decimals
    )

    pool.baseTokenLiquidity = tokenOutNewBalance
    poolSnapshot.swapVolume = poolSnapshot.swapVolume.plus(ammountOut)

    addPoolSwap(tokenOut.id, ammountOut)
    removeLiquidity(tokenOut.id, ammountOut)
  }

  // update pool token in
  const ammountIn = weiToDecimal(
    event.params.tokenAmountIn.toBigDecimal(),
    tokenIn.decimals
  )
  if (tokenIn.isDatatoken) {
    poolTx.datatoken = tokenIn.id
    poolTx.datatokenValue = ammountIn

    pool.datatokenLiquidity = tokenInNewBalance
  } else {
    poolTx.baseToken = tokenIn.id
    poolTx.baseTokenValue = ammountIn

    spotPrice = decimal.ONE.div(
      weiToDecimal(event.params.newSpotPrice.toBigDecimal(), tokenOut.decimals)
    )
    pool.baseTokenLiquidity = tokenInNewBalance
    poolSnapshot.swapVolume = poolSnapshot.swapVolume.plus(ammountIn)
    addLiquidity(tokenIn.id, ammountIn)
    addPoolSwap(tokenIn.id, ammountIn)
  }

  // update spot price
  pool.spotPrice = spotPrice
  poolSnapshot.spotPrice = spotPrice
  poolSnapshot.baseTokenLiquidity = pool.baseTokenLiquidity
  poolSnapshot.datatokenLiquidity = pool.datatokenLiquidity
  poolSnapshot.totalShares = pool.totalShares

  poolSnapshot.save()
  poolTx.save()
  pool.save()

  // update datatoken lastPriceToken and lastPriceValue
  const datatoken = getToken(Address.fromString(pool.datatoken), true)
  datatoken.lastPriceToken = pool.baseToken
  datatoken.lastPriceValue = spotPrice
  datatoken.save()
}

// setup is just to set token weight(it will mostly be 50:50) and spotPrice
export function handleSetup(event: LOG_SETUP): void {
  const pool = getPool(event.address.toHex())

  pool.controller = event.params.caller.toHexString()
  const token = getToken(event.params.baseToken, false)
  pool.baseToken = token.id
  pool.baseTokenWeight = weiToDecimal(
    event.params.baseTokenWeight.toBigDecimal(),
    token.decimals
  )

  // decimals hardcoded because datatokens have 18 decimals
  const datatoken = getToken(event.params.datatoken, true)
  pool.datatoken = datatoken.id
  pool.datatokenWeight = weiToDecimal(
    event.params.datatokenWeight.toBigDecimal(),
    18
  )

  // calculate spotPrice
  const spotPrice = calcSpotPrice(
    pool.id,
    pool.baseToken,
    pool.datatoken,
    token.decimals
  )
  pool.spotPrice = spotPrice
  pool.isFinalized = true
  // TODO: proper tx , add baseToken, datatoken
  const fromUser = getUser(event.transaction.from.toHexString())
  const poolTx = getPoolTransaction(
    event,
    fromUser.id,
    PoolTransactionType.SETUP
  )
  poolTx.type = PoolTransactionType.SETUP
  poolTx.baseToken = token.id
  poolTx.baseTokenValue = weiToDecimal(
    event.params.baseTokenAmountIn.toBigDecimal(),
    token.decimals
  )
  pool.save()
  poolTx.save()

  const lpFee = getPoolLpSwapFee(event.address)
  pool.liquidityProviderSwapFee = lpFee
  const publisherMarketFee = getPoolPublisherMarketFee(event.address)
  pool.publishMarketSwapFee = publisherMarketFee

  pool.save()
  const poolSnapshot = getPoolSnapshot(pool.id, event.block.timestamp.toI32())
  poolSnapshot.spotPrice = spotPrice
  poolSnapshot.baseTokenLiquidity = pool.baseTokenLiquidity
  poolSnapshot.datatokenLiquidity = pool.datatokenLiquidity
  poolSnapshot.totalShares = pool.totalShares

  poolSnapshot.save()
  const globalStats = getGlobalStats()
  globalStats.poolCount = globalStats.poolCount + 1
  globalStats.save()
  datatoken.save()
}

export function handlerBptTransfer(event: Transfer): void {
  const fromAddress = event.params.src.toHexString()
  const toAddress = event.params.dst.toHexString()
  const poolAddress = event.address.toHex()
  const caller = getUser(event.transaction.from.toHex())
  const poolTx = getPoolTransaction(event, caller.id, PoolTransactionType.SWAP)

  // btoken has 18 decimals
  const ammount = weiToDecimal(event.params.amt.toBigDecimal(), 18)

  if (fromAddress != ZERO_ADDRESS && toAddress != ZERO_ADDRESS) {
    poolTx.sharesTransferAmount = poolTx.sharesTransferAmount.plus(ammount)
  }

  if (fromAddress == ZERO_ADDRESS) {
    // add total
    const pool = getPool(poolAddress)
    pool.totalShares = pool.totalShares.plus(ammount)

    // check tx?
    if (pool.isFinalized) {
      const poolSnapshot = getPoolSnapshot(
        poolAddress,
        event.block.timestamp.toI32()
      )
      poolSnapshot.totalShares = pool.totalShares
      poolSnapshot.save()
    }

    pool.save()
  } else {
    if (poolAddress != fromAddress) {
      const fromUser = getPoolShare(poolAddress, fromAddress)
      fromUser.shares = fromUser.shares.minus(ammount)
      fromUser.save()
    }
  }

  if (toAddress == ZERO_ADDRESS) {
    // remove
    const pool = getPool(poolAddress)
    pool.totalShares = pool.totalShares.minus(ammount)
    if (pool.isFinalized) {
      const poolSnapshot = getPoolSnapshot(
        poolAddress,
        event.block.timestamp.toI32()
      )
      poolSnapshot.totalShares = pool.totalShares
      poolSnapshot.save()
    }
    pool.save()
  } else {
    if (poolAddress != toAddress) {
      const toUser = getPoolShare(poolAddress, toAddress)
      toUser.shares = toUser.shares.plus(ammount)
      toUser.save()
    }
  }

  poolTx.save()
}

export function handlePublishMarketFeeChanged(
  event: PublishMarketFeeChanged
): void {
  const pool = getPool(event.address.toHex())
  if (pool) {
    pool.publishMarketFeeAddress = event.params.newMarketCollector.toHexString()
    pool.publishMarketSwapFee = weiToDecimal(
      event.params.swapFee.toBigDecimal(),
      BigInt.fromI32(18).toI32()
    )
    pool.save()
  }
}

export function handleSwapFeeChanged(event: SwapFeeChanged): void {
  const pool = getPool(event.address.toHex())
  if (pool) {
    pool.liquidityProviderSwapFee = weiToDecimal(
      event.params.amount.toBigDecimal(),
      BigInt.fromI32(18).toI32()
    )
    pool.save()
  }
}
