import {
  NewPool,
  TokenAdded,
  TokenRemoved,
  OPCFeeChanged,
  FactoryRouter,
  FixedRateContractAdded,
  FixedRateContractRemoved,
  DispenserContractAdded,
  DispenserContractRemoved
} from '../@types/FactoryRouter/FactoryRouter'
import { BigInt } from '@graphprotocol/graph-ts'
import { Pool } from '../@types/schema'
import { BPool, FixedRateExchange, Dispenser } from '../@types/templates'
import { addPool, getOPC, getTemplates } from './utils/globalUtils'
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

  // add token to approvedTokens
  let existingTokens: string[]
  if (!opc.approvedTokens) existingTokens = []
  else existingTokens = opc.approvedTokens as string[]
  if (!existingTokens.includes(event.params.token.toHexString()))
    existingTokens.push(event.params.token.toHexString())
  opc.approvedTokens = existingTokens

  opc.save()
}

export function handleTokenRemoved(event: TokenRemoved): void {
  const opc = getOPC()
  const newList: string[] = []
  let existingTokens: string[]
  if (!opc.approvedTokens) existingTokens = []
  else existingTokens = opc.approvedTokens as string[]
  if (!existingTokens || existingTokens.length < 1) return
  while (existingTokens.length > 0) {
    const role = existingTokens.shift().toString()
    if (!role) break
    if (role !== event.params.token.toHexString()) newList.push(role)
  }
  opc.approvedTokens = newList
  opc.save()
}

export function handleFixedRateContractAdded(
  event: FixedRateContractAdded
): void {
  FixedRateExchange.create(event.params.contractAddress)
  // add token to approvedTokens
  const templates = getTemplates()
  let existingContracts: string[]
  if (!templates.fixedRateTemplates) existingContracts = []
  else existingContracts = templates.fixedRateTemplates as string[]
  if (!existingContracts.includes(event.params.contractAddress.toHexString()))
    existingContracts.push(event.params.contractAddress.toHexString())
  templates.fixedRateTemplates = existingContracts
  templates.save()
}
export function handleFixedRateContractRemoved(
  event: FixedRateContractRemoved
): void {
  const templates = getTemplates()
  const newList: string[] = []
  let existingContracts: string[]
  if (!templates.fixedRateTemplates) existingContracts = []
  else existingContracts = templates.fixedRateTemplates as string[]
  if (!existingContracts || existingContracts.length < 1) return
  while (existingContracts.length > 0) {
    const role = existingContracts.shift().toString()
    if (!role) break
    if (role !== event.params.contractAddress.toHexString()) newList.push(role)
  }
  templates.fixedRateTemplates = newList
  templates.save()
}
export function handleDispenserContractAdded(
  event: DispenserContractAdded
): void {
  Dispenser.create(event.params.contractAddress)

  const templates = getTemplates()
  let existingContracts: string[]
  if (!templates.dispenserTemplates) existingContracts = []
  else existingContracts = templates.dispenserTemplates as string[]
  if (!existingContracts.includes(event.params.contractAddress.toHexString()))
    existingContracts.push(event.params.contractAddress.toHexString())
  templates.dispenserTemplates = existingContracts
  templates.save()
}
export function handleDispenserContractRemoved(
  event: DispenserContractRemoved
): void {
  const templates = getTemplates()
  const newList: string[] = []
  let existingContracts: string[]
  if (!templates.dispenserTemplates) existingContracts = []
  else existingContracts = templates.dispenserTemplates as string[]
  if (!existingContracts || existingContracts.length < 1) return
  while (existingContracts.length > 0) {
    const role = existingContracts.shift().toString()
    if (!role) break
    if (role !== event.params.contractAddress.toHexString()) newList.push(role)
  }
  templates.dispenserTemplates = newList
  templates.save()
}
