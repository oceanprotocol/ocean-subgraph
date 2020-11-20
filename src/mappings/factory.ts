import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { BPoolRegistered } from '../types/Factory/Factory'
import { OceanPools, Pool } from '../types/schema'
import { Pool as PoolContract } from '../types/templates'
import {
  ZERO_BD,
} from './helpers'
import { log } from '@graphprotocol/graph-ts'

export function handleNewPool(event: BPoolRegistered): void {
  let factory = OceanPools.load('1')

  // if no factory yet, set up blank initial
  if (factory == null) {
    factory = new OceanPools('1')
    factory.color = 'Bronze'
    factory.poolCount = 0
    factory.finalizedPoolCount = 0
    factory.txCount = BigInt.fromI32(0)
    factory.totalLiquidity = ZERO_BD
    factory.totalSwapVolume = ZERO_BD
    factory.totalSwapFee = ZERO_BD
  }

  let pool = new Pool(event.params.bpoolAddress.toHexString())
  log.error('************************ handleNewPool: poolId {}', [pool.id.toString()])
  pool.controller = event.params.registeredBy
  pool.publicSwap = false
  pool.finalized = false
  pool.active = true
  pool.swapFee = BigDecimal.fromString('0.000001')
  pool.totalWeight = ZERO_BD
  pool.totalShares = ZERO_BD
  pool.totalSwapVolume = ZERO_BD
  pool.totalSwapFee = ZERO_BD
  pool.liquidity = ZERO_BD
  pool.createTime = event.block.timestamp.toI32()
  pool.tokensCount = BigInt.fromI32(0)
  pool.holdersCount = BigInt.fromI32(0)
  pool.joinsCount = BigInt.fromI32(0)
  pool.exitsCount = BigInt.fromI32(0)
  pool.swapsCount = BigInt.fromI32(0)
  pool.factoryID = event.address.toHexString()
  pool.tokensList = []
  pool.tx = event.transaction.hash
  pool.save()

  factory.poolCount = factory.poolCount + 1
  factory.save()

  PoolContract.create(event.params.bpoolAddress)
}