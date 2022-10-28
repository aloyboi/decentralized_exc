const { ethers, getNamedAccounts } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function withdrawToken(_tokenName, _amount) {
    const { deployer } = await getNamedAccounts();
    const wallet = await ethers.getContract("Wallet", deployer);
    console.log(`Got contract Wallet at ${wallet.address}`);

    //Token address to be taken from user input, for now use usdc token
    let tokenAddress;
    let amount;
    let decimals = 18;
    let amountInDecimals;
    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with testUSDC token
        const testUSDC = await deployments.get("testUSDC");
        tokenAddress = testUSDC.address;

        amount = _amount;
        amountInDecimals = ethers.utils.parseUnits(amount, decimals); //variable value
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        const chainId = network.config.chainId;
        tokenAddress = networkConfig[chainId][_tokenName][address];

        //to make variable
        amount = _amount;
        //decimals = networkConfig[chainId][_tokenName][decimal];
        amountInDecimals = ethers.utils.parseUnits(amount, decimals);
    }

    console.log(`Withdrawing ${amount} testUSDC`);
    const transactionResponse = await wallet.withdrawToken(
        tokenAddress, //to change
        amountInDecimals
    );
    await transactionResponse.wait();
    console.log(`${amount} testUSDC withdrawn!`);
}

async function main() {
    //to make variable
    await withdrawToken("USDC", "10");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
