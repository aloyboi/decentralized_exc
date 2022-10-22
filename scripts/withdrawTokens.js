const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);
    console.log(`Withdrawing tUSDC`);
    const transactionResponse = await exchange.withdrawToken(
        "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
        "10"
    );
    await transactionResponse.wait();
    console.log(`tUSDC withdrawn!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
