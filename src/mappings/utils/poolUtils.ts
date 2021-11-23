import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts'
import {
  Pool,
  PoolShares,
  PoolToken,
  PoolTransaction
} from '../../@types/schema'
import { BPool } from '../../@types/templates/BPool/BPool'
import { PoolTransactionType } from './constants'
import { gweiToEth, weiToDecimal } from './generic'

export function getPoolSharesId(
  poolAddress: string,
  userAddress: string
): string {
  return `${poolAddress}-${userAddress}`
}

export function getPoolTransaction(
  event: ethereum.Event,
  userAddress: string,
  type: PoolTransactionType
): PoolTransaction {
  let poolTx = PoolTransaction.load(event.transaction.hash.toHex())

  // create pool transaction and fill basic fields
  if (poolTx === null) {
    poolTx = new PoolTransaction(event.transaction.hash.toHex())

    poolTx.user = userAddress
    poolTx.pool = event.address.toHex()
    poolTx.type = type

    poolTx.timestamp = event.block.timestamp.toI32()
    poolTx.tx = event.transaction.hash
    poolTx.block = event.block.number.toI32()

    poolTx.gasPrice = gweiToEth(event.transaction.gasPrice.toBigDecimal())
    poolTx.gasLimit = event.transaction.gasLimit.toBigDecimal()
  }

  return poolTx
}

export function getPoolShares(
  poolAddress: string,
  userAddress: string
): PoolShares {
  let poolShares = PoolShares.load(getPoolSharesId(poolAddress, userAddress))
  if (poolShares === null) {
    poolShares = new PoolShares(getPoolSharesId(poolAddress, userAddress))
  }
  return poolShares
}

export function getPool(poolAddress: string): Pool {
  const pool = Pool.load(poolAddress)
  if (pool === null) {
    // what now?
    throw new Error(`Didn't find pool with address ${poolAddress} `)
  }
  return pool
}

export function getPoolTokenId(
  poolAddress: string,
  tokenAddress: string
): string {
  return `${poolAddress}-${tokenAddress}`
}

export function getPoolToken(
  poolAddress: string,
  tokenAddress: string
): PoolToken {
  let poolToken = PoolToken.load(getPoolTokenId(poolAddress, tokenAddress))
  if (poolToken === null) {
    poolToken = new PoolToken(getPoolTokenId(poolAddress, tokenAddress))
    // TODO: add data to pooltoken
  }

  return poolToken
}

export function calcSpotPrice(
  poolAddress: string,
  baseTokenAddress: string,
  datatokenAddress: string,
  baseTokenDecimals: i32
): BigDecimal {
  const poolContract = BPool.bind(Address.fromString(poolAddress))
  // tokenIn is always the baseToken and tokenOut is the datatoken because we want the spot price to be in baseToken eg: 1 DT = 0.5 OCEAN
  const weiPrice = poolContract.try_getSpotPrice(
    Address.fromString(baseTokenAddress),
    Address.fromString(datatokenAddress)
  ).reverted
  const price = weiToDecimal(weiPrice, baseTokenDecimals)

  return price
}


export function getPoolSnapshotId(poolAddress: string, timestamp: i32): string {
  const dayTimestamp = timestamp - (timestamp % DAY) // Todays Timestamp
  return `${poolAddress}-${dayTimestamp}`
}

export function createPoolSnapshot(poolId: string, timestamp: i32): void {
  log.warning('Start create Pool Snapshot: {}   {}', [
    poolId,
    timestamp.toString()
  ])
  const dayTimestamp = timestamp - (timestamp % DAY) // Todays Timestamp

  const pool = PoolEntity.load(poolId)

  log.warning('got pool {} {}', [pool.id, poolId])
  // Save pool snapshot
  const snapshotId = poolId + '-' + dayTimestamp.toString()

  log.warning('Creatnig Pool Snapshot with id {} {} {}', [
    snapshotId,
    pool.totalShares.toString(),
    pool.totalSwapFee.toString()
  ])
  const snapshot = new PoolSnapshot(snapshotId)

  snapshot.pool = poolId

  snapshot.totalShares = pool.totalShares
  snapshot.swapVolume = ZERO_BD
  snapshot.swapFees = pool.totalSwapFee
  snapshot.timestamp = dayTimestamp
  snapshot.save()
}

export function saveSwapToSnapshot(
  poolAddress: string,
  timestamp: i32,
  volume: BigDecimal,
  fees: BigDecimal
): void {
  const dayTimestamp = timestamp - (timestamp % DAY) // Todays timestamp

  // Save pool snapshot
  const snapshotId = poolAddress + '-' + dayTimestamp.toString()
  const snapshot = PoolSnapshot.load(snapshotId)

  if (!snapshot) {
    return
  }

  snapshot.swapVolume = snapshot.swapVolume.plus(volume)
  snapshot.swapFees = snapshot.swapFees.plus(fees)
  snapshot.save()
}

export function updatePoolSnapshotToken(
  poolAddress: string,
  timestamp: i32,
  poolTokenId: string,
  amount: BigDecimal,
  balance: BigDecimal,
  feeValue: BigDecimal
): void {
  log.warning('Start create Pool Snapshot Token: {}   {}', [
    poolAddress,
    timestamp.toString()
  ])
  const dayTimestamp = timestamp - (timestamp % DAY) // Todays timestamp

  const snapshotId = poolAddress + '-' + dayTimestamp.toString()
  log.warning('Pool Snapshot Token: {} {} {} {}', [
    amount.toString(),
    balance.toString(),
    feeValue.toString(),
    snapshotId + '-' + poolTokenId
  ])
  const token = new PoolSnapshotTokenValue(snapshotId + '-' + poolTokenId)

  token.poolSnapshot = snapshotId
  token.value = amount
  token.tokenReserve = balance
  token.tokenAddress = poolTokenId
  token.feeValue = feeValue
  if (amount.lt(ZERO_BD)) {
    token.type = 'out'
  } else {
    token.type = 'in'
  }
  log.warning('Snapshot Token ID: {}', [token.id])
  token.save()
}
