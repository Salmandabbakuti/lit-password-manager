import { Contract, JsonRpcProvider } from "ethers";
import { CREDENTIAL_MANAGAER_CONTRACT_ADDRESS } from "./constants";

const defaultProvider = new JsonRpcProvider(
  "https://rpc-amoy.polygon.technology/",
  80002,
  {
    staticNetwork: true
  }
);

export const CREDENTIAL_MANAGAER_CONTRACT_ABI = [
  "function addCredential(string _cipherText, bytes32 _dataHash)",
  "function deleteCredential(uint256 _index)",
  "function getCredentialsOf(address _user) view returns (tuple(bytes32 dataHash, string cipherText)[])",
  "function updateCredential(uint256 _index, string _cipherText, bytes32 _newDataHash)"
];

export const credentialManagerContract = new Contract(
  CREDENTIAL_MANAGAER_CONTRACT_ADDRESS,
  CREDENTIAL_MANAGAER_CONTRACT_ABI,
  defaultProvider
);
