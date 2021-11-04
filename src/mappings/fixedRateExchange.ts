import { BigInt } from '@graphprotocol/graph-ts'
import { ExchangeCreated } from '../@types/FixedRateExchange/FixedRateExchange'

import { FixedRateExchange } from '../@types/schema'

import { tokenToDecimal } from '../helpers'

export function handleExchangeCreated(event: ExchangeCreated): void {
  const fixedRateExchange = new FixedRateExchange(
    event.params.exchangeId.toHexString()
  )
  fixedRateExchange.owner = event.params.exchangeOwner.toHexString()
  fixedRateExchange.datatoken = event.params.dataToken.toHexString()
  fixedRateExchange.baseToken = event.params.baseToken.toHexString()
  // fixedRateExchange.baseTokenSymbol = getTokenSymbol(event.params.baseToken)
  fixedRateExchange.active = false

  fixedRateExchange.price = tokenToDecimal(
    event.params.fixedRate.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  fixedRateExchange.save()
}
