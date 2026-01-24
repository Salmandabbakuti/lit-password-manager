import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { createAuthManager, storagePlugins } from "@lit-protocol/auth";

// 2. Create auth manager
const authManager = createAuthManager({
  storage: storagePlugins.localStorage({ appName: "my-app" })
});

export const encryptData = async (litClient, data, address) => {
  // 3. Build access control conditions
  const accs = createAccBuilder()
    .requireWalletOwnership(address)
    .on("ethereum")
    .build();
  const encryptedData = await litClient.encrypt({
    dataToEncrypt: data,
    unifiedAccessControlConditions: accs,
    chain: "ethereum"
  });
  return encryptedData;
};

export const decryptData = async (litClient, encryptedData, walletClient) => {
  const authContext = await authManager.createEoaAuthContext({
    config: { account: walletClient },
    authConfig: {
      resources: [["access-control-condition-decryption", "*"]],
      expiration: new Date(Date.now() + 1000 * 60 * 60).toISOString()
    },
    litClient
  });
  const accs = createAccBuilder()
    .requireWalletOwnership(walletClient?.account?.address)
    .on("ethereum")
    .build();
  const decrypted = await litClient.decrypt({
    data: {
      ...encryptedData,
      metadata: { dataType: "string" }
    },
    unifiedAccessControlConditions: accs,
    authContext,
    chain: "ethereum"
  });
  return decrypted;
};
