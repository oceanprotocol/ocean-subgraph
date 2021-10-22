import { BigInt, Address, BigDecimal, log } from '@graphprotocol/graph-ts'
import {
  LOG_CALL,
  LOG_JOIN,
  LOG_EXIT,
  LOG_SWAP,
  Transfer,
  Pool as PoolEntity
} from '../@types/templates/Pool/Pool'

import {
  PoolFactory,
  Pool,
  PoolToken,
  PoolShare,
  Datatoken,
  PoolTransaction,
  Global
} from '../@types/schema'
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
  updatePoolTokenBalance,
  getOceanAddress,
  getGlobalStats,
  bigIntToDecimal
} from '../helpers'

/************************************
 ********** Pool Controls ***********
 ************************************/

export function handleSetSwapFee(
  event: LOG_CALL,
  swapFeeStr: string | null = null
): void {
  const poolId = event.address.toHex()
  const pool = Pool.load(poolId)
  if (!pool) return
  if (!swapFeeStr) {
    swapFeeStr = event.params.data.toHexString().slice(-40)
  }
  if (swapFeeStr !== null) pool.swapFee = hexToDecimal(swapFeeStr, 18)
  pool.save()
}

export function handleSetController(event: LOG_CALL): void {
  const poolId = event.address.toHex()
  const pool = Pool.load(poolId)
  if (!pool) return
  pool.controller = Address.fromString(
    event.params.data.toHexString().slice(-40)
  )
  pool.save()
}

export function handleSetPublicSwap(event: LOG_CALL): void {
  const poolId = event.address.toHex()
  const pool = Pool.load(poolId)
  if (!pool) return
  pool.publicSwap = event.params.data.toHexString().slice(-1) == '1'
  pool.save()
}

export function handleFinalize(event: LOG_CALL): void {
  const poolId = event.address.toHex()
  const pool = Pool.load(poolId)
  if (!pool) {
    log.error('Cannot handle finalize for unknown pool {} ', [poolId])
    return
  }
  if (pool.tokenCount == BigInt.fromI32(0)) {
    log.error('Cannot mark pool {} finalized, because we have 0 tokenCount', [
      poolId
    ])
    return
  }
  pool.finalized = true
  pool.symbol = 'BPT'
  pool.publicSwap = true
  pool.save()

  const factory = PoolFactory.load('1')
  if (!factory) return
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
  if (!pool) return
  const decimals = BigInt.fromI32(18).toI32()

  if (tokenAddress != OCEAN) {
    pool.datatokenAddress = tokenAddress
  }
  pool.tokenCount = pool.tokenCount.plus(BigInt.fromI32(1))
  const address = Address.fromString(tokenAddress)
  const denormWeight = hexToDecimal(denormWeightStr, decimals)
  const poolTokenId = poolId.concat('-').concat(address.toHexString())
  let poolToken = PoolToken.load(poolTokenId)
  if (poolToken == null) {
    createPoolTokenEntity(poolTokenId, poolId, address)
    poolToken = PoolToken.load(poolTokenId)
    pool.totalWeight = pool.totalWeight.plus(denormWeight)
  } else {
    const oldWeight = poolToken.denormWeight
    if (denormWeight > oldWeight) {
      pool.totalWeight = pool.totalWeight.plus(denormWeight).minus(oldWeight)
    } else {
      pool.totalWeight = pool.totalWeight.minus(oldWeight).minus(denormWeight)
    }
  }
  if (!poolToken) return
  poolToken.denormWeight =
    denormWeight !== null ? denormWeight : BigDecimal.fromString('0')
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

  if (baseTokenAddress != OCEAN) {
    log.error('baseTokenAddress is not Ocean, but is {}', [baseTokenAddress])
    return
  }
  const poolTokenId = poolId.concat('-').concat(baseTokenAddress)
  const poolToken = PoolToken.load(poolTokenId)
  if (!poolToken) return

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

  const poolTokenBalance = poolToken.balance
  const balance = poolTokenBalance
    ? poolTokenBalance
    : BigDecimal.fromString('0')
  updatePoolTransactionToken(
    event.transaction.hash.toHexString(),
    poolTokenId,
    amount,
    balance,
    ZERO_BD
  )
  // update the datatoken
  const poolDataToken = PoolToken.load(
    poolId.concat('-').concat(dataTokenAddress)
  )
  if (poolDataToken !== null) {
    amount = hexToDecimal(dataTokenAmount, 18)
    updatePoolTransactionToken(
      event.transaction.hash.toHexString(),
      poolId.concat('-').concat(dataTokenAddress),
      amount,
      poolDataToken.balance,
      ZERO_BD
    )
  }
}

