const { use } = require("chai");
const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function getFilledOrders() {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);

    //Token address to be taken from user input, for now use usdc token
    let userAdd;
    let length;
    let orders = [[]];
    let decimals = 18;
    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with testUSDC token or ETH token
        userAdd = deployer;
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        userAdd = network.config.account;
    }

    length = await exchange.getFilledOrderLength(userAdd);
    for (let i = 0; i < length; i++) {
        orders[i] = await exchange.getFilledOrder(userAdd, i);
        orders[i][1] = (orders[i][1] / 10 ** decimals).toString();
        orders[i][3] = (orders[i][3] / 10 ** decimals).toString();
    }

    console.log(`${orders}`);
}

async function main() {
    //swap between 0 & 1 for buy/sell orders
    await getFilledOrders();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
