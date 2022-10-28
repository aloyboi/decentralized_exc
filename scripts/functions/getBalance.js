const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function getBalance(_tokenName) {
    const { deployer, user } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);

    //Token address to be taken from user input, for now use usdc token
    let tokenAddress;
    let userAdd;
    let decimals = 18;
    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with testUSDC token or ETH token
        if (_tokenName == "USDC") {
            const testUSDC = await deployments.get("testUSDC");
            tokenAddress = testUSDC.address;
        } else if (_tokenName == "ETH") {
            tokenAddress = "0x0000000000000000000000000000000000000000";
        }
        userAdd = deployer;
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        const chainId = network.config.chainId;
        tokenAddress = networkConfig[chainId][_tokenName][address];
        //decimals = networkConfig[chainId][_tokenName][decimal];
        userAdd = network.config.account;
    }

    const transactionResponse = await exchange.balanceOf(
        tokenAddress,
        userAdd //have to change
    );

    const lockedFunds = await exchange.lockedFunds(userAdd, tokenAddress);

    console.log(
        `Balance ${_tokenName}: ${(
            transactionResponse /
            10 ** decimals
        ).toString()}, Locked ${_tokenName}: ${(
            lockedFunds /
            10 ** decimals
        ).toString()}`
    );
}

async function main() {
    await getBalance("USDC");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
