import { BigInt, Address, BigDecimal } from '@graphprotocol/graph-ts'
import {
  LOG_CALL,
  LOG_JOIN,
  LOG_EXIT,
  LOG_SWAP,
  Transfer
} from '../types/templates/Pool/Pool'

import {
  PoolFactory,
  Pool,
  PoolToken,
  PoolShare,
  Datatoken,
  PoolTransaction
} from '../types/schema'
import {
  hexToDecimal,
  tokenToDecimal,
  createPoolShareEntity,
  createPoolTokenEntity,
  ZERO_BD,
  MINUS_1_BD,
  decrPoolCount,
  updatePoolTransactionToken,
  createPoolTransaction,
  OCEAN,
  debuglog,
  updatePoolTokenBalance
} from '../helpers'

/************************************
 ********** Pool Controls ***********
 ************************************/

export function handleSetSwapFee(
  event: LOG_CALL,
  swapFeeStr: string = null
): void {
  const poolId = event.address.toHex()
  const pool = Pool.load(poolId)
  if (!swapFeeStr) {
    swapFeeStr = event.params.data.toHexString().slice(-40)
  }
  pool.swapFee = hexToDecimal(swapFeeStr, 18)
  pool.save()
}

export function handleSetController(event: LOG_CALL): void {
  const poolId = event.address.toHex()
  const pool = Pool.load(poolId)
  pool.controller = Address.fromString(
    event.params.data.toHexString().slice(-40)
  )
  pool.save()
}

export function handleSetPublicSwap(event: LOG_CALL): void {
  const poolId = event.address.toHex()
  const pool = Pool.load(poolId)
  pool.publicSwap = event.params.data.toHexString().slice(-1) == '1'
  pool.save()
}

export function handleFinalize(event: LOG_CALL): void {
  const poolId = event.address.toHex()
  const pool = Pool.load(poolId)
  pool.finalized = true
  pool.symbol = 'BPT'
  pool.publicSwap = true
  pool.save()

  const factory = PoolFactory.load('1')
  factory.finalizedPoolCount = factory.finalizedPoolCount + 1
  factory.save()
}

export function _handleRebind(
  event: LOG_CALL,
  poolId: string,
  tokenAddress: string,
  balanceStr: string,
  denormWeightStr: string
): void {
  const pool = Pool.load(poolId)
  const decimals = BigInt.fromI32(18).toI32()

  if (tokenAddress != OCEAN) {
    pool.datatokenAddress = tokenAddress
  }
  pool.tokenCount += BigInt.fromI32(1)
  const address = Address.fromString(tokenAddress)
  const denormWeight = hexToDecimal(denormWeightStr, decimals)
  const poolTokenId = poolId.concat('-').concat(address.toHexString())
  let poolToken = PoolToken.load(poolTokenId)
  if (poolToken == null) {
    createPoolTokenEntity(poolTokenId, poolId, address.toHexString())
    poolToken = PoolToken.load(poolTokenId)
    pool.totalWeight += denormWeight
  } else {
    const oldWeight = poolToken.denormWeight
    if (denormWeight > oldWeight) {
      pool.totalWeight = pool.totalWeight + (denormWeight - oldWeight)
    } else {
      pool.totalWeight = pool.totalWeight - (oldWeight - denormWeight)
    }
  }

  poolToken.denormWeight = denormWeight
  const balance = hexToDecimal(balanceStr, decimals)
  updatePoolTokenBalance(poolToken as PoolToken, balance, '_handleRebind')

  poolToken.save()
  if (balance.equals(ZERO_BD)) {
    decrPoolCount(pool.finalized)
    pool.active = false
  }
  pool.save()
}

export function handleRebind(event: LOG_CALL): void {
  const poolId = event.address.toHex()
  _handleRebind(
    event,
    poolId,
    event.params.data.toHexString().slice(34, 74),
    event.params.data.toHexString().slice(74, 138),
    event.params.data.toHexString().slice(138)
  )
}

