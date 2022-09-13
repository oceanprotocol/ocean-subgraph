import { Nft, NftUpdate } from '../@types/schema'
import {
  MetadataCreated,
  MetadataState,
  MetadataUpdated,
  TokenURIUpdate,
  AddedManager,
  AddedTo725StoreList,
  AddedToCreateERC20List,
  AddedToMetadataList,
  RemovedFrom725StoreList,
  RemovedFromCreateERC20List,
  RemovedFromMetadataList,
  RemovedManager,
  CleanedPermissions,
  Transfer
} from '../@types/templates/ERC721Template/ERC721Template'
import { NftUpdateType } from './utils/constants'
import { getNftToken, getNftTokenWithID } from './utils/tokenUtils'
import { getUser } from './utils/userUtils'

function getId(tx: string, nftAddress: string): string {
  return `${tx}-${nftAddress}`
}

export function handleMetadataCreated(event: MetadataCreated): void {
  const nftAddress = event.address.toHex()
  const nft = Nft.load(nftAddress)
  if (!nft) return

  nft.assetState = event.params.state
  nft.providerUrl = event.params.decryptorUrl.toString()
  nft.hasMetaData = true

  const nftUpdate = new NftUpdate(
    getId(event.transaction.hash.toHex(), nftAddress)
  )

  nftUpdate.type = NftUpdateType.METADATA_CREATED
  nftUpdate.userAddress = event.params.createdBy.toHex()
  nftUpdate.assetState = event.params.state

  nftUpdate.nft = nft.id
  nftUpdate.providerUrl = nft.providerUrl
  nftUpdate.tokenUri = nft.tokenUri

  nftUpdate.timestamp = event.block.timestamp.toI32()
  nftUpdate.tx = event.transaction.hash.toHex()
  nftUpdate.block = event.block.number.toI32()

  nftUpdate.save()
  nft.save()
}

export function handleMetadataUpdated(event: MetadataUpdated): void {
  const nftAddress = event.address.toHex()
  const nft = Nft.load(nftAddress)
  if (!nft) return

  nft.assetState = event.params.state
  nft.hasMetaData = true
  const nftUpdate = new NftUpdate(
    getId(event.transaction.hash.toHex(), nftAddress)
  )

  nftUpdate.nft = nft.id
  nftUpdate.type = NftUpdateType.METADATA_UPDATED
  nftUpdate.userAddress = event.params.updatedBy.toHex()
  nftUpdate.assetState = event.params.state

  nftUpdate.timestamp = event.block.timestamp.toI32()
  nftUpdate.tx = event.transaction.hash.toHex()
  nftUpdate.block = event.block.number.toI32()

  nftUpdate.save()
  nft.save()
}

export function handleMetadataState(event: MetadataState): void {
  const nftAddress = event.address.toHex()
  const nft = Nft.load(nftAddress)
  if (!nft) return

  nft.assetState = event.params.state

  const nftUpdate = new NftUpdate(
    getId(event.transaction.hash.toHex(), nftAddress)
  )

  nftUpdate.nft = nft.id
  nftUpdate.type = NftUpdateType.STATE_UPDATED
  nftUpdate.userAddress = event.params.updatedBy.toHex()
  nftUpdate.assetState = event.params.state

  nftUpdate.timestamp = event.block.timestamp.toI32()
  nftUpdate.tx = event.transaction.hash.toHex()
  nftUpdate.block = event.block.number.toI32()

  nftUpdate.save()
  nft.save()
}

export function handleTokenUriUpdate(event: TokenURIUpdate): void {
  const nftAddress = event.address.toHex()
  const nft = Nft.load(nftAddress)

  if (!nft) return

  nft.tokenUri = event.params.tokenURI.toString()

  const nftUpdate = new NftUpdate(
    getId(event.transaction.hash.toHex(), nftAddress)
  )
  nftUpdate.nft = nft.id
  nftUpdate.type = NftUpdateType.TOKENURI_UPDATED
  nftUpdate.userAddress = event.params.updatedBy.toHex()
  nftUpdate.tokenUri = nft.tokenUri
  nftUpdate.timestamp = event.block.timestamp.toI32()
  nftUpdate.tx = event.transaction.hash.toHex()
  nftUpdate.block = event.block.number.toI32()

  nftUpdate.save()
  nft.save()
}

