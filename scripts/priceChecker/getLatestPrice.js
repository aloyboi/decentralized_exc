const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function getPrice(_tokenName) {
    const { deployer } = await getNamedAccounts();
    const pricechecker = await ethers.getContract("PriceChecker", deployer);
    console.log(`Got contract priceChecker at ${pricechecker.address}`);

    //Token address to be taken from user input, for now use usdc token
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const transactionResponse = await pricechecker.getPriceFeed(_tokenName);

    const price = (await pricechecker.getPrice(transactionResponse)) / 10 ** 8;
    console.log(`Price of ${_tokenName}: ${price}`);
}

async function main() {
    await getPrice("ETH");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