export function handleSetup(event: LOG_CALL): void {
  if (PoolTransaction.load(event.transaction.hash.toHexString()) != null) {
    return
  }

  const poolId = event.address.toHex()
  debuglog('handleSetup: ', event, [])
  const data = event.params.data.toHexString()
  // First 2 chars are 0x
  // Next there is 8 chars
  // Next starts the data each params occupies exactly 64 chars
  // Each value is padded with 0s to the left
  // For an Address, need to remove the leading 24 zeros, because the address itself is 40 chars
  // For numbers we donot need to remove the leading zeros because they have no effect being on the left of the number

  // skip 8 then take the last 40 (2 + 8 + 24 = 34) to (2 + 8 + 64 = 74)
  const dataTokenAddress = Address.fromString(data.slice(34, 74)).toHexString()

  const dataTokenAmount = data.slice(74, 138) // 74+64
  const dataTokenWeight = data.slice(138, 202) // (74+64,74+(2*64)
  const baseTokenAddress = Address.fromString(
    data.slice(202 + 24, 266)
  ).toHexString() // (74+(2*64)+24, 74+(3*64))
  const baseTokenAmount = data.slice(266, 330) // (74+(3*64),74+(4*64))
  const baseTokenWeight = data.slice(330, 394) // (74+(4*64),74+(5*64))
  const swapFee = data.slice(394) // (74+(5*64), END)

  const poolTokenId = poolId.concat('-').concat(baseTokenAddress)
  const poolToken = PoolToken.load(poolTokenId)
  if (poolToken != null) return

  _handleRebind(
    event,
    poolId,
    dataTokenAddress,
    dataTokenAmount,
    dataTokenWeight
  )
  _handleRebind(
    event,
    poolId,
    baseTokenAddress,
    baseTokenAmount,
    baseTokenWeight
  )
  handleSetSwapFee(event, swapFee)
  handleFinalize(event)
  createPoolTransaction(event, 'setup', event.transaction.from.toHex())

  // update base token
  let amount = hexToDecimal(baseTokenAmount, 18)

  updatePoolTransactionToken(
    event.transaction.hash.toHexString(),
    poolTokenId,
    amount,
    PoolToken.load(poolTokenId).balance,
    ZERO_BD
  )
  // update the datatoken
  amount = hexToDecimal(dataTokenAmount, 18)
  updatePoolTransactionToken(
    event.transaction.hash.toHexString(),
    poolId.concat('-').concat(dataTokenAddress),
    amount,
    PoolToken.load(poolId.concat('-').concat(dataTokenAddress)).balance,
    ZERO_BD
  )
}

/************************************
 ********** JOINS & EXITS ***********
 ************************************/

export function handleJoinPool(event: LOG_JOIN): void {
  const poolId = event.address.toHex()

  const pool = Pool.load(poolId)
  if (pool.finalized == false) {
    return
  }

  pool.joinCount = pool.joinCount.plus(BigInt.fromI32(1))
  pool.save()
  const ptx = event.transaction.hash.toHexString()
  const poolTx = PoolTransaction.load(ptx)
  if (poolTx != null) {
    debuglog(
      '!!!!!!!!!!!!!!!!!!  !!!!!!!!!!!!!  JOIN JOIN JOIN !!!!!!!!!!!! PoolTransaction EXISTS: ',
      event,
      []
    )
    return
  }

  const address = event.params.tokenIn.toHex()
  const poolTokenId = poolId.concat('-').concat(address)
  const poolToken = PoolToken.load(poolTokenId)
  if (poolToken == null) {
    debuglog(
      '!!!!!!!!!!!!!!!!!!  !!!!!!!!!!!!!  JOIN JOIN JOIN !!!!!!!!!!!! NO PoolToken: ',
      event,
      [address, poolTokenId]
    )
    return
  }

  const datatoken: Datatoken | null =
    poolToken.tokenId != null ? Datatoken.load(poolToken.tokenId) : null
  const decimals =
    datatoken == null ? BigInt.fromI32(18).toI32() : datatoken.decimals
  const tokenAmountIn = tokenToDecimal(
    event.params.tokenAmountIn.toBigDecimal(),
    decimals
  )
  updatePoolTokenBalance(
    poolToken as PoolToken,
    poolToken.balance.plus(tokenAmountIn),
    'handleJoinPool'
  )
  debuglog(
    '!!!!!!!!!!!!!!!!!!    JOIN JOIN JOIN : (token, amountIn, amountIn) ',
    event,
    [address, tokenAmountIn.toString(), event.params.tokenAmountIn.toString()]
  )

  poolToken.save()
  createPoolTransaction(event, 'join', event.params.caller.toHexString())
  updatePoolTransactionToken(
    event.transaction.hash.toHexString(),
    poolTokenId,
    tokenAmountIn,
    poolToken.balance,
    tokenAmountIn.times(pool.swapFee)
  )
}

