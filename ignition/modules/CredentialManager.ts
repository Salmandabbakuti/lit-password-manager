import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CredentialManagerModule", (m) => {
  const credentialManager = m.contract("CredentialManager");

  return { credentialManager };
});
