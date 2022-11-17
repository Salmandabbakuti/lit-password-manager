const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Contract Tests", function () {
  it("Should return the new greeting once it's changed", async function () {
    const contractFactory = await ethers.getContractFactory("Greeter");
    const contract = await contractFactory.deploy("Hello, world!");
    await contract.deployed();

    expect(await contract.getGreeting()).to.equal("Hello, world!");
    const setGreetingTx = await contract.setGreeting("Hola, mundo!");
    // wait for the transaction to be mined
    await setGreetingTx.wait();
    expect(await contract.getGreeting()).to.equal("Hola, mundo!");
  });
});
