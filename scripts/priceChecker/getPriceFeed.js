const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function getPriceFeed(_tokenName) {
    const { deployer } = await getNamedAccounts();
    const pricechecker = await ethers.getContract("PriceChecker", deployer);
    console.log(`Got contract priceChecker at ${pricechecker.address}`);

    //Token address to be taken from user input, for now use usdc token
    let tokenAddress;
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const transactionResponse = await pricechecker.getPriceFeed(_tokenName);
    console.log(`Price feed of ${_tokenName}: ${transactionResponse}`);
}

async function main() {
    await getPriceFeed("ETH");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
