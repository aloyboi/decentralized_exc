const { network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
    DECIMALS,
    initialAns,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments; //contains several helpers function to deploy contract and also execute transaction
    const { deployer } = await getNamedAccounts(); //get from namedAccounts in config file
    const chainId = network.config.chainId;

    if (developmentChain.includes(network.name)) {
        log("Local network, Deploying Mock... ");
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, initialAns], //input arguments for mock aggregator constructor, aka decimals and initial answer
        });
        log("Mock Deployed!");
        log("----------------------------------------");
    }
};

module.exports.tags = ["all"];
