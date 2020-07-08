import { ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  Approval as ApprovalEvent,
  CategoryCreated as CategoryCreatedEvent,
  ItemCoverUpdated as ItemCoverUpdatedEvent,
  ItemCreated as ItemCreatedEvent,
  ItemFilesUpdated as ItemFilesUpdatedEvent,
  ItemUpdated as ItemUpdatedEvent,
  LinkUpdated as LinkUpdatedEvent,
  SetARWallet as SetARWalletEvent,
  SetItemOwner as SetItemOwnerEvent,
  SetOwner as SetOwnerEvent,
  SetOwnerShare as SetOwnerShareEvent,
  Transfer as TransferEvent,
  ChildParentVote as ChildParentVoteEvent,
  CategoryScoreVote as CategoryScoreVoteEvent
} from "../generated/Contract/Contract"
import {
  Approval,
  CategoryCreated,
  ItemCoverUpdated,
  ItemCreated,
  ItemFilesUpdated,
  ItemUpdated,
  LinkUpdated,
  SetARWallet,
  SetItemOwner,
  SetOwner,
  SetOwnerShare,
  Transfer,
  ChildParentVote,
  CategoryScoreVote,
} from "../generated/schema"

function generateId(event: ethereum.Event): String {
  let index = event.transaction.index.toHex().substring(2)
  index = '0x' + index.padStart(64, '0');
  return index + "-" + event.logIndex.toString() + "-" + event.transaction.hash.toHex();
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    generateId(event)
  )
  entity._spender = event.params._spender
  entity._value = event.params._value
  entity.save()
}

export function handleCategoryCreated(event: CategoryCreatedEvent): void {
  let entity = new CategoryCreated(
    generateId(event)
  )
  entity.categoryId = event.params.categoryId
  entity.title = event.params.title
  entity.locale = event.params.locale
  entity.save()
}

export function handleCoverItemUpdated(event: ItemCoverUpdatedEvent): void {
  let entity = new ItemCoverUpdated(
    generateId(event)
  )
  entity.itemId = event.params.itemId
  entity.version = event.params.version
  entity.cover = event.params.cover
  entity.width = event.params.width
  entity.height = event.params.height
  entity.save()
}

export function handleItemCreated(event: ItemCreatedEvent): void {
  let entity = new ItemCreated(
    generateId(event)
  )
  entity.itemId = event.params.itemId
  entity.save()
}

export function handleItemFilesUpdated(event: ItemFilesUpdatedEvent): void {
  let entity = new ItemFilesUpdated(
    generateId(event)
  )
  entity.itemId = event.params.itemId
  entity.format = event.params.format
  entity.version = event.params.version
  entity.hash = event.params.hash
  entity.save()
}

export function handleItemUpdated(event: ItemUpdatedEvent): void {
  let entity = new ItemUpdated(
    generateId(event)
  )
  entity.itemId = event.params.itemId
  entity.title = event.params.title
  entity.description = event.params.description
  entity.priceETH = event.params.priceETH
  entity.priceAR = event.params.priceAR
  entity.locale = event.params.locale
  entity.license = event.params.license
  entity.save()
}

export function handleLinkUpdated(event: LinkUpdatedEvent): void {
  let entity = new LinkUpdated(
    generateId(event)
  )
  entity.linkId = event.params.linkId
  entity.link = event.params.link
  entity.title = event.params.title
  entity.description = event.params.description
  entity.locale = event.params.locale
  entity.save()
}

export function handleSetARWallet(event: SetARWalletEvent): void {
  let entity = new SetARWallet(
    generateId(event)
  )
  entity.owner = event.params.owner
  entity.arWallet = event.params.arWallet
  entity.save()
}

export function handleSetItemOwner(event: SetItemOwnerEvent): void {
  let entity = new SetItemOwner(
    generateId(event)
  )
  entity.itemId = event.params.itemId
  entity.owner = event.params.owner
  entity.save()
}

export function handleSetOwner(event: SetOwnerEvent): void {
  let entity = new SetOwner(
    generateId(event)
  )
  entity.owner = event.params.owner
  entity.save()
}

export function handleSetOwnerShare(event: SetOwnerShareEvent): void {
  let entity = new SetOwnerShare(
    generateId(event)
  )
  entity.share = event.params.share
  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    generateId(event)
  )
  entity._from = event.params._from
  entity._to = event.params._to
  entity._value = event.params._value
  entity.save()
}

export function handleChildParentVote(event: ChildParentVoteEvent): void {
  let entity = new ChildParentVote(
    generateId(event)
  )
  entity.child = event.params.child
  entity.parent = event.params.parent
  entity.value = event.params.value
  entity.save()
}

export function handleCategoryScoreVote(event: CategoryScoreVoteEvent): void {
  let entity = new CategoryScoreVote(
    generateId(event)
  )
  entity.categoryId = event.params.categoryId
  entity.value = event.params.value
  entity.save()
}
