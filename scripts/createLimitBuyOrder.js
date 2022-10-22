const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);
    console.log(`Creating new Buy Limit Order`);
    const transactionResponse = await exchange.createLimitBuyOrder(
        "0x0000000000000000000000000000000000000000", //assumed to be ETH address
        "1",
        "1500"
    );
    await transactionResponse.wait();
    console.log(`Successfully placed Limit Buy Order!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
