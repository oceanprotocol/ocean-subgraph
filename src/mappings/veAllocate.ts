import { AllocationSet } from '../@types/veAllocate/veAllocate'

import { veAllocationUpdateType } from './utils/constants'

import {
  getveAllocateUser,
  getveAllocateId,
  getveAllocation,
  writeveAllocationUpdate
} from './utils/veUtils'

export function handleAllocationSet(event: AllocationSet): void {
  // get allocation entities
  const eventSender = event.params.sender.toHexString()
  const eventId = event.params.id.toHexString()

  const allocateUser = getveAllocateUser(event, eventSender)
  const allocateId = getveAllocateId(event, eventId)
  const veAllocation = getveAllocation(event, eventSender, eventId)
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
  veAllocation.allocatedTotal = allocateUser.allocatedTotal
  veAllocation.allocated = allocationAmount

  allocateUser.lastContact = event.block.timestamp.toI32()
  allocateId.lastContact = event.block.timestamp.toI32()
  veAllocation.lastContact = event.block.timestamp.toI32()

  // register allocation update event
  writeveAllocationUpdate(
    event,
    veAllocation.id,
    veAllocationUpdateType.SET,
    allocationAmount
  )

  // save entities
  allocateUser.save()
  allocateId.save()
  veAllocation.save()
}
