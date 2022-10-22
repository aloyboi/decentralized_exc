const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);
    console.log("Depositing ETH");
    const transactionResponse = await exchange.depositETH({
        //variable value
        value: ethers.utils.parseEther("0.01"),
    });
    await transactionResponse.wait();
    console.log("ETH Deposited!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
