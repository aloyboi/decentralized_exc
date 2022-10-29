const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    // If we are on a local development network, we need to deploy mocks!
    if (chainId == 31337) {
        const pricechecker = await deploy("PriceChecker", {
            contract: "PriceChecker",
            from: deployer,
            log: true,
            args: [],
        });
        log("------------------------------------------------");
        log(
            "You are deploying to a local network, you'll need a local network running to interact"
        );
        log(
            "Please run `npx hardhat console` to interact with the deployed smart contracts!"
        );
        log("------------------------------------------------");
    }
};
module.exports.tags = ["all", "pricechecker"];
