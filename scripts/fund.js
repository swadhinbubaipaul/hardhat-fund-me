const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);
  let balance = await fundMe.provider.getBalance(deployer);
  console.log(
    `Funding Contract...
    Current balance is: ${ethers.utils.formatEther(balance)}`
  );
  const response = await fundMe.fund({ value: ethers.utils.parseEther("0.1") });
  await response.wait(1);
  balance = await fundMe.provider.getBalance(deployer);
  console.log(
    `Amount funded... 
    Current balance is: ${ethers.utils.formatEther(balance)}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
