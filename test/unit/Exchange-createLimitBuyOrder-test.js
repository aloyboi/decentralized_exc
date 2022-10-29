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
    let decimals = 18;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        amount = await ethers.utils.parseUnits("10", decimals);
        price = await ethers.utils.parseUnits("15.12", decimals);

        totalAmount = await ethers.utils.parseUnits("151.2", decimals);

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

    describe("Creating new Limit Buy Orders", async function () {
        it("Should not allow new Limit Buy Orders if insufficient testUSDC deposited to buy", async function () {
            await expect(
                Exchange.createLimitBuyOrder(ethAdd, amount, price)
            ).to.be.rejectedWith("Insufficient USDC");
        });

        it("Should create a new Limit Buy Order if sufficient testUSDC deposited to fill buy order", async function () {
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            //Place buy order for ETH
            const orderId = await Exchange.s_orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                amount,
                price
            );
            const newOrderId = await Exchange.s_orderId();

            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal(totalAmount);

            await expect(newOrderId).to.be.equal(orderId + 1);

            await expect(
                Exchange.createLimitBuyOrder(ethAdd, amount, price)
            ).to.be.revertedWith("Insufficient USDC");
        });

        it("Should not allow new Limit Buy Orders if token not available on DEX", async function () {
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            await expect(
                //Solana given
                Exchange.createLimitBuyOrder(
                    "0x41848d32f281383f214c69b7b248dc7c2e0a7374",
                    amount,
                    price
                )
            ).to.be.rejectedWith("Token unavailable in DEX");
        });
    });
});