// roles
export function handleAddedManager(event: AddedManager): void {
  const nft = getNftToken(event.address)
  let existingRoles: string[]
  if (!nft.managerRole) existingRoles = []
  else existingRoles = nft.managerRole as string[]
  if (!existingRoles.includes(event.params.user.toHexString()))
    existingRoles.push(event.params.user.toHexString())
  nft.managerRole = existingRoles
  nft.save()
}
export function handleRemovedManager(event: RemovedManager): void {
  const nft = getNftToken(event.address)
  const newList: string[] = []
  let existingRoles: string[]
  if (!nft.managerRole) existingRoles = []
  else existingRoles = nft.managerRole as string[]
  if (!existingRoles || existingRoles.length < 1) return
  while (existingRoles.length > 0) {
    const role = existingRoles.shift().toString()
    if (!role) break
    if (role !== event.params.user.toHexString()) newList.push(role)
  }
  nft.managerRole = newList
  nft.save()
}

// storeUpdater
export function handleAddedTo725StoreList(event: AddedTo725StoreList): void {
  const nft = getNftToken(event.address)
  let existingRoles: string[]
  if (!nft.storeUpdateRole) existingRoles = []
  else existingRoles = nft.storeUpdateRole as string[]
  if (!existingRoles.includes(event.params.user.toHexString()))
    existingRoles.push(event.params.user.toHexString())
  nft.storeUpdateRole = existingRoles
  nft.save()
}

export function handleRemovedFrom725StoreList(
  event: RemovedFrom725StoreList
): void {
  const nft = getNftToken(event.address)
  const newList: string[] = []
  let existingRoles: string[]
  if (!nft.storeUpdateRole) existingRoles = []
  else existingRoles = nft.storeUpdateRole as string[]
  if (!existingRoles || existingRoles.length < 1) return
  while (existingRoles.length > 0) {
    const role = existingRoles.shift().toString()
    if (!role) break
    if (role !== event.params.user.toHexString()) newList.push(role)
  }
  nft.storeUpdateRole = newList
  nft.save()
}

// erc20Deployer
export function handleAddedToCreateERC20List(
  event: AddedToCreateERC20List
): void {
  const nft = getNftToken(event.address)
  let existingRoles: string[]
  if (!nft.erc20DeployerRole) existingRoles = []
  else existingRoles = nft.erc20DeployerRole as string[]
  if (!existingRoles.includes(event.params.user.toHexString()))
    existingRoles.push(event.params.user.toHexString())
  nft.erc20DeployerRole = existingRoles
  nft.save()
}

export function handleRemovedFromCreateERC20List(
  event: RemovedFromCreateERC20List
): void {
  const nft = getNftToken(event.address)
  const newList: string[] = []
  let existingRoles: string[]
  if (!nft.erc20DeployerRole) existingRoles = []
  else existingRoles = nft.erc20DeployerRole as string[]
  if (!existingRoles || existingRoles.length < 1) return
  while (existingRoles.length > 0) {
    const role = existingRoles.shift().toString()
    if (!role) break
    if (role !== event.params.user.toHexString()) newList.push(role)
  }
  nft.erc20DeployerRole = newList
  nft.save()
}

// metadata updater
export function handleAddedToMetadataList(event: AddedToMetadataList): void {
  const nft = getNftToken(event.address)
  let existingRoles: string[]
  if (!nft.metadataRole) existingRoles = []
  else existingRoles = nft.metadataRole as string[]
  if (!existingRoles.includes(event.params.user.toHexString()))
    existingRoles.push(event.params.user.toHexString())
  nft.metadataRole = existingRoles
  nft.save()
}

export function handleRemovedFromMetadataList(
  event: RemovedFromMetadataList
): void {
  const nft = getNftToken(event.address)
  const newList: string[] = []
  let existingRoles: string[]
  if (!nft.metadataRole) existingRoles = []
  else existingRoles = nft.metadataRole as string[]
  if (!existingRoles || existingRoles.length < 1) return
  while (existingRoles.length > 0) {
    const role = existingRoles.shift().toString()
    if (!role) break
    if (role !== event.params.user.toHexString()) newList.push(role)
  }
  nft.metadataRole = newList
  nft.save()
}

export function handleCleanedPermissions(event: CleanedPermissions): void {
  const nft = getNftToken(event.address)
  const newList: string[] = []
  nft.metadataRole = newList
  nft.erc20DeployerRole = newList
  nft.storeUpdateRole = newList
  nft.managerRole = newList
  nft.save()
}

export function handleNftTransferred(event: Transfer): void {
  const id = event.address.toHex()
  const nft = getNftTokenWithID(id)
  const newOwner = getUser(event.params.to.toHexString())
  nft.owner = newOwner.id

  nft.save()
}
