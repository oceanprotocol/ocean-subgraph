import { AllocationSet, AllocationRemoved } from '../@types/veOcean/veOcean'
import { AllocationUpdateType } from '../../@types/schema'

import { getveAllocateUser, getveAllocateId, getveAllocation, getveAllocationUpdate } from './utils/veUtils'

export function handleAllocationSet(event: AllocationSet): void {
  // get allocation entities
  const allocateUser = getveAllocateUser(event.params.sender)
  const allocateId = getveAllocateId(event.params.id)
  const allocation = getveAllocation(event.params.sender, event.params.id)
  
  // get allocation event
  const allocationUpdate = getveAllocationUpdate(event.transaction.hash.toHex(), allocation.id)
  allocationUpdate.type = AllocationUpdateType.SET
  
  // update all entities
  allocateUser.allocatedTotal = allocateUser.allocatedTotal - allocation.allocation + event.params.allocation
  allocateId.allocatedTotal = allocateId.allocatedTotal - allocation.allocation + event.params.allocation
  allocation.allocation = event.params.allocation  
  allocationUpdate.allocation = event.params.allocation

  // save entities
  allocateUser.save()
  allocateId.save()
  allocation.save()
  allocationUpdate.save()
}

export function handleAllocationRemoved(event: AllocationRemoved): void {
  // get allocation objects
  const allocateUser = getveAllocateUser(event.params.sender)
  const allocateId = getveAllocateId(event.params.id)
  const allocation = getveAllocation(event.params.sender, event.params.id)

  // get allocation event
  const allocationUpdate = getveAllocationUpdate(event.transaction.hash.toHex(), allocation.id)
  allocationUpdate.type = AllocationUpdateType.REMOVED
  
  // update all entities
  allocateUser.allocatedTotal = allocateUser.allocatedTotal - allocation.allocation
  allocateId.allocatedTotal = allocateId.allocatedTotal - allocation.allocation
  allocation.allocation = 0
  allocationUpdate.allocation = 0
  
  // save entities
  allocateUser.save()
  allocateId.save()
  allocation.save()
  allocationUpdate.save()
}