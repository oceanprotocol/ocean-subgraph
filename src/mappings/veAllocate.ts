import {
  AllocationSet,
  AllocationRemoved
} from '../@types/veAllocate/veAllocate'

import { weiToDecimal } from './utils/generic'
import { veAllocationUpdateType } from './utils/constants'

import {
  getveAllocateUser,
  getveAllocateId,
  getveAllocation,
  writeveAllocationUpdate
} from './utils/veUtils'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export function handleAllocationSet(event: AllocationSet): void {
  // get allocation entities
  const allocateUser = getveAllocateUser(event.params.sender.toHexString())
  const allocateId = getveAllocateId(event.params.id.toHexString())
  const veAllocation = getveAllocation(
    event.params.sender.toHexString(),
    event.params.id.toHexString()
  )
  const allocationAmount = weiToDecimal(event.params.amount.toBigDecimal(), 18)

  // // get allocation event
  const allocationUpdate = writeveAllocationUpdate(
    event.transaction.hash.toHex(),
    veAllocation.id,
    veAllocationUpdateType.SET,
    allocationAmount,
  )

  // update all entities  
  let newUserAllocation : BigDecimal = allocateUser.allocatedTotal.minus(veAllocation.allocatedTotal)
  newUserAllocation = newUserAllocation.plus(allocationAmount)
  allocateUser.allocatedTotal = newUserAllocation
  
  let newIdAllocation : BigDecimal = allocateId.allocatedTotal.minus(veAllocation.allocatedTotal)
  newIdAllocation = newIdAllocation.plus(allocationAmount)
  allocateId.allocatedTotal = newIdAllocation
  
  veAllocation.allocatedTotal = allocationAmount
  // allocationUpdate.allocatedTotal = allocationAmount

  // save entities
  allocateUser.save()
  allocateId.save()
  veAllocation.save()
  // allocationUpdate.save()
}

export function handleAllocationRemoved(event: AllocationRemoved): void {
  // get allocation objects
  const allocateUser = getveAllocateUser(event.params.sender.toHexString())
  const allocateId = getveAllocateId(event.params.id.toHexString())
  const veAllocation = getveAllocation(
    event.params.sender.toHexString(),
    event.params.id.toHexString()
  )

  // // get allocation event
  const allocationUpdate = writeveAllocationUpdate(
    event.transaction.hash.toHex(),
    veAllocation.id,
    veAllocationUpdateType.REMOVED,
    BigInt.fromI32(0).toBigDecimal()
  )

  // update all entities
  let newUserAllocation : BigDecimal = allocateUser.allocatedTotal.minus(veAllocation.allocatedTotal)
  allocateUser.allocatedTotal = newUserAllocation
  
  let newIdAllocation : BigDecimal = allocateId.allocatedTotal.minus(veAllocation.allocatedTotal)
  allocateId.allocatedTotal = newIdAllocation

  veAllocation.allocatedTotal = BigInt.fromI32(0).toBigDecimal()
  // allocationUpdate.allocatedTotal = BigInt.fromI32(0).toBigDecimal()

  // save entities
  allocateUser.save()
  allocateId.save()
  veAllocation.save()
  // allocationUpdate.save()
}
