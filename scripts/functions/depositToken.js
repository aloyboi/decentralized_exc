const { ethers, getNamedAccounts } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

//approve function
async function approveErc20(erc20Address, spenderAddress, amountToSpend) {
    const erc20Token = await ethers.getContractAt("testUSDC", erc20Address);
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);
    console.log("Approved!");
}

async function depositToken(_tokenName, _amount) {
    const { deployer } = await getNamedAccounts();
    const wallet = await ethers.getContract("Wallet", deployer);

    console.log(`Got contract Wallet at ${wallet.address}`);

    //Token address to be taken from user input, for now use usdc token
    let tokenAddress;
    let amount;
    let decimals = 18;
    let amountInDecimals;

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //we only test depositing testUSDC
        const testUSDC = await deployments.get("testUSDC");
        tokenAddress = testUSDC.address;
        amount = _amount;
        amountInDecimals = ethers.utils.parseUnits(amount, decimals); //variable value
    }
    //Testnet (to change)
    else {
        const chainId = network.config.chainId;
        tokenAddress = networkConfig[chainId][_tokenName][address];
        amount = _amount;
        //decimals = networkConfig[chainId][_tokenName][decimal];
        amountInDecimals = ethers.utils.parseUnits(amount, decimals);
    }

    await approveErc20(tokenAddress, wallet.address, amountInDecimals);
    console.log(`Depositing ${amount} ${_tokenName} into DEX`);
    const transactionResponse = await wallet.depositToken(
        tokenAddress,
        amountInDecimals
    );
    await transactionResponse.wait();
    console.log(`${amount} ${_tokenName} Deposited!`);
}

async function main() {
    //variable value
    await depositToken("USDC", "15000.123473298463");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
