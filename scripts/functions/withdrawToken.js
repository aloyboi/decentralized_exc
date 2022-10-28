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
    let decimals = 18;
    let amountInDecimals;
    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with testUSDC token
        const testUSDC = await deployments.get("testUSDC");
        tokenAddress = testUSDC.address;

        amountInDecimals = ethers.utils.parseUnits(_amount, decimals); //variable value
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        const chainId = network.config.chainId;
        tokenAddress = networkConfig[chainId][_tokenName][address];

        //decimals = networkConfig[chainId][_tokenName][decimal];
        amountInDecimals = ethers.utils.parseUnits(_amount, decimals);
    }

    console.log(`Withdrawing ${_amount} ${_tokenName}`);
    const transactionResponse = await wallet.withdrawToken(
        tokenAddress, //to change
        amountInDecimals
    );
    await transactionResponse.wait();
    console.log(`${_amount} ${_tokenName} withdrawn!`);
}

async function main() {
    //to make variable
    await withdrawToken("USDC", "29990.246946596922");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
