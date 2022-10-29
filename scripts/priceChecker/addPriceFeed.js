const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function addPriceFeed(_tokenName) {
    const { deployer } = await getNamedAccounts();
    const pricechecker = await ethers.getContract("PriceChecker", deployer);
    console.log(`Got contract priceChecker at ${pricechecker.address}`);

    //Token address to be taken from user input, for now use usdc token
    let priceFeedAddress;
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with testUSDC token
        priceFeedAddress = await ethers.getContract("MockV3Aggregator");
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        priceFeedAddress = await networkConfig[network.config.chainId][
            _tokenName
        ][pricefeed];
    }

    const transactionResponse = await pricechecker.addPriceFeed(
        _tokenName,
        priceFeedAddress.address
    );
    console.log(`Price feed of ${_tokenName} added at: ${priceFeedAddress}`);
}

async function main() {
    await addPriceFeed("ETH");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
