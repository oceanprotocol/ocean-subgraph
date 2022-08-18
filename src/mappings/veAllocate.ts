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
  const nftAddress = event.params.nft.toHexString()
  const chainId = event.params.chainId
  const allocationAmount = event.params.amount.toBigDecimal()
  const eventId = nftAddress + '-' + chainId.toString()

  const allocateUser = getveAllocateUser(event, eventSender)
  const allocateId = getveAllocateId(event, eventId)
  const veAllocation = getveAllocation(event, eventSender, eventId)

  // Update user allocation
  const newUserAllocation = allocateUser.allocatedTotal.minus(
    veAllocation.allocated
  )
  allocateUser.allocatedTotal = newUserAllocation.plus(allocationAmount)

  // Update id allocation
  const newIdAllocation = allocateId.allocatedTotal.minus(
    veAllocation.allocated
  )
  allocateId.allocatedTotal = newIdAllocation.plus(allocationAmount)

  veAllocation.allocated = allocationAmount
  veAllocation.chainId = chainId
  veAllocation.nftAddress = nftAddress

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
