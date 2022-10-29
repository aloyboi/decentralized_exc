const networkConfig = {
    5: {
        name: "goerli",
        //Add Token addresses on Georli Network
        USDC: {
            address: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
            pricefeed: "",
        },
        MATIC: {
            address: "0xA108830A23A9a054FfF4470a8e6292da0886A4D4",
            pricefeed: "",
        },
        SHIB: {
            address: "0x058d6Fb2828608C0422BB6C89F77CCaA9ea7A9b4",
            pricefeed: "",
        },
    },
};

const developmentChain = ["hardhat", "localhost"];

module.exports = { networkConfig, developmentChain };
