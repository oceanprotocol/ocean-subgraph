import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
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
    allocateUser.allocatedTotal = BigDecimal.zero()
    allocateUser.save()
  }

  return allocateUser
}

export function getveAllocateId(id: string): VeAllocateId {
  let allocateId = VeAllocateId.load(id)
  if (allocateId === null) {
    allocateId = new VeAllocateId(id)
    allocateId.allocatedTotal = BigDecimal.zero()
    allocateId.save()
  }

  return allocateId
}

export function getveAllocation(sender: string, id: string): VeAllocation {
  let veAllocation = VeAllocation.load(sender + '-' + id)
  if (veAllocation === null) {
    veAllocation = new VeAllocation(sender + '-' + id)
    veAllocation.allocationUser = getveAllocateUser(sender).id
    veAllocation.allocationId = getveAllocateId(id).id
    veAllocation.allocatedTotal = BigDecimal.zero()
    veAllocation.allocated = BigDecimal.zero()
    veAllocation.chainId = BigInt.zero()
    veAllocation.nftAddress = ''
    veAllocation.save()
  }

  return veAllocation
}

// Pass veAllocation being updated
export function writeveAllocationUpdate(
  tx: string,
  veAllocationId: string,
  allocationType: string,
  amount: BigDecimal
): VeAllocationUpdate {
  let allocationUpdate = VeAllocationUpdate.load(tx + '-' + veAllocationId)
  if (allocationUpdate === null) {
    allocationUpdate = new VeAllocationUpdate(tx + '-' + veAllocationId)
    allocationUpdate.veAllocation = veAllocationId
    allocationUpdate.type = allocationType
    allocationUpdate.allocatedTotal = amount
    allocationUpdate.save()
  }

  return allocationUpdate
}
