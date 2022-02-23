import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts'
import {
  Pool,
  PoolShare,
  PoolSnapshot,
  PoolTransaction
} from '../../@types/schema'
import { BPool } from '../../@types/templates/BPool/BPool'
import { DAY, decimal, integer } from './constants'
import { gweiToEth, weiToDecimal } from './generic'
import { getUser } from './userUtils'

export function getPoolShareId(
  poolAddress: string,
  userAddress: string
): string {
  return `${poolAddress}-${userAddress}`
}

export function getPoolTransaction(
  event: ethereum.Event,
  userAddress: string,
  type: string
): PoolTransaction {
  let poolTx = PoolTransaction.load(event.transaction.hash.toHex())

  // create pool transaction and fill basic fields
  if (poolTx === null) {
    poolTx = new PoolTransaction(event.transaction.hash.toHex())

    poolTx.user = userAddress
    poolTx.pool = event.address.toHex()
    poolTx.type = type

    poolTx.timestamp = event.block.timestamp.toI32()
    poolTx.tx = event.transaction.hash.toHex()
    poolTx.block = event.block.number.toI32()

    poolTx.gasPrice = gweiToEth(event.transaction.gasPrice.toBigDecimal())
    poolTx.gasLimit = event.transaction.gasLimit.toBigDecimal()
  }

  return poolTx
}

export function getPoolShare(
  poolAddress: string,
  userAddress: string
): PoolShare {
  let poolShare = PoolShare.load(getPoolShareId(poolAddress, userAddress))
  if (poolShare === null) {
    poolShare = new PoolShare(getPoolShareId(poolAddress, userAddress))
    poolShare.user = getUser(userAddress).id
    poolShare.pool = poolAddress
    poolShare.save()
  }
  return poolShare
}

export function getPool(poolAddress: string): Pool {
  const pool = Pool.load(poolAddress)
  if (pool === null) {
    // what now?
    throw new Error(`Didn't find pool with address ${poolAddress} `)
  }
  return pool
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
    Address.fromString(datatokenAddress),
    integer.ZERO
  ).value
  const price = weiToDecimal(weiPrice.toBigDecimal(), baseTokenDecimals)

  return price
}

export function getDateFromTimestamp(timestamp: i32): i32 {
  // date without time
  return timestamp - (timestamp % DAY)
}
export function getPoolSnapshotId(poolAddress: string, timestamp: i32): string {
  return `${poolAddress}-${getDateFromTimestamp(timestamp)}`
}

export function createPoolSnapshot(
  poolAddress: string,
  timestamp: i32
): PoolSnapshot {
  const snapshotId = getPoolSnapshotId(poolAddress, timestamp)

  const pool = getPool(poolAddress)
  const snapshot = new PoolSnapshot(snapshotId)

  snapshot.pool = poolAddress

  snapshot.totalShares = pool.totalShares
  snapshot.swapVolume = decimal.ZERO
  snapshot.swapFees = decimal.ZERO
  snapshot.baseToken = pool.baseToken
  snapshot.datatoken = pool.datatoken
  snapshot.datatokenLiquidity = decimal.ZERO

  snapshot.date = getDateFromTimestamp(timestamp)
  snapshot.spotPrice = pool.spotPrice

  snapshot.save()
  return snapshot
}

export function getPoolSnapshot(
  poolAddress: string,
  timestamp: i32
): PoolSnapshot {
  let snapshot = PoolSnapshot.load(getPoolSnapshotId(poolAddress, timestamp))
  if (snapshot === null) {
    snapshot = createPoolSnapshot(poolAddress, timestamp)
  }

  return snapshot
}
