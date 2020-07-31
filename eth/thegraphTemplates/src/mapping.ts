import { ethereum, BigInt } from "@graphprotocol/graph-ts"
import {
  Contract as ContractEvent,
  PostChangeOwner as PostChangeOwnerEvent,
  PostCreated as PostCreatedEvent,
  PostUpdated as PostUpdatedEvent,
  TemplateChangeOwner as TemplateChangeOwnerEvent,
  TemplateCreated as TemplateCreatedEvent,
  TemplateSetArchived as TemplateSetArchivedEvent,
  TemplateUpdated as TemplateUpdatedEvent
} from "../generated/Contract/Contract"
import {
  PostChangeOwner,
  PostCreated,
  PostUpdated,
  TemplateChangeOwner,
  TemplateCreated,
  TemplateSetArchived,
  TemplateUpdated
} from "../generated/schema"

function generateId(event: ethereum.Event): String {
  let block = event.block.number.toHex().substring(2)
  block = '0x' + block.padStart(64, '0');
  let logIndex = event.logIndex.toHex().substring(2)
  logIndex = '0x' + logIndex.padStart(64, '0');
  return block + "-" + logIndex + "-" + event.transaction.hash.toHex();
}

export function handlePostChangeOwner(event: PostChangeOwnerEvent): void {
  let entity = new PostChangeOwner(
    generateId(event)
  )
  entity.postId = event.params.postId
  entity.owner = event.params.owner
  entity.save()
}

export function handlePostCreated(event: PostCreatedEvent): void {
  let entity = new PostCreated(
    generateId(event)
  )
  entity.postId = event.params.postId
  entity.itemId = event.params.itemId
  entity.save()
}

export function handlePostUpdated(event: PostUpdatedEvent): void {
  let entity = new PostUpdated(
    generateId(event)
  )
  entity.postId = event.params.postId
  entity.templateId = event.params.templateId
  entity.save()
}

export function handleTemplateChangeOwner(event: TemplateChangeOwnerEvent): void {
  let entity = new TemplateChangeOwner(
    generateId(event)
  )
  entity.templateId = event.params.templateId
  entity.owner = event.params.owner
  entity.save()
}

export function handleTemplateCreated(event: TemplateCreatedEvent): void {
  let entity = new TemplateCreated(
    generateId(event)
  )
  entity.templateId = event.params.templateId
  entity.save()
}

export function handleTemplateSetArchived(event: TemplateSetArchivedEvent): void {
  let entity = new TemplateSetArchived(
    generateId(event)
  )
  entity.templateId = event.params.templateId
  entity.archived = event.params.archived
  entity.save()
}

export function handleTemplateUpdated(event: TemplateUpdatedEvent): void {
  let entity = new TemplateUpdated(
    generateId(event)
  )
  entity.templateId = event.params.templateId
  entity.name = event.params.name
  entity.js = event.params.js
  entity.settings = event.params.settings
  entity.save()
}
