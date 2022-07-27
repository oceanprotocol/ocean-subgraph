import { log } from '@graphprotocol/graph-ts'
import {
  NewPool,
  SSContractAdded,
  SSContractRemoved,
  FixedRateContractAdded,
  FixedRateContractRemoved,
  DispenserContractAdded,
  DispenserContractRemoved
} from '../@types/FactoryRouter/FactoryRouter'
import { Pool } from '../@types/schema'
import { BPool, FixedRateExchange, Dispenser } from '../@types/templates'
import { addPool, getTemplates } from './utils/globalUtils'

export function handleNewPool(event: NewPool): void {
  BPool.create(event.params.poolAddress)
  log.error('POOL START CREATE', [])
  const pool = new Pool(event.params.poolAddress.toHexString())
  pool.save()
  log.error('POOL CREATED', [])
  addPool()
}

export function handleSSContractAdded(event: SSContractAdded): void {
  // add token to approvedTokens
  const templates = getTemplates()
  let existingContracts: string[]
  if (!templates.ssTemplates) existingContracts = []
  else existingContracts = templates.ssTemplates as string[]
  if (!existingContracts.includes(event.params.contractAddress.toHexString()))
    existingContracts.push(event.params.contractAddress.toHexString())
  templates.ssTemplates = existingContracts
  templates.save()
}
export function handleSSContractRemoved(event: SSContractRemoved): void {
  const templates = getTemplates()
  const newList: string[] = []
  let existingContracts: string[]
  if (!templates.ssTemplates) existingContracts = []
  else existingContracts = templates.ssTemplates as string[]
  if (!existingContracts || existingContracts.length < 1) return
  while (existingContracts.length > 0) {
    const role = existingContracts.shift().toString()
    if (!role) break
    if (role !== event.params.contractAddress.toHexString()) newList.push(role)
  }
  templates.ssTemplates = newList
  templates.save()
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
