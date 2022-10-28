const { ethers, getNamedAccounts } = require("hardhat");

async function withdrawETH(_amount) {
    let amount;

    const { deployer } = await getNamedAccounts();
    const wallet = await ethers.getContract("Wallet", deployer);
    console.log(`Got contract Wallet at ${wallet.address}`);

    amount = _amount;

    console.log(`Withdrawing ${amount} ETH`);
    const transactionResponse = await wallet.withdrawETH(
        ethers.utils.parseEther(amount)
    );
    await transactionResponse.wait();
    console.log(`${amount} ETH Withdrawn!`);
}

async function main() {
    //to make variable
    await withdrawETH("10");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