export function handleExitPool(event: LOG_EXIT): void {
  const poolId = event.address.toHex()

  const address = event.params.tokenOut.toHex()
  const poolTokenId = poolId.concat('-').concat(address.toString())
  const poolToken = PoolToken.load(poolTokenId)
  if (!poolToken) {
    debuglog(
      '!!!!!!!!!!!!!!!!!!  !!!!!!!!!!!!!  EXIT EXIT EXIT !!!!!!!!!!!! NO PoolToken: ',
      event,
      [address, poolTokenId]
    )
    return
  }

  const datatoken: Datatoken | null =
    poolToken.tokenId != null ? Datatoken.load(poolToken.tokenId) : null
  const decimals =
    datatoken == null ? BigInt.fromI32(18).toI32() : datatoken.decimals
  const tokenAmountOut = tokenToDecimal(
    event.params.tokenAmountOut.toBigDecimal(),
    decimals
  )
  const newAmount = poolToken.balance.minus(tokenAmountOut)
  updatePoolTokenBalance(poolToken as PoolToken, newAmount, 'handleExitPool')
  poolToken.save()
  debuglog(
    '!!!!!!!!!!!!!!!!!!    EXIT EXIT EXIT : (token, amountOut, amountOut)',
    event,
    [address, tokenAmountOut.toString(), event.params.tokenAmountOut.toString()]
  )
  const pool = Pool.load(poolId)
  pool.exitCount = pool.exitCount.plus(BigInt.fromI32(1))
  if (newAmount.equals(ZERO_BD)) {
    decrPoolCount(pool.finalized)
    pool.active = false
  }
  pool.save()

  createPoolTransaction(event, 'exit', event.params.caller.toHexString())
  updatePoolTransactionToken(
    event.transaction.hash.toHexString(),
    poolTokenId,
    tokenAmountOut.times(MINUS_1_BD),
    poolToken.balance,
    tokenAmountOut.times(pool.swapFee)
  )
}

/************************************
 ************** SWAPS ***************
 ************************************/

export function handleSwap(event: LOG_SWAP): void {
  const poolId = event.address.toHex()
  const ptx = event.transaction.hash.toHexString()

  const tokenIn = event.params.tokenIn.toHex()
  const poolTokenInId = poolId.concat('-').concat(tokenIn.toString())
  const poolTokenIn = PoolToken.load(poolTokenInId)
  if (!poolTokenIn) {
    debuglog(
      '!!!!!!!!!!!!!!!!!!  !!!!!!!!!!!!!  SWAP SWAP SWAP !!!!!!!!!!!! NO PoolToken: ',
      event,
      [tokenIn, poolTokenInId]
    )
    return
  }
  const dtIn = Datatoken.load(tokenIn)
  const tokenAmountIn = tokenToDecimal(
    event.params.tokenAmountIn.toBigDecimal(),
    dtIn == null ? 18 : dtIn.decimals
  )
  const newAmountIn = poolTokenIn.balance.plus(tokenAmountIn)
  updatePoolTokenBalance(
    poolTokenIn as PoolToken,
    newAmountIn,
    'handleSwap.tokenIn'
  )
  poolTokenIn.save()

  const tokenOut = event.params.tokenOut.toHex()
  const poolTokenOutId = poolId.concat('-').concat(tokenOut.toString())
  const poolTokenOut = PoolToken.load(poolTokenOutId)
  const dtOut = Datatoken.load(tokenOut)
  const tokenAmountOut = tokenToDecimal(
    event.params.tokenAmountOut.toBigDecimal(),
    dtOut == null ? 18 : dtOut.decimals
  )
  const newAmountOut = poolTokenOut.balance.minus(tokenAmountOut)
  updatePoolTokenBalance(
    poolTokenOut as PoolToken,
    newAmountOut,
    'handleSwap.tokenOut'
  )
  poolTokenOut.save()
  debuglog(
    '!!!!!!!!!!!!!!!!!!    SWAP SWAP SWAP : (tokenIn, tokenOut, amountIn, amountIn, amountOut, amountOut)',
    event,
    [
      tokenIn,
      tokenOut,
      tokenAmountIn.toString(),
      event.params.tokenAmountIn.toString(),
      tokenAmountOut.toString(),
      event.params.tokenAmountOut.toString()
    ]
  )
  const pool = Pool.load(poolId)

  pool.swapCount = pool.swapCount.plus(BigInt.fromI32(1))
  if (newAmountIn.equals(ZERO_BD) || newAmountOut.equals(ZERO_BD)) {
    decrPoolCount(pool.finalized)
    pool.active = false
  }
  pool.save()

  createPoolTransaction(event, 'swap', event.params.caller.toHexString())
  updatePoolTransactionToken(
    ptx,
    poolTokenIn.id,
    tokenAmountIn,
    poolTokenIn.balance,
    tokenAmountIn.times(pool.swapFee)
  )
  updatePoolTransactionToken(
    ptx,
    poolTokenOut.id,
    tokenAmountOut.times(MINUS_1_BD),
    poolTokenOut.balance,
    BigDecimal.fromString('0.0')
  )
}

