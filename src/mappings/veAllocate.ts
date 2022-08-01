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

  const allocateUser = getveAllocateUser(eventSender)
  const allocateId = getveAllocateId(eventId)
  const veAllocation = getveAllocation(eventSender, eventId)

  // update all entities
  const newUserAllocation = allocateUser.allocatedTotal
    .plus(allocationAmount)
    .minus(veAllocation.allocated)

  allocateUser.allocatedTotal = newUserAllocation
  const newIdAllocation = allocateId.allocatedTotal.minus(
    veAllocation.allocatedTotal
  )
  allocateId.allocatedTotal = newIdAllocation.plus(allocationAmount)
  veAllocation.allocatedTotal = allocateUser.allocatedTotal
  veAllocation.allocated = allocationAmount
  veAllocation.chainId = chainId
  veAllocation.nftAddress = nftAddress

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
