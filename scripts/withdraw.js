const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);
  let balance = await fundMe.provider.getBalance(deployer);
  console.log(
    `Withdrawing from Contract... 
    Current balance is: ${ethers.utils.formatEther(balance)}`
  );
  const response = await fundMe.withdraw();
  await response.wait(1);
  balance = await fundMe.provider.getBalance(deployer);
  console.log(
    `Withdrawal successful... 
    Current balance is: ${ethers.utils.formatEther(balance)}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
