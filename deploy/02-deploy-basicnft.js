const {network,  getNamedAccounts, deployments} = require("hardhat")
const { ethers } = require("ethers");
const {developmentChains} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify");


module.exports = async ()=>{
    const {deploy, log }= deployments; 
    const {deployer} = await getNamedAccounts();

    let args = [];

    const basicNft = await deploy("BasicNft",{
        from:deployer,
        args:args,
        log:true,
        waitConfirmations:network.config.blockConfirmations || 1
        
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(basicNft.address, args)
    }
    log("----------------------------------------------------")
}

module.exports.tags = ["all","basicnft"]

