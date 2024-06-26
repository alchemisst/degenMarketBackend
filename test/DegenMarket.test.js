const { deployments, network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.config.chainId)
  ? describe.skip
  : describe("DegenMarker", () => {
      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        const deployer = accounts[0];
        await deployments.fixture("all");
        const degenMarket = await ethers.getContract("DegenMarket");
        const basicNft = await ethers.getContract("BasicNft");
      });

      



    });
