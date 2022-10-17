const networkConfig = {
    5: {
        name: "goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
        btcUsdPriceFeed: "	0xA39434A63A52E749F02807ae27335515BA4b07F7",
    },
};

const developmentChain = ["hardhat", "localhost"];
const DECIMALS = 8;
const initialAns = 200000000000;

module.exports = { networkConfig, developmentChain, DECIMALS, initialAns };
