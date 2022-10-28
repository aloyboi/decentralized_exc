const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function getOrderBook(_tokenName, _side) {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);

    //Token address to be taken from user input, for now use usdc token
    let tokenAddress;
    let userAdd;
    let decimals = 18;
    let length;
    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with testUSDC token or ETH token
        if (_tokenName == "USDC") {
            const testUSDC = await deployments.get("testUSDC");
            tokenAddress = testUSDC.address;
        } else if (_tokenName == "ETH") {
            tokenAddress = "0x0000000000000000000000000000000000000000";
        }
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        const chainId = network.config.chainId;
        tokenAddress = networkConfig[chainId][_tokenName][address];
        //decimals = networkConfig[chainId][_tokenName][decimal];
    }

    //this is the array we need for front-end
    let orders = [[]];

    if (_side == "0") {
        length = await exchange.getOrderLength("0", tokenAddress);
        for (let i = 0; i < length; i++) {
            orders[i] = await exchange.getOrder(tokenAddress, i, _side);
            //Converting decimals
            orders[i][1] = (orders[i][1] / 10 ** decimals).toString();
            orders[i][3] = (orders[i][3] / 10 ** decimals).toString();
        }
    } else if (_side == "1") {
        length = await exchange.getOrderLength("1", tokenAddress);

        for (let i = 0; i < length; i++) {
            orders[i] = await exchange.getOrder(tokenAddress, i, _side);
            //Converting decimals
            orders[i][1] = (orders[i][1] / 10 ** decimals).toString();
            orders[i][3] = (orders[i][3] / 10 ** decimals).toString();
        }
    }

    console.log(`${orders}`);
}

async function main() {
    //swap between 0 & 1 for buy/sell orders
    await getOrderBook("ETH", "1");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
