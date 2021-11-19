import { PoolTransaction } from '../@types/schema'
import {
  LOG_BPT,
  LOG_EXIT,
  LOG_JOIN,
  LOG_SETUP,
  LOG_SWAP
} from '../@types/templates/BPool/BPool'
import { Transfer } from '../@types/templates/BPool/BToken'
import { integer, PoolTransactionType } from './utils/constants'
import { weiToDecimal } from './utils/generic'
import {
  calcSpotPrice,
  getPool,
  getPoolToken,
  getPoolTransaction,
  getPoolShares
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

  // get token,  update pool transaction and update pool user liquidity
  const token = getToken(event.params.tokenIn.toHex())
  const ammount = weiToDecimal(
    event.params.tokenAmountIn.toBigDecimal(),
    token.decimals
  )
  if (token.isDatatoken) {
    poolTx.datatoken = token.id
    poolTx.datatokenValue = ammount
  } else {
    poolTx.baseToken = token.id
    poolTx.baseTokenValue = ammount
  }

  // update pool token
  const poolToken = getPoolToken(pool.id, token.id)
  poolToken.balance.plus(ammount)

  poolToken.save()
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
  const ammount = weiToDecimal(
    event.params.tokenAmountOut.toBigDecimal(),
    token.decimals
  )
  if (token.isDatatoken) {
    poolTx.datatoken = token.id
    poolTx.datatokenValue = ammount.neg()
  } else {
    poolTx.baseToken = token.id
    poolTx.baseTokenValue = ammount.neg()
  }

  const poolToken = getPoolToken(pool.id, token.id)
  poolToken.balance.minus(ammount)

  poolToken.save()
  poolTx.save()
  pool.save()
}

export function handleSwap(event: LOG_SWAP): void {
  const pool = getPool(event.address.toHex())
  const user = getUser(event.params.caller.toHex())
  const poolTx = getPoolTransaction(event, user.id, PoolTransactionType.SWAP)

  pool.transactionCount = pool.transactionCount.plus(integer.ONE)
  pool.joinCount = pool.joinCount.plus(integer.ONE)

  // get token out and update pool transaction, value is negative
  const tokenOut = getToken(event.params.tokenOut.toHex())
  const ammountOut = weiToDecimal(
    event.params.tokenAmountOut.toBigDecimal(),
    tokenOut.decimals
  )
  if (tokenOut.isDatatoken) {
    poolTx.datatoken = tokenOut.id
    poolTx.datatokenValue = ammountOut.neg()
  } else {
    poolTx.baseToken = tokenOut.id
    poolTx.baseTokenValue = ammountOut.neg()
  }
  const poolTokenOut = getPoolToken(pool.id, tokenOut.id)
  poolTokenOut.balance.minus(ammountOut)

  // update pool token in
  const tokenIn = getToken(event.params.tokenIn.toHex())
  const ammountIn = weiToDecimal(
    event.params.tokenAmountIn.toBigDecimal(),
    tokenIn.decimals
  )
  if (tokenIn.isDatatoken) {
    poolTx.datatoken = tokenIn.id
    poolTx.datatokenValue = ammountIn
  } else {
    poolTx.baseToken = tokenIn.id
    poolTx.baseTokenValue = ammountIn
  }
  const poolTokenIn = getPoolToken(pool.id, tokenIn.id)
  poolTokenIn.balance.plus(ammountIn)

  // update spot price
  const isTokenInDatatoken = tokenIn.isDatatoken
  const spotPrice = calcSpotPrice(
    pool.id,
    isTokenInDatatoken ? tokenOut.id : tokenIn.id,
    isTokenInDatatoken ? tokenIn.id : tokenOut.id,
    isTokenInDatatoken ? tokenIn.decimals : tokenOut.decimals
  )
  pool.spotPrice = spotPrice

  poolTokenIn.save()
  poolTokenOut.save()
  poolTx.save()
  pool.save()
}

// setup is just to set token weight and spotPrice , it will mostly be 50:50
export function handleSetup(event: LOG_SETUP): void {
  const pool = getPool(event.address.toHex())

  const token = getToken(event.params.baseToken.toHex())
  const baseToken = getPoolToken(pool.id, event.params.baseToken.toHex())
  baseToken.denormWeight = weiToDecimal(
    event.params.baseTokenWeight.toBigDecimal(),
    token.decimals
  )
  baseToken.save()

  // decimals hardcoded because datatokens have 18 decimals
  const datatoken = getPoolToken(pool.id, event.params.dataToken.toHex())
  datatoken.denormWeight = weiToDecimal(
    event.params.dataTokenWeight.toBigDecimal(),
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

  pool.save()
  datatoken.save()
}

export function handleBpt(event: LOG_BPT): void {
  const pool = getPool(event.address.toHex())
  const poolShares = getPoolShares(pool.id, event.transaction.from.toHex())
  const poolTx = PoolTransaction.load(event.transaction.hash.toHex())
  // TODO: should we return here if null? theoretically this should not be null since LOG_BPT is after the other events
  if (!poolTx) return

  const decimalBpt = weiToDecimal(event.params.bptAmount.toBigDecimal(), 18)

  switch (poolTx.type) {
    case PoolTransactionType.JOIN: {
      poolShares.shares = poolShares.shares.plus(decimalBpt)
      pool.totalShares.plus(decimalBpt)
      break
    }
    case PoolTransactionType.EXIT: {
      poolShares.shares = poolShares.shares.minus(decimalBpt)
      pool.totalShares.minus(decimalBpt)
      break
    }
  }

  poolShares.shares = weiToDecimal(event.params.bptAmount.toBigDecimal(), 18)

  pool.save()
  poolShares.save()
}

export function handlerBptTransfer(event: Transfer): void {
  const fromUser = getPoolShares(
    event.address.toHex(),
    event.params.src.toHex()
  )
  const toUser = getPoolShares(event.address.toHex(), event.params.dst.toHex())
  const ammount = weiToDecimal(event.params.amt.toBigDecimal(), 18)

  fromUser.shares = fromUser.shares.minus(ammount)
  toUser.shares = toUser.shares.plus(ammount)

  fromUser.save()
  toUser.save()
}
