import LitJsSdk from "@lit-protocol/sdk-browser";

const client = new LitJsSdk.LitNodeClient({ debug: false });

const accessControlConditions = [
  {
    contractAddress: "0xB56946D84E4Dd277A8E575D5Dae551638010C6A8",
    standardContractType: "ERC721",
    chain: "mumbai",
    method: "balanceOf",
    parameters: [":userAddress", "latest"],
    returnValueTest: {
      comparator: ">",
      value: "0", // 0 ETH
    },
  },
];

class Lit {
  litNodeClient;
  constructor({ autoConnect = false }) {
    if (autoConnect) {
      this.connect();
    }
  }
  async connect() {
    await client.connect();
    this.litNodeClient = client;
  }

  async encryptString(stringToEncrypt) {
    if (!this.litNodeClient) {
      await this.connect();
    }
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: "mumbai" });
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
      stringToEncrypt
    );

    // save encryption key to nodes
    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain: "mumbai",
    });

    return {
      encryptedString,
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    };
  };

  async decryptString(encryptedSymmetricKey, encryptedString) {
    if (!this.litNodeClient) {
      await this.connect();
    }
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: "mumbai" });
    const symmetricKey = await this.litNodeClient.getEncryptionKey({
      accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain: "mumbai",
      authSig,
    });

    const decryptedString = await LitJsSdk.decryptString(
      encryptedString,
      symmetricKey
    );
    return { decryptedString };
  };
}

export default Lit;