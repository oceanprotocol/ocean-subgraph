import { FixedRateExchange } from '../../@types/schema'

export function getFixedRateExchange(exchangeId: string): FixedRateExchange {
  let fixedRateExhange = FixedRateExchange.load(exchangeId)
  if (fixedRateExhange === null) {
    fixedRateExhange = new FixedRateExchange(exchangeId)
    // TODO: get data from contract and fill in new fixed rate exchange, this is just a worst case scenario. We shouldn't reach this code
    fixedRateExhange.save()
  }

  return fixedRateExhange
}

export function getUpdateOrSwapId(
  txAddress: string,
  exchangeId: string
): string {
  return `${txAddress}-${exchangeId}`
}
