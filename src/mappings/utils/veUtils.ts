import { veAllocateUser, veAllocateId, veAllocation, veAllocationUpdate } from '../../@types/schema'

export function getveAllocateUser(sender: string): veAllocateUser {
  let allocateUser = veAllocateUser.load(sender)
  if (allocateUser === null) {
    allocateUser = new veAllocateUser(sender)
    allocateUser.save()
  }

  return allocateUser
}

export function getveAllocateId(id: string): veAllocateId {
    let allocateId = veAllocateId.load(id)
    if (allocateId === null) {
        allocateId = new veAllocateId(id)
        allocateId.save()
    }
  
    return allocateId
  }

export function getveAllocation(sender: string, id: string): veAllocation {
    let allocation = veAllocation.load(sender+"-"+id)
    if (allocation === null) {
        allocation = new veAllocateId(sender+"-"+id)
        allocation.save()
    }
  
    return allocation
}

export function getveAllocationUpdate(tx: string, allocationId: string): veAllocation {
    let allocationUpdate = veAllocationUpdate.load(tx+"-"+allocationId)
    if (allocationUpdate === null) {
        allocationUpdate = new veAllocationUpdate(tx+"-"+allocationId)
        allocationUpdate.id = allocationId
        allocationUpdate.save()
    }

    return allocationUpdate
}