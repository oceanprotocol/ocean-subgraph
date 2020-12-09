
import {BigInt, Address, BigDecimal} from '@graphprotocol/graph-ts'
import { LOG_CALL, LOG_JOIN, LOG_EXIT, LOG_SWAP, Transfer } from '../types/templates/Pool/Pool'
import { log } from '@graphprotocol/graph-ts'

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
  debuglog, updatePoolTokenBalance
} from './helpers'

/************************************
 ********** Pool Controls ***********
 ************************************/

export function handleSetSwapFee(event: LOG_CALL, swapFeeStr: string=null): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)
  if (!swapFeeStr) {
    swapFeeStr = event.params.data.toHexString().slice(-40)
  }
  pool.swapFee = hexToDecimal(swapFeeStr, 18)
  pool.save()
}

export function handleSetController(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)
  pool.controller = Address.fromString(event.params.data.toHexString().slice(-40))
  pool.save()
}

export function handleSetPublicSwap(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)
  pool.publicSwap = event.params.data.toHexString().slice(-1) == '1'
  pool.save()
}

export function handleFinalize(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)
  pool.finalized = true
  pool.symbol = 'BPT'
  pool.publicSwap = true
  pool.save()

  let factory = PoolFactory.load('1')
  factory.finalizedPoolCount = factory.finalizedPoolCount + 1
  factory.save()
}

export function handleSetup(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  debuglog('handleSetup: ', event, [])
  let data = event.params.data.toHexString()
  // First 2 chars are 0x
  // Next there is 8 chars
  // Next starts the data each params occupies exactly 64 chars
  // Each value is padded with 0s to the left
  // For an Address, need to remove the leading 24 zeros, because the address itself is 40 chars
  // For numbers we donot need to remove the leading zeros because they have no effect being on the left of the number

  // skip 8 then take the last 40 (2 + 8 + 24 = 34) to (2 + 8 + 64 = 74)
  let dataTokenAddress = Address.fromString(data.slice(34,74)).toHexString()

  let dataTokenAmount = data.slice(74, 138) // 74+64
  let dataTokenWeight = data.slice(138,202) // (74+64,74+(2*64)
  let baseTokenAddress = Address.fromString(data.slice(202+24, 266)).toHexString() // (74+(2*64)+24, 74+(3*64))
  let baseTokenAmount = data.slice(266,330) // (74+(3*64),74+(4*64))
  let baseTokenWeight = data.slice(330,394) // (74+(4*64),74+(5*64))
  let swapFee = data.slice(394) // (74+(5*64), END)

  let poolTokenId = poolId.concat('-').concat(baseTokenAddress)
  let poolToken = PoolToken.load(poolTokenId)
  if (poolToken != null) return

  _handleRebind(event, poolId, dataTokenAddress, dataTokenAmount, dataTokenWeight)
  _handleRebind(event, poolId, baseTokenAddress, baseTokenAmount, baseTokenWeight)
  handleSetSwapFee(event, swapFee)
  handleFinalize(event)
  createPoolTransaction(event, 'setup', event.transaction.from.toHex())

  // update base token
  let amount = hexToDecimal(baseTokenAmount, 18)

  updatePoolTransactionToken(
    event.transaction.hash.toHexString(), poolTokenId,
    amount, PoolToken.load(poolTokenId).balance,
    ZERO_BD
  )
  // update the datatoken
  amount = hexToDecimal(dataTokenAmount, 18)
  updatePoolTransactionToken(
    event.transaction.hash.toHexString(), poolId.concat('-').concat(dataTokenAddress),
    amount, PoolToken.load(poolId.concat('-').concat(dataTokenAddress)).balance,
    ZERO_BD
  )
}

export function _handleRebind(event: LOG_CALL, poolId: string, tokenAddress: string, balanceStr: string, denormWeightStr: string): void {
  let pool = Pool.load(poolId)
  let decimals = BigInt.fromI32(18).toI32()

  if (tokenAddress != OCEAN ) {
    pool.datatokenAddress = tokenAddress
  }
  pool.tokenCount += BigInt.fromI32(1)
  let address = Address.fromString(tokenAddress)
  let denormWeight = hexToDecimal(denormWeightStr, decimals)
  let poolTokenId = poolId.concat('-').concat(address.toHexString())
  let poolToken = PoolToken.load(poolTokenId)
  if (poolToken == null) {
    createPoolTokenEntity(poolTokenId, poolId, address.toHexString())
    poolToken = PoolToken.load(poolTokenId)
    pool.totalWeight += denormWeight
  } else {
    let oldWeight = poolToken.denormWeight
    if (denormWeight > oldWeight) {
      pool.totalWeight = pool.totalWeight + (denormWeight - oldWeight)
    } else {
      pool.totalWeight = pool.totalWeight - (oldWeight - denormWeight)
    }
  }

  poolToken.denormWeight = denormWeight
  let balance = hexToDecimal(balanceStr, decimals)
  updatePoolTokenBalance(poolToken as PoolToken, balance, '_handleRebind')

  poolToken.save()
  if (balance.equals(ZERO_BD)) {
    decrPoolCount(pool.finalized)
    pool.active = false
  }
  pool.save()
}

