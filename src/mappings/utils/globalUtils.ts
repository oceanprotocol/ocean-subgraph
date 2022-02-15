import { BigDecimal } from '@graphprotocol/graph-ts'
import { GlobalStatistic } from '../../@types/schema'

const GLOBAL_ID = '1'

export function getGlobalStats(): GlobalStatistic {
  let globalStats = GlobalStatistic.load(GLOBAL_ID)
  if (!globalStats) {
    globalStats = new GlobalStatistic(GLOBAL_ID)
    globalStats.save()
  }
  return globalStats
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

export function addPool(): void {
  const globalStats = getGlobalStats()
  globalStats.poolCount = globalStats.poolCount + 1
  globalStats.save()
}

export function addSwap(tokenAddress: string, value: BigDecimal): void {
  const globalStats = getGlobalStats()

  globalStats.save()
}
