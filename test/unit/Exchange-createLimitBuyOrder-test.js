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
        Exchange = await exchange.deploy();
    });

    describe("Creating new Limit Buy Orders", async function () {
        it("Should not allow new Limit Orders if insufficient testUSDC deposited to buy", async function () {
            await expect(
                Exchange.createLimitBuyOrder(
                    ethAdd,
                    testUSDC.address,
                    amount,
                    price
                )
            ).to.be.rejectedWith("Insufficient USDC in exchange");
        });

        it("Should create a new Limit Order if sufficient testUSDC deposited to fill buy order", async function () {
            const approve = await testUSDC.approve(
                Exchange.address,
                totalAmount
            );

            const depositToken = await Exchange.depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            //Place buy order for ETH
            const orderId = await Exchange.orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                testUSDC.address,
                amount,
                price
            );
            const newOrderId = await Exchange.orderId();

            const validOrder = await Exchange.orderExists(orderId, 0, ethAdd);

            await expect(newOrderId).to.be.equal(orderId + 1);
            await expect(validOrder).to.be.equal(true);
        });
    });
});