/************************************
 *********** POOL SHARES ************
 ************************************/

export function handleTransfer(event: Transfer): void {
  const poolId = event.address.toHex()

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  const isMint = event.params.from.toHex() == ZERO_ADDRESS
  const isBurn = event.params.to.toHex() == ZERO_ADDRESS

  const poolShareFromId = poolId.concat('-').concat(event.params.from.toHex())
  let poolShareFrom = PoolShare.load(poolShareFromId)
  const poolShareFromBalance =
    poolShareFrom == null ? ZERO_BD : poolShareFrom.balance

  const poolShareToId = poolId.concat('-').concat(event.params.to.toHex())
  let poolShareTo = PoolShare.load(poolShareToId)
  const poolShareToBalance = poolShareTo == null ? ZERO_BD : poolShareTo.balance

  const pool = Pool.load(poolId)
  const poolTx = PoolTransaction.load(event.transaction.hash.toHexString())
  const value = tokenToDecimal(event.params.value.toBigDecimal(), 18)

  if (isMint) {
    if (poolShareTo == null) {
      createPoolShareEntity(poolShareToId, poolId, event.params.to.toHex())
      poolShareTo = PoolShare.load(poolShareToId)
    }
    poolShareTo.balance += value
    poolShareTo.save()
    pool.totalShares += value
    if (poolTx != null) {
      poolTx.sharesTransferAmount = value
      poolTx.sharesBalance = poolShareTo.balance
    }
    debuglog('pool shares mint: (id, value, totalShares)', event, [poolId, value.toString(), pool.totalShares.toString()])

  } else if (isBurn) {
    if (poolShareFrom == null) {
      createPoolShareEntity(poolShareFromId, poolId, event.params.from.toHex())
      poolShareFrom = PoolShare.load(poolShareFromId)
    }
    poolShareFrom.balance -= value
    poolShareFrom.save()
    pool.totalShares -= value
    if (poolTx != null) {
      poolTx.sharesTransferAmount = -value
      poolTx.sharesBalance = poolShareFrom.balance
    }
    debuglog('pool shares burn: (id, value, totalShares)', event, [poolId, value.toString(), pool.totalShares.toString()])
  } else {
    if (poolShareTo == null) {
      createPoolShareEntity(poolShareToId, poolId, event.params.to.toHex())
      poolShareTo = PoolShare.load(poolShareToId)
    }
    poolShareTo.balance += value
    poolShareTo.save()

    if (poolShareFrom == null) {
      createPoolShareEntity(poolShareFromId, poolId, event.params.from.toHex())
      poolShareFrom = PoolShare.load(poolShareFromId)
    }
    poolShareFrom.balance -= value
    poolShareFrom.save()
  }

  if (
    poolShareTo != null &&
    poolShareTo.balance.notEqual(ZERO_BD) &&
    poolShareToBalance.equals(ZERO_BD)
  ) {
    pool.holderCount += BigInt.fromI32(1)
  }

  if (
    poolShareFrom != null &&
    poolShareFrom.balance.equals(ZERO_BD) &&
    poolShareFromBalance.notEqual(ZERO_BD)
  ) {
    pool.holderCount -= BigInt.fromI32(1)
  }

  if (poolTx != null) {
    poolTx.save()
  }

  pool.save()
}
