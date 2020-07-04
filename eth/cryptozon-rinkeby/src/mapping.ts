import {
  Approval as ApprovalEvent,
  CategoryCreated as CategoryCreatedEvent,
  ItemAdded as ItemAddedEvent,
  ItemFilesUpdated as ItemFilesUpdatedEvent,
  ItemUpdated as ItemUpdatedEvent,
  SubcategoryAdded as SubcategoryAddedEvent,
  Transfer as TransferEvent,
  Vote as VoteEvent
} from "../generated/Contract/Contract"
import {
  Approval,
  CategoryCreated,
  ItemAdded,
  ItemFilesUpdated,
  ItemUpdated,
  SubcategoryAdded,
  Transfer,
  Vote
} from "../generated/schema"

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._owner = event.params._owner
  entity._spender = event.params._spender
  entity._value = event.params._value
  entity.save()
}

export function handleCategoryCreated(event: CategoryCreatedEvent): void {
  let entity = new CategoryCreated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.categoryId = event.params.categoryId
  entity.title = event.params.title
  entity.locale = event.params.locale
  entity.save()
}

export function handleItemAdded(event: ItemAddedEvent): void {
  let entity = new ItemAdded(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.categoryId = event.params.categoryId
  entity.itemId = event.params.itemId
  entity.save()
}

export function handleItemFilesUpdated(event: ItemFilesUpdatedEvent): void {
  let entity = new ItemFilesUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.itemId = event.params.itemId
  entity.format = event.params.format
  entity.version = event.params.version
  entity.save()
}

export function handleItemUpdated(event: ItemUpdatedEvent): void {
  let entity = new ItemUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.owner = event.params.owner
  entity.itemId = event.params.itemId
  entity.title = event.params.title
  entity.description = event.params.description
  entity.priceETH = event.params.priceETH
  entity.priceAR = event.params.priceAR
  entity.locale = event.params.locale
  entity.cover = event.params.cover
  entity.save()
}

export function handleSubcategoryAdded(event: SubcategoryAddedEvent): void {
  let entity = new SubcategoryAdded(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.categoryId = event.params.categoryId
  entity.subId = event.params.subId
  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._from = event.params._from
  entity._to = event.params._to
  entity._value = event.params._value
  entity.save()
}

export function handleVote(event: VoteEvent): void {
  let entity = new Vote(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.voteId = event.params.voteId
  entity.child = event.params.child
  entity.parent = event.params.parent
  entity.value = event.params.value
  entity.save()
}
