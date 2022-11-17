# Lit Password Manager

A web3-native password manager that utilizes decentralized infrastructure and lit protocol to store and retrieve passwords.

Lit Protocol is a decentralized key management network powered by threshold cryptography. A blockchain-agnostic middleware layer, Lit can be used to read and write data between blockchains and off-chain platforms, facilitating encryption, access control, and automation for the open web via programmatic signing.

#### Tech Stack

- Frontend: Next.js, Antd
- Smartcontracts: Solidity, Hardhat
- Storage: IPFS, Pinata
- Encryption: Lit Protocol
- Blockchain Network: Polygon Mumbai

### Prerequisites

1. [Node.js](https://nodejs.org/en/download/)
2. Private key of an Ethereum account with some ETH/Matic in it
3. RPC endpoint of an Ethereum node of your choice
4. [Metamask](https://metamask.io/) extension installed in your browser
5. Pinata API keys

## Getting Started

> Note: This project is still in development and is not ready for production use.
> Copy the `.env.example` file to `.env` and fill in the required values.

#### Deploying Contract

```
yarn install

yarn hardhat compile

yarn hardhat deploy --network polygonTest

# copy contract address deployed and paste it in client's .env file
```

### Running the client

> Copy the `.env.example` file to `.env` and fill in the required values.

```bash
cd client
yarn install
yarn dev
```
