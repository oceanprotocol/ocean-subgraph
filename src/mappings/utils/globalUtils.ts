import { BigDecimal } from '@graphprotocol/graph-ts'
import { GlobalStats } from '../../@types/schema'
import { integer } from './constants'

const GLOBAL_ID = '1'

export function getGlobalStats(): GlobalStats {
  let globalStats = GlobalStats.load(GLOBAL_ID)
  if (!globalStats) {
    globalStats = new GlobalStats(GLOBAL_ID)
    globalStats.save()
  }
  return globalStats
}
export function addOrder(): void {
  const globalStats = getGlobalStats()
  globalStats.orderCount = globalStats.orderCount.plus(integer.ONE)
  globalStats.save()
}

export function addDatatoken(): void {
  const globalStats = getGlobalStats()
  globalStats.datatokenCount = globalStats.datatokenCount.plus(integer.ONE)
  globalStats.save()
}

export function addNft(): void {
  const globalStats = getGlobalStats()
  globalStats.nftCount = globalStats.nftCount.plus(integer.ONE)
  globalStats.save()
}

export function addFixedRateExchange(): void {
  const globalStats = getGlobalStats()
  globalStats.fixedCount = globalStats.fixedCount.plus(integer.ONE)
  globalStats.save()
}

export function addDispenser(): void {
  const globalStats = getGlobalStats()
  globalStats.dispenserCount = globalStats.dispenserCount.plus(integer.ONE)
  globalStats.save()
}

export function addPool(): void {
  const globalStats = getGlobalStats()
  globalStats.poolCount = globalStats.poolCount.plus(integer.ONE)
  globalStats.save()
}

export function addSwap(tokenAddress: string, value: BigDecimal): void {
  const globalStats = getGlobalStats()

  globalStats.save()
}