/************************************
 ********** JOINS & EXITS ***********
 ************************************/

export function handleJoinPool(event: LOG_JOIN): void {
  const poolId = event.address.toHex()
  const address = event.params.tokenIn.toHex()
  const ptx = event.transaction.hash.toHexString()
  const poolTokenId = poolId.concat('-').concat(address)
  const poolToken = PoolToken.load(poolTokenId)
  const pool = Pool.load(poolId)
  const datatoken = Datatoken.load(poolTokenId)

  const poolTx = PoolTransaction.load(ptx)
  if (poolTx !== null) return
  if (!pool || !poolToken || !datatoken) return

  if (pool.finalized == false) {
    return
  }

  pool.joinCount = pool.joinCount.plus(BigInt.fromI32(1))
  pool.save()

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
  const pool = Pool.load(poolId)
  const poolToken = PoolToken.load(poolTokenId)
  const datatoken = Datatoken.load(poolTokenId)
  if (!poolToken || !pool || !datatoken) {
    return
  }

  const decimals =
    datatoken == null ? BigInt.fromI32(18).toI32() : datatoken.decimals
  const tokenAmountOut = tokenToDecimal(
    event.params.tokenAmountOut.toBigDecimal(),
    decimals
  )
  const newAmount = poolToken.balance.minus(tokenAmountOut)
  updatePoolTokenBalance(poolToken as PoolToken, newAmount, 'handleExitPool')
  poolToken.save()

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
  const pool = Pool.load(poolId)
  const factory = PoolFactory.load('1')
  const dtOut = Datatoken.load(tokenOut)
  if (!poolTokenOut || !dtOut || !factory || !pool) return

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

  pool.swapCount = pool.swapCount.plus(BigInt.fromI32(1))
  if (newAmountIn.equals(ZERO_BD) || newAmountOut.equals(ZERO_BD)) {
    decrPoolCount(pool.finalized)
    pool.active = false
  }
  if (tokenIn === getOceanAddress()) {
    pool.totalSwapVolume = pool.totalSwapVolume.plus(tokenAmountIn)
    factory.totalSwapVolume = factory.totalSwapVolume.plus(tokenAmountIn)
  } else {
    pool.totalSwapVolume = pool.totalSwapVolume.plus(tokenAmountOut)
    factory.totalSwapVolume = factory.totalSwapVolume.plus(tokenAmountOut)
  }

  factory.save()
  pool.save()
  const gStats: Global = getGlobalStats()
  if (gStats !== null) {
    gStats.totalSwapVolume = factory.totalSwapVolume
    gStats.save()
  }

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

  const poolShareToId = poolId.concat('-').concat(event.params.to.toHex())
  let poolShareTo = PoolShare.load(poolShareToId)
  const poolShareToBalance = poolShareTo == null ? ZERO_BD : poolShareTo.balance

  const pool = Pool.load(poolId)
  if (!pool) return
  const poolTx = PoolTransaction.load(event.transaction.hash.toHexString())
  const value = tokenToDecimal(event.params.value.toBigDecimal(), 18)

  if (isMint) {
    if (poolShareTo == null) {
      createPoolShareEntity(poolShareToId, poolId, event.params.to.toHex())
      poolShareTo = PoolShare.load(poolShareToId)
    }
    if (poolShareTo !== null) {
      poolShareTo.balance = poolShareTo.balance.plus(value)
      poolShareTo.save()
    }

    pool.totalShares = pool.totalShares.plus(value)
    if (poolTx != null) {
      poolTx.sharesTransferAmount = value
      if (poolShareTo !== null) poolTx.sharesBalance = poolShareTo.balance
    }
  } else if (isBurn) {
    if (poolShareFrom == null) {
      createPoolShareEntity(poolShareFromId, poolId, event.params.from.toHex())
      poolShareFrom = PoolShare.load(poolShareFromId)
    }

    pool.totalShares = pool.totalShares.minus(value)
    if (poolTx !== null) {
      poolTx.sharesTransferAmount = poolTx.sharesTransferAmount.minus(value)
    }

    if (poolTx !== null && poolShareFrom !== null) {
      poolTx.sharesBalance = poolShareFrom.balance
    }

    if (poolShareFrom !== null) {
      poolShareFrom.balance = poolShareFrom.balance.minus(value)
      poolShareFrom.save()
    }
  } else {
    if (poolShareTo == null) {
      createPoolShareEntity(poolShareToId, poolId, event.params.to.toHex())
      poolShareTo = PoolShare.load(poolShareToId)
    }

    if (poolShareTo !== null) {
      poolShareTo.balance = poolShareTo.balance.plus(value)
      poolShareTo.save()
    }

    if (poolShareFrom == null) {
      createPoolShareEntity(poolShareFromId, poolId, event.params.from.toHex())
      poolShareFrom = PoolShare.load(poolShareFromId)
    }
    if (poolShareFrom !== null) {
      poolShareFrom.balance = poolShareFrom.balance.minus(value)
      poolShareFrom.save()
    }
  }

  if (
    poolShareTo != null &&
    poolShareTo.balance.notEqual(ZERO_BD) &&
    poolShareToBalance.equals(ZERO_BD)
  ) {
    pool.holderCount = pool.holderCount.plus(BigInt.fromI32(1))
  }

  if (
    poolShareFrom !== null &&
    poolShareFrom.balance.equals(ZERO_BD) &&
    poolShareFrom.balance.notEqual(ZERO_BD)
  ) {
    pool.holderCount = pool.holderCount.plus(BigInt.fromI32(1))
  }

  if (poolTx !== null) {
    poolTx.save()
  }

  pool.save()
}

