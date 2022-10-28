const { ethers, getNamedAccounts } = require("hardhat");

async function depositETH(_amount) {
    let amount;

    const { deployer } = await getNamedAccounts();
    const wallet = await ethers.getContract("Wallet", deployer);
    console.log(`Got contract Wallet at ${wallet.address}`);

    amount = _amount; //variable amount
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    console.log(`Depositing ${amount} ETH`);
    const transactionResponse = await wallet.depositETH({
        value: ethers.utils.parseEther(amount),
    });
    await transactionResponse.wait();
    console.log(`${amount} ETH Deposited!`);
}

async function main() {
    await depositETH("10");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
