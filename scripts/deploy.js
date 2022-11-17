
async function main() {
  const contractFactory = await ethers.getContractFactory("KeyManager");
  const contract = await contractFactory.deploy();
  await contract.deployed();
  return contract;
}

main()
  .then(async (contract) => {
    console.log("Contract deployed at:", contract.address);
    // getting keys from contract
    const keys = await contract.getMyKeys();
    console.log("Keys:", keys);
  })
  .catch((error) => {
    console.error(error);
  });
