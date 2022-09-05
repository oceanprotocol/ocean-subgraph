import {
  AllocationSet,
  AllocationSetMultiple
} from '../@types/veAllocate/veAllocate'

import { handleOneAllocation } from './utils/veUtils'

export function handleAllocationSet(event: AllocationSet): void {
  // get allocation entities
  const eventSender = event.params.sender.toHexString()
  const nftAddress = event.params.nft.toHexString()
  const chainId = event.params.chainId
  const allocationAmount = event.params.amount.toBigDecimal()

  handleOneAllocation(eventSender, nftAddress, chainId, allocationAmount, event)
}

export function handleAllocationSetMultiple(
  event: AllocationSetMultiple
): void {
  // loop
  for (let i = 0; i < event.params.nft.length; i++) {
    const eventSender = event.params.sender.toHexString()
    const nftAddress = event.params.nft[i].toHexString()
    const chainId = event.params.chainId[i]
    const allocationAmount = event.params.amount[i].toBigDecimal()
    handleOneAllocation(
      eventSender,
      nftAddress,
      chainId,
      allocationAmount,
      event
    )
  }
}
