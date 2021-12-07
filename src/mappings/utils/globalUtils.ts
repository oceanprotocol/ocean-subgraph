import { BigDecimal } from '@graphprotocol/graph-ts'
import { GlobalStats } from '../../@types/schema'

const GLOBAL_ID = '1'

export function getGlobalStats(): GlobalStats {
  let globalStats = GlobalStats.load(GLOBAL_ID)
  if (!globalStats) globalStats = new GlobalStats(GLOBAL_ID)
  return globalStats
}

export function addSwap(tokenAddress: string, value: BigDecimal): void {
  const globalStats = getGlobalStats()

  globalStats.save()
}
