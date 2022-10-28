const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function createLimitSellOrder(_tokenName, _amount, _price) {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);
    console.log(`Creating new Sell Limit Order`);

    //Token address to be taken from user input, for now use usdc token
    let tokenAddress;
    let amount;
    let decimals;
    let amountInDecimals;
    let priceInDecimals;

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with ETH token

        tokenAddress = "0x0000000000000000000000000000000000000000";
        amount = _amount;
        decimals = 18;
        amountInDecimals = ethers.utils.parseUnits(amount, decimals);
        priceInDecimals = ethers.utils.parseUnits(_price, decimals);
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        const chainId = network.config.chainId;
        tokenAddress = networkConfig[chainId][_tokenName][address];
        //decimals = networkConfig[chainId][_tokenName][decimal];
        amountInDecimals = ethers.utils.parseUnits(amount, decimals);
        priceInDecimals = ethers.utils.parseUnits(_price, decimals);
    }

    const orderId = await exchange.s_orderId();

    const transactionResponse = await exchange.createLimitSellOrder(
        tokenAddress, //assumed to be ETH address
        amountInDecimals,
        priceInDecimals
    );
    await transactionResponse.wait();
    console.log(
        `Successfully placed Limit Sell Order of ${amount} ${_tokenName} @ ${_price} USDC/${_tokenName}, Order ID: ${orderId}!`
    );

    console.log(`Trying to fill order...`);
    const fillOrder = await exchange.matchOrders(tokenAddress, orderId, "1");
    await fillOrder.wait(1);
}

async function main() {
    await createLimitSellOrder("ETH", "5", "1500.2454");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });