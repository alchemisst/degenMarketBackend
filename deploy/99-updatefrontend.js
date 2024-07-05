const fs = require("fs");
const { network, ethers } = require("hardhat");

const UPDATE_FRONT_END = process.env.UPDATE_FRONT_END;
const frontendContractFile = "../frontend/constants/networkMapping.json";
const frontEndAbiLocation = "../frontend/constants/";




module.exports = async () => {
  if (UPDATE_FRONT_END) {
    console.log("Writing to front end...")
    await updatefrontend();
    await updateAbi() 
  }
};

async function updatefrontend() {
  const degenMarket = await ethers.getContract("DegenMarket");
  const chainId = network.config.chainId;
  const contractAddresses = JSON.parse(
    fs.readFileSync(frontendContractFile, "utf8")
  );

  if (chainId in contractAddresses) {
    if (
      !contractAddresses[chainId]["DegenMarket"].includes(degenMarket.address)
    ) {
      contractAddresses[chainId] ={DegenMarket: [degenMarket.address]};
    }
  }else{
    contractAddresses[chainId] ={DegenMarket: [degenMarket.address]};
  }
  fs.writeFileSync(frontendContractFile,JSON.stringify(contractAddresses))
}

async function updateAbi() {
    const degenMarket = await ethers.getContract("DegenMarket")
    fs.writeFileSync(
        `${frontEndAbiLocation}DegenMarket.json`,
        degenMarket.interface.format(ethers.utils.FormatTypes.json)
    )
    // fs.writeFileSync(
    //     `${frontEndAbiLocation2}DegenMarket.json`,
    //     degenMarket.interface.format(ethers.utils.FormatTypes.json)
    // )

    const basicNft = await ethers.getContract("BasicNft")
    fs.writeFileSync(
        `${frontEndAbiLocation}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
    // fs.writeFileSync(
    //     `${frontEndAbiLocation2}BasicNft.json`,
    //     basicNft.interface.format(ethers.utils.FormatTypes.json)
    // )
    console.log("Frontend Updated...........")
}

module.exports.tags = ["all","frontend"]