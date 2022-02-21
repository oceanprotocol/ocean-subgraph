import { FixedRateExchange } from '../../@types/schema'

import { FixedRateExchange as FixedRateExchangeContract } from '../../@types/templates/FixedRateExchange/FixedRateExchange'
import { Address, Bytes } from '@graphprotocol/graph-ts'
import { getToken } from './tokenUtils'
import { weiToDecimal } from './generic'

export function getFixedRateGraphID(
  exchangeId: string,
  contractAddress: Address
): string {
  return contractAddress.toHexString() + '-' + exchangeId
}

export function getFixedRateExchange(fixedRateId: string): FixedRateExchange {
  let fixedRateExhange = FixedRateExchange.load(fixedRateId)
  if (fixedRateExhange === null) {
    fixedRateExhange = new FixedRateExchange(fixedRateId)
    // TODO: get data from contract and fill in new fixed rate exchange, this is just a worst case scenario. We shouldn't reach this code
    fixedRateExhange.save()
  }

  return fixedRateExhange
}

export function updateFixedRateExchangeSupply(
  exchangeId: Bytes,
  contractAddress: Address
): void {
  const fixedRateID =
    contractAddress.toHexString() + '-' + exchangeId.toHexString()
  const fixedRateExchange = getFixedRateExchange(fixedRateID)
  const contract = FixedRateExchangeContract.bind(contractAddress)
  const fixedRateDetails = contract.try_getExchange(exchangeId)
  if (fixedRateDetails == null) return
  const baseToken = getToken(fixedRateDetails.value.value3, false)
  const datatoken = getToken(fixedRateDetails.value.value1, true)
  fixedRateExchange.datatokenBalance = weiToDecimal(
    fixedRateDetails.value.value9.toBigDecimal(),
    datatoken.decimals
  )
  fixedRateExchange.baseTokenBalance = weiToDecimal(
    fixedRateDetails.value.value10.toBigDecimal(),
    baseToken.decimals
  )
  fixedRateExchange.datatokenSupply = weiToDecimal(
    fixedRateDetails.value.value7.toBigDecimal(),
    datatoken.decimals
  )
  fixedRateExchange.baseTokenSupply = weiToDecimal(
    fixedRateDetails.value.value8.toBigDecimal(),
    baseToken.decimals
  )
  fixedRateExchange.save()
}

export function getUpdateOrSwapId(
  txAddress: string,
  exchangeId: string
): string {
  return `${txAddress}-${exchangeId}`
}
