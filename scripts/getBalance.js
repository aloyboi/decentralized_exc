const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
    const { deployer, user } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);
    const transactionResponse = await exchange.balanceOf(
        "0x0000000000000000000000000000000000000000",
        deployer //have to change
    );
    await transactionResponse.wait();
    //console.log(`Balance: ${transactionResponse}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
