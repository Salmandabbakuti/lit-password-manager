
async function main() {
  const contractFactory = await ethers.getContractFactory("Greeter");
  const contract = await contractFactory.deploy("Hello, Hardhat!");
  await contract.deployed();
  return contract;
}

main()
  .then(async (contract) => {
    console.log("Contract deployed at:", contract.address);
    // Write to contract
    const tx = await contract.setGreeting("Hello Ethereum Devs!");
    await tx.wait();
    // Read from contract
    const greeting = await contract.getGreeting();
    console.log('Greeting from contract:', greeting);
  })
  .catch((error) => {
    console.error(error);
  });
