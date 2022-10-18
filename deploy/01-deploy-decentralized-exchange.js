// function deployFunc(hre) {
//     console.log("Deploying contract");
//     hre.getNamedAccounts();
//     hre.deployments();
// }
//const { verify } = require("../utils/verify");
const { network } = require("hardhat");
const { networkConfig, developmentChain } = require("../helper-hardhat-config");
// const helperConfig = require("../helper-hardhat-config");
// const networkConfig = helperConfig.networkConfig;

// module.exports.default = deployFunc;

//just know that this is almost fixed
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments; //contains several helpers function to deploy contract and also execute transaction
    const { deployer } = await getNamedAccounts(); //get from namedAccounts in config file
    const chainId = network.config.chainId;

    //const args = [ethUsdPriceFeedAddress];

    const fundMe = await deploy("Exchange", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    // if (
    //     !developmentChain.includes(network.name) &&
    //     process.env.ETHERSCAN_API_KEY
    // ) {
    //     await verify(fundMe.address, args);
    // }
    log("------------------------------------------------");
};

module.exports.tags = ["all", "dex"];
