const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function cancelOrder(_side, _id, _tokenName) {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);
    console.log(`Cancelling ${_side} Limit Order ID ${_id}`);

    //Token address to be taken from user input, for now use usdc token
    let tokenAddress;
    let side;

    if (_side == "BUY") {
        side = 0;
    } else {
        side = 1;
    }

    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with ETH token
        tokenAddress = "0x0000000000000000000000000000000000000000";
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        const chainId = network.config.chainId;
        tokenAddress = networkConfig[chainId][_tokenName][address];
    }

    const transactionResponse = await exchange.cancelOrder(
        side, //assumed to be ETH address
        _id,
        tokenAddress
    );
    await transactionResponse.wait();
    console.log(`Successfully cancelled ${_side} Limit Order ID ${_id}!`);
}

async function main() {
    //to make variable
    await cancelOrder("SELL", "7", "ETH");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
