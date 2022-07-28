import {
  VeAllocateUser,
  VeAllocateId,
  VeAllocation,
  VeAllocationUpdate
} from '../../@types/schema'

export function getveAllocateUser(sender: string): VeAllocateUser {
  let allocateUser = VeAllocateUser.load(sender)
  if (allocateUser === null) {
    allocateUser = new VeAllocateUser(sender)
    allocateUser.save()
  }

  return allocateUser
}

export function getveAllocateId(id: string): VeAllocateId {
  let allocateId = VeAllocateId.load(id)
  if (allocateId === null) {
    allocateId = new VeAllocateId(id)
    allocateId.save()
  }

  return allocateId
}

export function getveAllocation(sender: string, id: string): VeAllocation {
  let allocation = VeAllocation.load(sender + '-' + id)
  if (allocation === null) {
    allocation = new VeAllocation(sender + '-' + id)
    allocation.save()
  }

  return allocation
}

export function getveAllocationUpdate(
  tx: string,
  allocationId: string
): VeAllocationUpdate {
  let allocationUpdate = VeAllocationUpdate.load(tx + '-' + allocationId)
  if (allocationUpdate === null) {
    allocationUpdate = new VeAllocationUpdate(tx + '-' + allocationId)
    allocationUpdate.id = allocationId
    allocationUpdate.save()
  }

  return allocationUpdate
}
