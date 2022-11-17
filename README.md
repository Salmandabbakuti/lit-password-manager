# hardhat-boilerplate

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts with balances.

> Rename `env.example` to `.env` and add your env specific keys.

Try running some of the following tasks:

```shell
yarn install

yarn hardhat node # starts local node

yarn hardhat accounts # list accounts with balances

yarn hardhat balance --account '0x47a9...' # show balance eth of specified account

yarn hardhat compile # compiles contracts

yarn hardhat deploy --network local # deploys contract defined in tasks on specified network

yarn hardhat run --network local scripts/deploy.js # deploys contract in scripts/deploy.js

yarn hardhat test # runs tests

yarn hardhat clean # removes all compiled and deployed artifacts

yarn hardhat help # shows help
```
