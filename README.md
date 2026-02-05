# Lit Password Manager

A web3-native password manager that utilizes decentralized infrastructure and lit protocol to store and retrieve passwords.

Lit Protocol is a decentralized key management network powered by threshold cryptography. A blockchain-agnostic middleware layer, Lit can be used to read and write data between blockchains and off-chain platforms, facilitating encryption, access control, and automation for the open web via programmatic signing.

#### Tech Stack

- Frontend: React Vite, Antd
- Web3 Client: Ethers, viem
- Smartcontracts: Solidity, Hardhat
- Encryption: Lit Protocol
- Blockchain Network: Polygon Amoy

#### Workflow Architecture:

![Workflow Architecture](https://github.com/Salmandabbakuti/lit-password-manager/blob/main/resources/lit-pm-flow.png)

##### Access Control conditions:

> Its quite surprising that many people use NFT or eth balance based access control. If I posses specific NFT or balance in my account, I should be able to decrypt other users passwords? No. So, I'm using the logic where the user who encrypted the password can only decrypt it. This is a very basis of encryption and decryption of passwords. I'm not sure if this is the right way to do it. I'm open to suggestions.

```javascript
// only the user who encrypted the data should be able to decrypt it
const accessControlConditions = [
  {
    contractAddress: "",
    standardContractType: "",
    chain: "mumbai",
    method: "",
    parameters: [":userAddress"],
    returnValueTest: {
      comparator: "=",
      value: account // ,<=== user address should be dynamic and match the user address connected to the wallet
    }
  }
];
```

### Prerequisites

> There are some optional prerequisites that you can skip and use my deployed resources instead.

1. [Node.js](https://nodejs.org/en/download/) Nodejs version 14.17.0 or higher.
2. Private key of an Ethereum account with some ETH/Pol in it. (Optional)
3. RPC endpoint of an Ethereum node of your choice. (Optional)
4. [Metamask](https://metamask.io/) extension installed in your browser.

### Deployed Resources:

- [Lit Password Manager App](https://lit-password-manager.vercel.app/)
- [Lit Password Manager Smartcontract](https://amoy.polygonscan.com/address/0x192C44BA4609E798C856fac0e39734Bc3A790B52)

## Getting Started

> Copy the `.env.example` file to `.env` and fill in the required values.

#### Deploying Contract (Optional)

```bash

npm install

npx hardhat keystore set PRIVATE_KEY

npx hardhat compile

npx hardhat ignition deploy ignition/modules/CredentialManager.ts --network amoy

# copy contract address deployed and paste it in client's .env file

```

### Running the client

> Copy the `.env.example` file to `.env` and fill in the required values.

```bash
cd client
yarn install
yarn dev
```

### Safety

This is experimental software and is provided on an "as is" and "as available" basis.

Lit Password Manager is a proof of concept and is not ready for production use. It is not audited and has not been tested for security. Use at your own risk.
I do not give any warranties and will not be liable for any loss incurred through any use of this codebase.

### Demo

<img width="1440" height="781" alt="Screenshot 2026-02-05 at 12 15 43 PM" src="https://github.com/user-attachments/assets/0abd7d7f-21f0-437b-bd68-cee80b50cf05" />

<img width="1440" height="781" alt="Screenshot 2026-02-05 at 12 14 35 PM" src="https://github.com/user-attachments/assets/095b2210-446b-4559-b320-870b5d6f2ff6" />

<img width="1440" height="781" alt="Screenshot 2026-02-05 at 12 14 11 PM" src="https://github.com/user-attachments/assets/0c05f6d4-cc8a-4319-aff9-2dea9e9a9adf" />
