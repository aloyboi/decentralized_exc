const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function getUserOrders(_tokenName, _side) {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);

    //Token address to be taken from user input, for now use usdc token
    let tokenAddress;
    let userAdd;
    let length;
    let orders = [[]];
    let decimals = 18;

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with testUSDC token or ETH token

        tokenAddress = "0x0000000000000000000000000000000000000000";
        userAdd = deployer;
        //userAdd = addr1.address;
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        const chainId = network.config.chainId;
        tokenAddress = networkConfig[chainId][_tokenName][address];
        userAdd = network.config.account;
    }

    if (_side == "0") {
        length = await exchange.getOrderLength("0", tokenAddress);
        for (let i = 0; i < length; i++) {
            orders[i] = await exchange.getOrder(tokenAddress, i, _side);
            orders[i][1] = (orders[i][1] / 10 ** decimals).toString();
            orders[i][3] = (orders[i][3] / 10 ** decimals).toString();
            if (orders[i][2] != userAdd) orders.pop();
        }
    } else if (_side == "1") {
        length = await exchange.getOrderLength("1", tokenAddress);

        for (let i = 0; i < length; i++) {
            orders[i] = await exchange.getOrder(tokenAddress, i, _side);
            orders[i][1] = (orders[i][1] / 10 ** decimals).toString();
            orders[i][3] = (orders[i][3] / 10 ** decimals).toString();
            if (orders[i][2] != userAdd) orders.pop();
        }
    }

    console.log(`${orders}`);
}

async function main() {
    //swap between 0 & 1 for buy/sell orders
    await getUserOrders("ETH", "1");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
