import { BigDecimal, ethereum, BigInt } from '@graphprotocol/graph-ts'
import {
  VeAllocateUser,
  VeAllocateId,
  VeAllocation,
  VeAllocationUpdate,
  VeDelegation,
  VeOCEAN,
  VeDeposit
} from '../../@types/schema'

export function getveAllocateUser(
  event: ethereum.Event,
  sender: string
): VeAllocateUser {
  let allocateUser = VeAllocateUser.load(sender)
  if (allocateUser === null) {
    allocateUser = new VeAllocateUser(sender)
    allocateUser.allocatedTotal = BigDecimal.zero()

    allocateUser.firstContact = event.block.timestamp.toI32()
    allocateUser.tx = event.transaction.hash.toHex()
    allocateUser.block = event.block.number.toI32()
    allocateUser.lastContact = 0

    allocateUser.save()
  }

  return allocateUser
}

export function getveAllocateId(
  event: ethereum.Event,
  id: string
): VeAllocateId {
  let allocateId = VeAllocateId.load(id)
  if (allocateId === null) {
    allocateId = new VeAllocateId(id)
    allocateId.allocatedTotal = BigDecimal.zero()

    allocateId.firstContact = event.block.timestamp.toI32()
    allocateId.tx = event.transaction.hash.toHex()
    allocateId.block = event.block.number.toI32()
    allocateId.lastContact = 0

    allocateId.save()
  }

  return allocateId
}

export function getveAllocation(
  event: ethereum.Event,
  sender: string,
  id: string
): VeAllocation {
  let veAllocation = VeAllocation.load(sender + '-' + id)
  if (veAllocation === null) {
    veAllocation = new VeAllocation(sender + '-' + id)
    veAllocation.allocationUser = getveAllocateUser(event, sender).id
    veAllocation.allocationId = getveAllocateId(event, id).id
    veAllocation.allocated = BigDecimal.zero()
    veAllocation.chainId = BigInt.zero()
    veAllocation.nftAddress = ''

    veAllocation.firstContact = event.block.timestamp.toI32()
    veAllocation.tx = event.transaction.hash.toHex()
    veAllocation.block = event.block.number.toI32()
    veAllocation.lastContact = 0

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

export function getveDelegation(id: string): VeDelegation {
  let veDelegation = VeDelegation.load(id)

  if (veDelegation === null) {
    veDelegation = new VeDelegation(id)
    veDelegation.cancelTime = BigInt.zero()
    veDelegation.expireTime = BigInt.zero()
    veDelegation.tokenId = BigInt.zero()
    veDelegation.amount = BigInt.zero()
    veDelegation.receiver = ''
    veDelegation.delegator = ''
    veDelegation.block = 0
    veDelegation.save()
  }
  return veDelegation
}

export function getveOCEAN(id: string): VeOCEAN {
  let ve = VeOCEAN.load(id)

  if (ve === null) {
    ve = new VeOCEAN(id)
    ve.unlockTime = BigInt.zero()
    ve.lockedAmount = BigDecimal.zero()
    ve.block = 0
    ve.save()
  }

  return ve
}

export function getDeposit(id: string): VeDeposit {
  let deposit = VeDeposit.load(id)

  if (deposit === null) {
    deposit = new VeDeposit(id)
    deposit.provider = ''
    deposit.value = BigDecimal.zero()
    deposit.unlockTime = BigInt.zero()
    deposit.type = BigInt.zero()
    deposit.timestamp = BigInt.zero()
    deposit.save()
  }
  return deposit
}
