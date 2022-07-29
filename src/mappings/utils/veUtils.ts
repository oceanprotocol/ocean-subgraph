import { BigDecimal, ethereum } from '@graphprotocol/graph-ts'
import {
  VeAllocateUser,
  VeAllocateId,
  VeAllocation,
  VeAllocationUpdate
} from '../../@types/schema'

export function getveAllocateUser(event: ethereum.Event, sender: string): VeAllocateUser {
  let allocateUser = VeAllocateUser.load(sender)
  if (allocateUser === null) {
    allocateUser = new VeAllocateUser(sender)
    allocateUser.allocatedTotal = BigDecimal.zero()

    allocateUser.firstContact = event.block.timestamp.toI32()
    allocateUser.tx = event.transaction.hash.toHex()
    allocateUser.block = event.block.number.toI32()

    allocateUser.save()
  }

  return allocateUser
}

export function getveAllocateId(event: ethereum.Event, id: string): VeAllocateId {
  let allocateId = VeAllocateId.load(id)
  if (allocateId === null) {
    allocateId = new VeAllocateId(id)
    allocateId.allocatedTotal = BigDecimal.zero()

    allocateId.firstContact = event.block.timestamp.toI32()
    allocateId.tx = event.transaction.hash.toHex()
    allocateId.block = event.block.number.toI32()

    allocateId.save()
  }

  return allocateId
}

export function getveAllocation(event: ethereum.Event, sender: string, id: string): VeAllocation {
  let veAllocation = VeAllocation.load(sender + '-' + id)
  if (veAllocation === null) {
    veAllocation = new VeAllocation(sender + '-' + id)
    veAllocation.allocationUser = getveAllocateUser(sender).id
    veAllocation.allocationId = getveAllocateId(id).id
    veAllocation.allocatedTotal = BigDecimal.zero()
    veAllocation.allocated = BigDecimal.zero()

    veAllocation.firstContact = event.block.timestamp.toI32()
    veAllocation.tx = event.transaction.hash.toHex()
    veAllocation.block = event.block.number.toI32()

    veAllocation.save()
  }

  return veAllocation
}

// Pass veAllocation being updated
export function writeveAllocationUpdate(
  event: ethereum.Event,
  veAllocationId: string,
  allocationType: string,
  amount: BigDecimal
): VeAllocationUpdate {
  const tx = event.transaction.hash.toHex()
  let allocationUpdate = VeAllocationUpdate.load(tx + '-' + veAllocationId)
  if (allocationUpdate === null) {
    allocationUpdate = new VeAllocationUpdate(tx + '-' + veAllocationId)
    allocationUpdate.veAllocation = veAllocationId
    allocationUpdate.type = allocationType
    allocationUpdate.allocatedTotal = amount

    allocationUpdate.timestamp = event.block.timestamp.toI32()
    allocationUpdate.tx = event.transaction.hash.toHex()
    allocationUpdate.block = event.block.number.toI32()

    allocationUpdate.save()
  }

  return allocationUpdate
}
