const { ethers, getNamedAccounts } = require("hardhat");
const { DECIMALS } = require("../helper-hardhat-config");

async function main() {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);
    console.log("Withdrawing ETH");
    const transactionResponse = await exchange.withdrawETH(
        //variable value
        (0.1 * 10 ** 18).toString()
    );
    await transactionResponse.wait();
    console.log("ETH Withdrawn!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
