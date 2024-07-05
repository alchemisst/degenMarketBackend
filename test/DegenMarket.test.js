
const { network, deployments, ethers } = require("hardhat")

const { developmentChains } = require("../helper-hardhat-config");
const { expect, assert } = require("chai");



!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Degen Market Tests", () => {
    const {log} =deployments
    let degenMarket,degenMarketContract,basicNft,basicNftContract,deployer,user;
    const PRICE = ethers.utils.parseEther("0.1")
    const TOKEN_ID = 0;
      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        user = accounts[1];
        await deployments.fixture(["all"]);

        degenMarketContract = await ethers.getContract("DegenMarket");
        degenMarket =  degenMarketContract.connect(deployer)
        basicNftContract = await ethers.getContract("BasicNft");
        basicNft =  basicNftContract.connect(deployer);
        await basicNft.mintNft();
        await basicNft.approve(degenMarketContract.address, TOKEN_ID)

      });

      describe("listItem",  () => {
        it("emits an event after listing an item", async ()=>{

          expect(await degenMarket.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
            "ItemListed"
        )

        })

        it("revert nft is already listed",async ()=>{
          await degenMarket.listItem(basicNft.address, TOKEN_ID, PRICE);
          
          await expect(degenMarket.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith("AlreadyListed")
        
        })

        it("only lets owner to list the nft",async ()=>{
          degenMarket = await degenMarketContract.connect(user)
          await expect(degenMarket.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith("NotOwner")
        })

        it("reverts if the price be 0", async () => {
          const ZERO_PRICE = ethers.utils.parseEther("0")
          await expect(
              degenMarket.listItem(basicNft.address, TOKEN_ID, ZERO_PRICE)
          ).to.be.revertedWith("PriceMustBeAboveZero")
        })

      })

      describe("buyItem", function () {
        it("transfers the item to the buyer and updates internal records",async ()=>{
          await degenMarket.listItem(basicNft.address,TOKEN_ID,PRICE);


          degenMarket = degenMarketContract.connect(user);

        expect(
            await degenMarket.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
        ).to.emit("ItemBought")

        const newOwner = await basicNft.ownerOf(TOKEN_ID);
        const deployerProceeds = await degenMarket.getProceeds(deployer.address)
        
 
        assert(newOwner.toString() == user.address)

        assert(deployerProceeds.toString() == PRICE.toString())


        })
      })

      





    });
