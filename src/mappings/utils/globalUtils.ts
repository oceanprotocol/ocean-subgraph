import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  GlobalStatistic,
  GlobalTotalFixedSwapPair,
  GlobalTotalLiquidityPair,
  OPC,
  Template
} from '../../@types/schema'

const GLOBAL_ID = '1'

export function getGlobalStats(): GlobalStatistic {
  let globalStats = GlobalStatistic.load(GLOBAL_ID)
  if (!globalStats) {
    globalStats = new GlobalStatistic(GLOBAL_ID)
    globalStats.version = '3.0.1'
    globalStats.orderCount = 0
    globalStats.fixedCount = 0
    globalStats.datatokenCount = 0
    globalStats.dispenserCount = 0
    globalStats.nftCount = 0
    globalStats.save()
  }
  return globalStats
}

export function getOPC(): OPC {
  let globalStats = OPC.load(GLOBAL_ID)
  if (!globalStats) {
    globalStats = new OPC(GLOBAL_ID)
    globalStats.save()
  }
  return globalStats
}

export function getTemplates(): Template {
  let templates = Template.load(GLOBAL_ID)
  if (!templates) {
    templates = new Template(GLOBAL_ID)
    templates.save()
  }
  return templates
}

export function addOrder(): void {
  const globalStats = getGlobalStats()
  globalStats.orderCount = globalStats.orderCount + 1
  globalStats.save()
}

export function addDatatoken(): void {
  const globalStats = getGlobalStats()
  globalStats.datatokenCount = globalStats.datatokenCount + 1
  globalStats.save()
}

export function addNft(): void {
  const globalStats = getGlobalStats()
  globalStats.nftCount = globalStats.nftCount + 1
  globalStats.save()
}

export function addFixedRateExchange(): void {
  const globalStats = getGlobalStats()
  globalStats.fixedCount = globalStats.fixedCount + 1
  globalStats.save()
}

export function addDispenser(): void {
  const globalStats = getGlobalStats()
  globalStats.dispenserCount = globalStats.dispenserCount + 1
  globalStats.save()
}

export function addFixedSwap(tokenAddress: string, value: BigDecimal): void {
  let fixedSwapPair = GlobalTotalFixedSwapPair.load(tokenAddress)
  if (!fixedSwapPair) {
    fixedSwapPair = new GlobalTotalFixedSwapPair(tokenAddress)
    fixedSwapPair.globalStatistic = GLOBAL_ID
    fixedSwapPair.token = tokenAddress
    fixedSwapPair.value = BigDecimal.zero()
    fixedSwapPair.count = BigInt.zero()
  }
  fixedSwapPair.value = fixedSwapPair.value.plus(value)
  fixedSwapPair.count = fixedSwapPair.count.plus(BigInt.fromI32(1))
  fixedSwapPair.save()
}

export function addLiquidity(tokenAddress: string, value: BigDecimal): void {
  let liquidityPair = GlobalTotalLiquidityPair.load(tokenAddress)
  if (!liquidityPair) {
    liquidityPair = new GlobalTotalLiquidityPair(tokenAddress)
    liquidityPair.globalStatistic = GLOBAL_ID
    liquidityPair.token = tokenAddress
  }
  liquidityPair.value = liquidityPair.value.plus(value)

  liquidityPair.save()
}

export function removeLiquidity(tokenAddress: string, value: BigDecimal): void {
  let liquidityPair = GlobalTotalLiquidityPair.load(tokenAddress)
  if (!liquidityPair) {
    liquidityPair = new GlobalTotalLiquidityPair(tokenAddress)
    liquidityPair.globalStatistic = GLOBAL_ID
    liquidityPair.token = tokenAddress
  }
  liquidityPair.value = liquidityPair.value.minus(value)

  liquidityPair.save()
}
