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
  getveAllocationUpdate
} from './utils/veUtils'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleAllocationSet(event: AllocationSet): void {
  // get allocation entities
  const allocateUser = getveAllocateUser(event.params.sender.toHex())
  const allocateId = getveAllocateId(event.params.id.toString())
  const allocation = getveAllocation(
    event.params.sender.toHex(),
    event.params.id.toString()
  )
  const allocationAmount = weiToDecimal(event.params.amount.toBigDecimal(), 18)

  // get allocation event
  const allocationUpdate = getveAllocationUpdate(
    event.transaction.hash.toHex(),
    allocation.id
  )
  allocationUpdate.type = veAllocationUpdateType.SET

  // update all entities
  allocateUser.allocatedTotal =
    allocateUser.allocatedTotal - allocation.allocation + allocationAmount
  allocateId.allocatedTotal =
    allocateId.allocatedTotal - allocation.allocation + allocationAmount
  allocation.allocation = allocationAmount
  allocationUpdate.allocation = allocationAmount

  // save entities
  allocateUser.save()
  allocateId.save()
  allocation.save()
  allocationUpdate.save()
}

export function handleAllocationRemoved(event: AllocationRemoved): void {
  // get allocation objects
  const allocateUser = getveAllocateUser(event.params.sender.toHex())
  const allocateId = getveAllocateId(event.params.id.toString())

  const allocation = getveAllocation(
    event.params.sender.toHex(),
    event.params.id.toString()
  )

  // get allocation event
  const allocationUpdate = getveAllocationUpdate(
    event.transaction.hash.toHex(),
    allocation.id
  )
  allocationUpdate.type = veAllocationUpdateType.REMOVED

  // update all entities
  allocateUser.allocatedTotal =
    allocateUser.allocatedTotal - allocation.allocation
  allocateId.allocatedTotal = allocateId.allocatedTotal - allocation.allocation
  allocation.allocation = BigInt.fromI32(0).toBigDecimal()
  allocationUpdate.allocation = BigInt.fromI32(0).toBigDecimal()

  // save entities
  allocateUser.save()
  allocateId.save()
  allocation.save()
  allocationUpdate.save()
}
