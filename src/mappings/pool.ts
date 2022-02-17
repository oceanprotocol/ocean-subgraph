import { BigInt } from '@graphprotocol/graph-ts'
import {
  LOG_EXIT,
  LOG_JOIN,
  LOG_SETUP,
  LOG_SWAP,
  PublishMarketFeeChanged,
  SwapFeeChanged
} from '../@types/templates/BPool/BPool'
import { Transfer } from '../@types/templates/BPool/BToken'
import { integer, PoolTransactionType, ZERO_ADDRESS } from './utils/constants'
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
  getPoolSnapshot
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
  const poolSnapshot = getPoolSnapshot(pool.id, event.block.timestamp.toI32())
  const token = getToken(event.params.tokenIn.toHex())
  const ammount = weiToDecimal(
    event.params.tokenAmountIn.toBigDecimal(),
    token.decimals
  )
  if (token.isDatatoken) {
    poolTx.datatoken = token.id
    poolTx.datatokenValue = ammount

    poolSnapshot.datatokenLiquidity =
      poolSnapshot.datatokenLiquidity.plus(ammount)

    pool.datatokenLiquidity = pool.datatokenLiquidity.plus(ammount)
  } else {
    poolTx.baseToken = token.id
    poolTx.baseTokenValue = ammount

    poolSnapshot.baseTokenLiquidity =
      poolSnapshot.baseTokenLiquidity.plus(ammount)

    pool.baseTokenLiquidity = pool.baseTokenLiquidity.plus(ammount)

    addLiquidity(token.id, ammount)
  }

  poolSnapshot.save()
  poolTx.save()
  pool.save()
}

export function handleExit(event: LOG_EXIT): void {
  const pool = getPool(event.address.toHex())
  const user = getUser(event.params.caller.toHex())
  const poolTx = getPoolTransaction(event, user.id, PoolTransactionType.EXIT)

  pool.transactionCount = pool.transactionCount.plus(integer.ONE)
  pool.joinCount = pool.joinCount.plus(integer.ONE)

  // get token and update pool transaction, value is negative because this is an exit event.
  const token = getToken(event.params.tokenOut.toHex())
  const poolSnapshot = getPoolSnapshot(pool.id, event.block.timestamp.toI32())
  const ammount = weiToDecimal(
    event.params.tokenAmountOut.toBigDecimal(),
    token.decimals
  )
  if (token.isDatatoken) {
    poolTx.datatoken = token.id
    poolTx.datatokenValue = ammount.neg()

    poolSnapshot.datatokenLiquidity =
      poolSnapshot.datatokenLiquidity.minus(ammount)

    pool.datatokenLiquidity.minus(ammount)
  } else {
    poolTx.baseToken = token.id
    poolTx.baseTokenValue = ammount.neg()

    poolSnapshot.baseTokenLiquidity =
      poolSnapshot.baseTokenLiquidity.minus(ammount)

    pool.baseTokenLiquidity.minus(ammount)
    removeLiquidity(token.id, ammount)
  }

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
  // get token out and update pool transaction, value is negative
  const tokenOut = getToken(event.params.tokenOut.toHex())
  const ammountOut = weiToDecimal(
    event.params.tokenAmountOut.toBigDecimal(),
    tokenOut.decimals
  )
  if (tokenOut.isDatatoken) {
    poolTx.datatoken = tokenOut.id
    poolTx.datatokenValue = ammountOut.neg()

    pool.datatokenLiquidity = pool.datatokenLiquidity.minus(ammountOut)

    poolSnapshot.datatokenLiquidity =
      poolSnapshot.datatokenLiquidity.minus(ammountOut)
  } else {
    poolTx.baseToken = tokenOut.id
    poolTx.baseTokenValue = ammountOut.neg()

    pool.baseTokenLiquidity = pool.baseTokenLiquidity.minus(ammountOut)

    poolSnapshot.baseTokenLiquidity =
      poolSnapshot.baseTokenLiquidity.minus(ammountOut)

    addPoolSwap(tokenOut.id, ammountOut)
    removeLiquidity(tokenOut.id, ammountOut)
  }

  // update pool token in
  const tokenIn = getToken(event.params.tokenIn.toHex())
  const ammountIn = weiToDecimal(
    event.params.tokenAmountIn.toBigDecimal(),
    tokenIn.decimals
  )
  if (tokenIn.isDatatoken) {
    poolTx.datatoken = tokenIn.id
    poolTx.datatokenValue = ammountIn

    pool.datatokenLiquidity = pool.datatokenLiquidity.plus(ammountIn)

    poolSnapshot.datatokenLiquidity =
      poolSnapshot.datatokenLiquidity.plus(ammountIn)
  } else {
    poolTx.baseToken = tokenIn.id
    poolTx.baseTokenValue = ammountIn

    pool.baseTokenLiquidity = pool.baseTokenLiquidity.plus(ammountIn)

    poolSnapshot.baseTokenLiquidity =
      poolSnapshot.baseTokenLiquidity.plus(ammountIn)

    addLiquidity(tokenIn.id, ammountIn)
    addPoolSwap(tokenIn.id, ammountIn)
  }

  // update spot price
  const isTokenInDatatoken = tokenIn.isDatatoken
  const spotPrice = calcSpotPrice(
    pool.id,
    isTokenInDatatoken ? tokenOut.id : tokenIn.id,
    isTokenInDatatoken ? tokenIn.id : tokenOut.id,
    isTokenInDatatoken ? tokenIn.decimals : tokenOut.decimals
  )
  pool.spotPrice = spotPrice
  poolSnapshot.spotPrice = spotPrice

  poolSnapshot.save()
  poolTx.save()
  pool.save()
}

// setup is just to set token weight(it will mostly be 50:50) and spotPrice
export function handleSetup(event: LOG_SETUP): void {
  const pool = getPool(event.address.toHex())

  pool.controller = event.params.caller.toHexString()
  const token = getToken(event.params.baseToken.toHex())
  pool.baseToken = token.id
  pool.baseTokenWeight = weiToDecimal(
    event.params.baseTokenWeight.toBigDecimal(),
    token.decimals
  )

  // decimals hardcoded because datatokens have 18 decimals
  const datatoken = getToken(event.params.datatoken.toHex())
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
  poolTx.datatoken = datatoken.id
  const poolSnapshot = getPoolSnapshot(pool.id, event.block.timestamp.toI32())
  poolSnapshot.spotPrice = spotPrice

  poolTx.save()
  poolSnapshot.save()
  const globalStats = getGlobalStats()
  globalStats.poolCount = globalStats.poolCount + 1
  globalStats.save()
  pool.save()
  datatoken.save()
}

export function handlerBptTransfer(event: Transfer): void {
  const fromAddress = event.params.src.toHexString()
  const toAddress = event.params.dst.toHexString()
  const poolAddress = event.address.toHex()
  const caller = getUser(event.transaction.from.toHex())
  const poolTx = getPoolTransaction(event, caller.id, PoolTransactionType.SWAP)
  const poolSnapshot = getPoolSnapshot(
    poolAddress,
    event.block.timestamp.toI32()
  )

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
    poolSnapshot.totalShares = pool.totalShares
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
    poolSnapshot.totalShares = pool.totalShares
    pool.save()
  } else {
    if (poolAddress != toAddress) {
      const toUser = getPoolShare(poolAddress, toAddress)
      toUser.shares = toUser.shares.plus(ammount)
      toUser.save()
    }
  }

  poolTx.save()
  poolSnapshot.save()
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
