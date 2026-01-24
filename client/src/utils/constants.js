import { parseAbi } from "viem";

export const CREDENTIAL_MANAGAER_CONTRACT_ADDRESS =
  "0x7423BF3bf09B5829F619BFcb7F4811a6f11F650b";

const abi = [
  "function addCredential(string _cipherText, bytes32 _dataHash)",
  "function deleteCredential(uint256 _index)",
  "function getCredentialsOf(address _user) view returns ((bytes32 dataHash, string cipherText)[])",
  "function updateCredential(uint256 _index, string _cipherText, bytes32 _newDataHash)"
];

export const CREDENTIAL_MANAGAER_CONTRACT_ABI = parseAbi(abi);
