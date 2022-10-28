const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Exchange", async function () {
    //Note that total supply only 10000
    let totalSupply = "10000000000000000000000";
    let Token;
    let testUSDC;
    let exchange;
    let Exchange;
    let owner;
    let addr1;
    let addr2;
    let addrs;
    let amount;
    let price;
    let totalAmount;
    let ethAdd;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        amount = (10 * 10 ** 18).toString();
        price = "15";
        const decimals = 18;
        const input = (10 * 15).toString(); // Note: this is a string, e.g. user input
        totalAmount = ethers.utils.parseUnits(input, decimals);

        ethAdd = "0x0000000000000000000000000000000000000000";

        //Deploy Token Address
        Token = await ethers.getContractFactory("testUSDC");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        testUSDC = await Token.deploy(totalSupply);

        //Deploy Exchange address
        exchange = await ethers.getContractFactory("Exchange");
        Exchange = await exchange.deploy(testUSDC.address);

        //Deploy Wallet address
        wallet = await ethers.getContractFactory("Wallet");
        Wallet = await wallet.deploy(Exchange.address);
    });

    describe("Creating new Limit Sell Orders", async function () {
        it("Should not allow new Limit Sell Orders if insufficient ETH deposited to sell", async function () {
            await expect(
                Exchange.createLimitSellOrder(ethAdd, amount, price)
            ).to.be.rejectedWith("Insufficient tokens");
        });

        it("Should create a new Limit Sell Order if sufficient ETH deposited to fill sell order", async function () {
            const depositETH = await Wallet.depositETH({ value: amount });

            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                amount
            );

            //Place sell order for ETH
            const orderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.createLimitSellOrder(
                ethAdd,
                (5 * 10 ** 18).toString(),
                price
            );
            const newOrderId = await Exchange.s_orderId();

            expect(
                await Exchange.lockedFunds(owner.address, ethAdd)
            ).to.be.equal((5 * 10 ** 18).toString());

            await expect(newOrderId).to.be.equal(orderId + 1);

            await expect(
                Exchange.createLimitSellOrder(
                    ethAdd,
                    (6 * 10 ** 18).toString(),
                    price
                )
            ).to.be.revertedWith("Insufficient tokens");
        });

        it("Should not allow new Limit Sell Orders if token not available on DEX", async function () {
            const depositEth = await Wallet.depositETH({ value: amount });

            await expect(
                //Solana given
                Exchange.createLimitSellOrder(
                    "0x41848d32f281383f214c69b7b248dc7c2e0a7374",
                    amount,
                    price
                )
            ).to.be.rejectedWith("Token unavailable in DEX");
        });
    });
});
