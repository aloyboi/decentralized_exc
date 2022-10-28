const { ethers, getNamedAccounts, network } = require("hardhat");
const {
    networkConfig,
    developmentChain,
} = require("../../helper-hardhat-config");

async function addToken(_tokenName) {
    const { deployer } = await getNamedAccounts();
    const exchange = await ethers.getContract("Exchange", deployer);
    console.log(`Got contract Exchange at ${exchange.address}`);
    console.log(`Adding ${_tokenName} to list of verified tokens on DEX`);

    //Token address to be taken from user input, for now use usdc token
    let tokenAddress;
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    //Local Blockchain
    if (developmentChain.includes(network.name)) {
        //If local blockchain we only test with ETH token
        if (_tokenName == "ETH")
            tokenAddress = "0x0000000000000000000000000000000000000000";
        else if (_tokenName == "MATIC")
            tokenAddress = "0xA108830A23A9a054FfF4470a8e6292da0886A4D4";
    }
    //Testnet
    else {
        //any testnet ERC20 token (have to change)
        const chainId = network.config.chainId;
        tokenAddress = networkConfig[chainId][_tokenName][address];
    }

    const transactionResponse = await exchange.addToken(tokenAddress);
    await transactionResponse.wait();
    console.log(
        `Successfully added ${_tokenName} to list of verified tokens on DEX!`
    );
}

async function main() {
    //to make variable
    await addToken("MATIC");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
