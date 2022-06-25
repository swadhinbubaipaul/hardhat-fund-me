const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe, deployer, mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1");

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", function () {
        it("Sets the aggregator address correctly", async function () {
          const response = await fundMe.priceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", function () {
        it("Fails if you don't send enough ETH!", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("Updated the amount funded in data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.addressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("Adds funders to array of funders", async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.funders(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("Withdraw ETH from a single founder", async function () {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("Allows us withdraw from multiple founders", async function () {
          //Arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          //Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          // Make sure funders are set properly
          await expect(fundMe.funders(0)).to.be.reverted;

          for (let i; i < 6; i++) {
            assert.equal(
              await fundMe.addressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("Only allows the owner to withdraw funds", async function () {
          const accounts = await ethers.getSigners();
          const user = accounts[1];
          const userConnectedContract = fundMe.connect(user);
          await expect(userConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe_NotOwner"
          );
        });
      });
    });
