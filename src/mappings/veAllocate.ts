import {
  AllocationSet,
  AllocationRemoved
} from '../@types/veAllocate/veAllocate'

import { veAllocationUpdateType } from './utils/constants'

import {
  getveAllocateUser,
  getveAllocateId,
  getveAllocation,
  writeveAllocationUpdate
} from './utils/veUtils'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleAllocationSet(event: AllocationSet): void {
  // get allocation entities
  const eventSender = event.params.sender.toHexString()
  const eventId = event.params.id.toHexString()

  const allocateUser = getveAllocateUser(eventSender)
  const allocateId = getveAllocateId(eventId)
  const veAllocation = getveAllocation(eventSender, eventId)
  const allocationAmount = event.params.amount.toBigDecimal()

  // update all entities
  const newUserAllocation = allocateUser.allocatedTotal.minus(
    veAllocation.allocatedTotal
  )
  allocateUser.allocatedTotal = newUserAllocation.plus(allocationAmount)
  const newIdAllocation = allocateId.allocatedTotal.minus(
    veAllocation.allocatedTotal
  )
  allocateId.allocatedTotal = newIdAllocation.plus(allocationAmount)
  veAllocation.allocatedTotal = allocationAmount

  // register allocation update event
  writeveAllocationUpdate(
    event.transaction.hash.toHex(),
    veAllocation.id,
    veAllocationUpdateType.SET,
    allocationAmount
  )

  // save entities
  allocateUser.save()
  allocateId.save()
  veAllocation.save()
}

export function handleAllocationRemoved(event: AllocationRemoved): void {
  // get allocation objects
  const allocateUser = getveAllocateUser(event.params.sender.toHexString())
  const allocateId = getveAllocateId(event.params.id.toHexString())
  const veAllocation = getveAllocation(
    event.params.sender.toHexString(),
    event.params.id.toHexString()
  )

  // update all entities
  allocateUser.allocatedTotal = allocateUser.allocatedTotal.minus(
    veAllocation.allocatedTotal
  )
  allocateId.allocatedTotal = allocateId.allocatedTotal.minus(
    veAllocation.allocatedTotal
  )
  veAllocation.allocatedTotal = BigInt.fromI32(0).toBigDecimal()

  // register allocation update event
  writeveAllocationUpdate(
    event.transaction.hash.toHex(),
    veAllocation.id,
    veAllocationUpdateType.REMOVED,
    BigInt.fromI32(0).toBigDecimal()
  )

  // save entities
  allocateUser.save()
  allocateId.save()
  veAllocation.save()
}
