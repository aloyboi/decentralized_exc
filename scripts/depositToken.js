const { ethers, getNamedAccounts } = require("hardhat");

async function approveErc20(
    erc20Address,
    spenderAddress,
    amountToSpend,
    account
) {
    const erc20Token = await ethers.getContractAt("testUSDC", erc20Address);
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);
    console.log("Approved!");
}

async function main() {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);

    await approveErc20(
        "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
        "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
        "10",
        deployer
    );
    console.log(`Depositing tUSDC into DEX`);
    const transactionResponse = await exchange.depositToken(
        "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
        "5"
    );
    await transactionResponse.wait();
    console.log(`tUSDC Deposited!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
