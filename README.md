# Lit Password Manager

A web3-native password manager that utilizes decentralized infrastructure and lit protocol to store and retrieve passwords.

Lit Protocol is a decentralized key management network powered by threshold cryptography. A blockchain-agnostic middleware layer, Lit can be used to read and write data between blockchains and off-chain platforms, facilitating encryption, access control, and automation for the open web via programmatic signing.

#### Tech Stack

- Frontend: Next.js, Antd
- Web3 Client: ethers.js
- Smartcontracts: Solidity, Hardhat
- Storage: IPFS, Pinata
- Encryption: Lit Protocol
- Blockchain Network: Polygon Mumbai
- Indexer: The Graph

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

1. [Node.js](https://nodejs.org/en/download/) Nodejs version 14.17.0 or higher
2. Private key of an Ethereum account with some ETH/Matic in it
3. RPC endpoint of an Ethereum node of your choice
4. [Metamask](https://metamask.io/) extension installed in your browser
5. Pinata API keys
6. The Graph Account (if you want to deploy your own subgraph)

### Deployed Resources:

- [Lit Password Manager App](https://lit-password-manager.vercel.app/)
- [Lit Password Manager Subgraph](https://api.thegraph.com/subgraphs/name/salmandabbakuti/key-manager)
- [Lit Password Manager Smartcontracts](https://mumbai.polygonscan.com/address/0xc47cf83080ed29e32ccdf1c9a411c9b614820236#code)

## Getting Started

> Note: This project is still in development and is not ready for production use.
> Copy the `.env.example` file to `.env` and fill in the required values.

> There are some optional steps that you can skip and use my deployed resources instead.

#### Deploying Contract (Optional)

```

yarn install

yarn hardhat compile

yarn hardhat deploy --network polygonTest

# copy contract address deployed and paste it in client's .env file

```

#### Deploying Subgraph (Optional)

> Note: Update the `subgraph.yaml` file with the contract address deployed in the previous step. Update deploy script with your own subgraph name.

```

cd indexer
yarn install
yarn codegen
yarn deploy

# copy subgraph url and paste it in client's .env file

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

https://user-images.githubusercontent.com/29351207/202835182-75ab1802-73a2-4cc9-ad89-0154cd1e6a6e.mp4

![Screenshot1](https://github.com/Salmandabbakuti/lit-password-manager/blob/main/resources/home-screenshot.png)

![Screenshot2](https://github.com/Salmandabbakuti/lit-password-manager/blob/main/resources/edit-password.png)

![Screenshot3](https://github.com/Salmandabbakuti/lit-password-manager/blob/main/resources/update_tx-screenshot.png)

![Screenshot4](https://github.com/Salmandabbakuti/lit-password-manager/blob/main/resources/save_success-screenshot.png)