export function handleRebind(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  _handleRebind(
      event,
      poolId,
      event.params.data.toHexString().slice(34,74),
      event.params.data.toHexString().slice(74,138),
      event.params.data.toHexString().slice(138)
  )
}

/************************************
 ********** JOINS & EXITS ***********
 ************************************/

export function handleJoinPool(event: LOG_JOIN): void {
  let poolId = event.address.toHex()

  let pool = Pool.load(poolId)
  if (pool.finalized == false){
    return
  }

  pool.joinCount = pool.joinCount.plus(BigInt.fromI32(1))
  pool.save()
  let ptx = event.transaction.hash.toHexString()
  let poolTx = PoolTransaction.load(ptx)
  if (poolTx != null) {
    debuglog('!!!!!!!!!!!!!!!!!!  !!!!!!!!!!!!!  JOIN JOIN JOIN !!!!!!!!!!!! PoolTransaction EXISTS: ', event, [])
    return
  }

  let address = event.params.tokenIn.toHex()
  let poolTokenId = poolId.concat('-').concat(address)
  let poolToken = PoolToken.load(poolTokenId)
  if (poolToken == null) {
    debuglog('!!!!!!!!!!!!!!!!!!  !!!!!!!!!!!!!  JOIN JOIN JOIN !!!!!!!!!!!! NO PoolToken: ', event, [address, poolTokenId])
    return
  }

  let datatoken: Datatoken | null
  datatoken = poolToken.tokenId != null ? Datatoken.load(poolToken.tokenId) : null
  let decimals = datatoken == null ? BigInt.fromI32(18).toI32() : datatoken.decimals
  let tokenAmountIn = tokenToDecimal(event.params.tokenAmountIn.toBigDecimal(), decimals)
  updatePoolTokenBalance(poolToken as PoolToken, poolToken.balance.plus(tokenAmountIn), 'handleJoinPool')
  debuglog('!!!!!!!!!!!!!!!!!!    JOIN JOIN JOIN : (token, amountIn, amountIn) ', event,
    [address, tokenAmountIn.toString(), event.params.tokenAmountIn.toString()])

  poolToken.save()
  createPoolTransaction(event, 'join', event.params.caller.toHexString())
  updatePoolTransactionToken(
    event.transaction.hash.toHexString(), poolTokenId,
    tokenAmountIn, poolToken.balance,
    tokenAmountIn.times(pool.swapFee)
  )
}

export function handleExitPool(event: LOG_EXIT): void {
  let poolId = event.address.toHex()

  let address = event.params.tokenOut.toHex()
  let poolTokenId = poolId.concat('-').concat(address.toString())
  let poolToken = PoolToken.load(poolTokenId)
  if (!poolToken) {
    debuglog('!!!!!!!!!!!!!!!!!!  !!!!!!!!!!!!!  EXIT EXIT EXIT !!!!!!!!!!!! NO PoolToken: ', event, [address, poolTokenId])
    return
  }

  let datatoken: Datatoken | null
  datatoken = poolToken.tokenId != null ? Datatoken.load(poolToken.tokenId) : null
  let decimals = datatoken == null ? BigInt.fromI32(18).toI32() : datatoken.decimals
  let tokenAmountOut = tokenToDecimal(event.params.tokenAmountOut.toBigDecimal(), decimals)
  let newAmount = poolToken.balance.minus(tokenAmountOut)
  updatePoolTokenBalance(poolToken as PoolToken, newAmount, 'handleExitPool')
  poolToken.save()
  debuglog('!!!!!!!!!!!!!!!!!!    EXIT EXIT EXIT : (token, amountOut, amountOut)', event,
    [address, tokenAmountOut.toString(), event.params.tokenAmountOut.toString()])
  let pool = Pool.load(poolId)
  pool.exitCount = pool.exitCount.plus(BigInt.fromI32(1))
  if (newAmount.equals(ZERO_BD)) {
    decrPoolCount(pool.finalized)
    pool.active = false
  }
  pool.save()

  createPoolTransaction(event, 'exit', event.params.caller.toHexString())
  updatePoolTransactionToken(
    event.transaction.hash.toHexString(), poolTokenId,
    tokenAmountOut.times(MINUS_1_BD), poolToken.balance,
    tokenAmountOut.times(pool.swapFee)
  )
}