/************************************
 *********** GULP ************
 ************************************/
export function handleGulp(event: LOG_CALL): void {
  const poolId = event.address.toHex()
  const ptx = event.transaction.hash.toHexString()
  // we need to check the contract balance & compare with our internal balances
  const pool = Pool.load(poolId)
  const poolEbtity = PoolEntity.bind(Address.fromString(poolId))
  if (!pool) {
    log.warning('Gulp called, but cannot load pool {}', [poolId])
    return
  }
  const ocnToken = PoolToken.load(poolId.concat('-').concat(OCEAN))
  const dtToken = PoolToken.load(
    poolId.concat('-').concat(pool.datatokenAddress)
  )

  // get the balances from the contract
  // for ocean
  if (ocnToken) {
    const ocnTokenBalance = ocnToken.balance
    const balanceAttempt = poolEbtity.try_getBalance(Address.fromString(OCEAN))
    if (!balanceAttempt.reverted) {
      const contractBalance = bigIntToDecimal(balanceAttempt.value, 18)
      if (
        ocnToken.balance.notEqual(contractBalance) &&
        contractBalance.ge(ZERO_BD)
      ) {
        // we have a difference.  let's absorb that
        createPoolTransaction(event, 'gulp', event.params.caller.toHexString())
        ocnToken.balance = contractBalance
        ocnToken.save()
        updatePoolTransactionToken(
          ptx,
          ocnToken.id,
          contractBalance.minus(ocnTokenBalance),
          contractBalance,
          ZERO_BD
        )
      }
    }
  }
  // for dt
  if (dtToken) {
    const dtTokenBalance = dtToken.balance
    const balanceAttempt = poolEbtity.try_getBalance(
      Address.fromString(pool.datatokenAddress)
    )
    if (!balanceAttempt.reverted) {
      const contractBalance = bigIntToDecimal(balanceAttempt.value, 18)
      if (
        dtToken.balance.notEqual(contractBalance) &&
        contractBalance.ge(ZERO_BD)
      ) {
        // we have a difference.  let's absorb that
        createPoolTransaction(event, 'gulp', event.params.caller.toHexString())
        dtToken.balance = contractBalance
        dtToken.save()
        updatePoolTransactionToken(
          ptx,
          dtToken.id,
          contractBalance.minus(dtTokenBalance),
          contractBalance,
          ZERO_BD
        )
      }
    }
  }
}
