import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  KeyAdded,
  KeyDeleted,
  KeyUpdated
} from "../generated/KeyManager/KeyManager"

export function createKeyAddedEvent(
  id: BigInt,
  ipfsHash: string,
  owner: Address
): KeyAdded {
  let keyAddedEvent = changetype<KeyAdded>(newMockEvent())

  keyAddedEvent.parameters = new Array()

  keyAddedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  keyAddedEvent.parameters.push(
    new ethereum.EventParam("ipfsHash", ethereum.Value.fromString(ipfsHash))
  )
  keyAddedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return keyAddedEvent
}

export function createKeyDeletedEvent(id: BigInt, owner: Address): KeyDeleted {
  let keyDeletedEvent = changetype<KeyDeleted>(newMockEvent())

  keyDeletedEvent.parameters = new Array()

  keyDeletedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  keyDeletedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return keyDeletedEvent
}

export function createKeyUpdatedEvent(
  id: BigInt,
  ipfsHash: string,
  owner: Address
): KeyUpdated {
  let keyUpdatedEvent = changetype<KeyUpdated>(newMockEvent())

  keyUpdatedEvent.parameters = new Array()

  keyUpdatedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  keyUpdatedEvent.parameters.push(
    new ethereum.EventParam("ipfsHash", ethereum.Value.fromString(ipfsHash))
  )
  keyUpdatedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return keyUpdatedEvent
}