/************************************
 ************** SWAPS ***************
 ************************************/

export function handleSwap(event: LOG_SWAP): void {
  let poolId = event.address.toHex()
  let ptx = event.transaction.hash.toHexString()

  let tokenIn = event.params.tokenIn.toHex()
  let poolTokenInId = poolId.concat('-').concat(tokenIn.toString())
  let poolTokenIn = PoolToken.load(poolTokenInId)
  if (!poolTokenIn) {
    debuglog('!!!!!!!!!!!!!!!!!!  !!!!!!!!!!!!!  SWAP SWAP SWAP !!!!!!!!!!!! NO PoolToken: ', event,
      [tokenIn, poolTokenInId])
    return
  }
  let dtIn = Datatoken.load(tokenIn)
  let tokenAmountIn = tokenToDecimal(event.params.tokenAmountIn.toBigDecimal(), (dtIn == null) ? 18 : dtIn.decimals)
  let newAmountIn = poolTokenIn.balance.plus(tokenAmountIn)
  updatePoolTokenBalance(poolTokenIn as PoolToken, newAmountIn, 'handleSwap.tokenIn')
  poolTokenIn.save()

  let tokenOut = event.params.tokenOut.toHex()
  let poolTokenOutId = poolId.concat('-').concat(tokenOut.toString())
  let poolTokenOut = PoolToken.load(poolTokenOutId)
  let dtOut = Datatoken.load(tokenOut)
  let tokenAmountOut = tokenToDecimal(event.params.tokenAmountOut.toBigDecimal(), (dtOut == null) ? 18 : dtOut.decimals)
  let newAmountOut = poolTokenOut.balance.minus(tokenAmountOut)
  updatePoolTokenBalance(poolTokenOut as PoolToken, newAmountOut, 'handleSwap.tokenOut')
  poolTokenOut.save()
  debuglog('!!!!!!!!!!!!!!!!!!    SWAP SWAP SWAP : (tokenIn, tokenOut, amountIn, amountIn, amountOut, amountOut)', event,
    [tokenIn, tokenOut, tokenAmountIn.toString(), event.params.tokenAmountIn.toString(),
     tokenAmountOut.toString(), event.params.tokenAmountOut.toString()])
  let pool = Pool.load(poolId)

  pool.swapCount = pool.swapCount.plus(BigInt.fromI32(1))
  if (newAmountIn.equals(ZERO_BD) || newAmountOut.equals(ZERO_BD)) {
    decrPoolCount(pool.finalized)
    pool.active = false
  }
  pool.save()

  createPoolTransaction(event, 'swap', event.params.caller.toHexString())
  updatePoolTransactionToken(
    ptx, poolTokenIn.id, tokenAmountIn, poolTokenIn.balance,
    tokenAmountIn.times(pool.swapFee))
  updatePoolTransactionToken(
    ptx, poolTokenOut.id, tokenAmountOut.times(MINUS_1_BD), poolTokenOut.balance,
    BigDecimal.fromString('0.0'))
}

/************************************
 *********** POOL SHARES ************
 ************************************/

 export function handleTransfer(event: Transfer): void {
  let poolId = event.address.toHex()

  let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  let isMint = event.params.from.toHex() == ZERO_ADDRESS
  let isBurn = event.params.to.toHex() == ZERO_ADDRESS

  let poolShareFromId = poolId.concat('-').concat(event.params.from.toHex())
  let poolShareFrom = PoolShare.load(poolShareFromId)
  let poolShareFromBalance = poolShareFrom == null ? ZERO_BD : poolShareFrom.balance

  let poolShareToId = poolId.concat('-').concat(event.params.to.toHex())
  let poolShareTo = PoolShare.load(poolShareToId)
  let poolShareToBalance = poolShareTo == null ? ZERO_BD : poolShareTo.balance

  let pool = Pool.load(poolId)
  let poolTx = PoolTransaction.load(event.transaction.hash.toHexString())
  let value = tokenToDecimal(event.params.value.toBigDecimal(), 18)

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
    poolShareTo !== null
    && poolShareTo.balance.notEqual(ZERO_BD)
    && poolShareToBalance.equals(ZERO_BD)
  ) {
    pool.holderCount += BigInt.fromI32(1)
  }

  if (
    poolShareFrom !== null
    && poolShareFrom.balance.equals(ZERO_BD)
    && poolShareFromBalance.notEqual(ZERO_BD)
  ) {
    pool.holderCount -= BigInt.fromI32(1)
  }

  if (poolTx != null) {
    poolTx.save()
  }

  pool.save()
}