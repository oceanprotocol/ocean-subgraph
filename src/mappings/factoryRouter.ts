import {
  NewPool,
  TokenAdded,
  OPCFeeChanged,
  FactoryRouter
} from '../@types/FactoryRouter/FactoryRouter'
import { BigInt } from '@graphprotocol/graph-ts'
import { Pool } from '../@types/schema'
import { BPool } from '../@types/templates'
import { addPool, getOPC } from './utils/globalUtils'
import { weiToDecimal } from './utils/generic'

export function handleNewPool(event: NewPool): void {
  BPool.create(event.params.poolAddress)
  const pool = new Pool(event.params.poolAddress.toHexString())
  pool.save()
  addPool()
}

export function handleOPCFeeChanged(event: OPCFeeChanged): void {
  const opc = getOPC()
  const decimals = BigInt.fromI32(18).toI32()
  opc.swapOceanFee = weiToDecimal(
    event.params.newSwapOceanFee.toBigDecimal(),
    decimals
  )
  opc.swapNonOceanFee = weiToDecimal(
    event.params.newSwapNonOceanFee.toBigDecimal(),
    decimals
  )
  opc.consumeFee = weiToDecimal(
    event.params.newConsumeFee.toBigDecimal(),
    decimals
  )
  opc.providerFee = weiToDecimal(
    event.params.newProviderFee.toBigDecimal(),
    decimals
  )
  opc.save()
}

export function handleTokenAdded(event: TokenAdded): void {
  const contract = FactoryRouter.bind(event.address)
  const oceanFees = contract.try_getOPCFees()
  if (oceanFees.reverted) return

  const opc = getOPC()
  const decimals = BigInt.fromI32(18).toI32()
  opc.swapOceanFee = weiToDecimal(
    oceanFees.value.value0.toBigDecimal(),
    decimals
  )
  opc.swapNonOceanFee = weiToDecimal(
    oceanFees.value.value1.toBigDecimal(),
    decimals
  )

  const newConsumeFee = contract.try_getOPCConsumeFee()
  if (newConsumeFee.reverted) return

  const newProviderFee = contract.try_getOPCProviderFee()
  if (newProviderFee.reverted) return
  opc.consumeFee = weiToDecimal(newConsumeFee.value.toBigDecimal(), decimals)
  opc.providerFee = weiToDecimal(newProviderFee.value.toBigDecimal(), decimals)
  opc.save()
}
