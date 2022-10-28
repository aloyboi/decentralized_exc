const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Exchange", async function () {
    //Note that total supply only 10000
    let totalSupply = "1000000000000000000000000";
    let Token;
    let testUSDC;
    let exchange;
    let Exchange;
    let owner;
    let ethAdd;
    let amount;
    let price;
    let totalAmount;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        amount = (10 * 10 ** 18).toString();
        price = "15";
        const decimals = 18;
        const input = (amount * price).toString(); // Note: this is a string, e.g. user input
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

    describe("Cancelling Orders", async function () {
        it("Should revert when invalid Order Id to cancel order", async function () {
            await expect(
                Exchange.cancelOrder(0, 100, ethAdd)
            ).to.be.rejectedWith("Invalid Order ID");
        });

        it("Should cancel a valid Buy Order if is owner ", async function () {
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
            //Order should exist
            expect(await Exchange.orderExists(orderId, 0, ethAdd)).to.be.equal(
                true
            );
            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal((amount * price).toString());

            //Cancel buy order
            const cancelOrder = await Exchange.cancelOrder(0, orderId, ethAdd);

            //Order should not exist
            expect(await Exchange.orderExists(orderId, 0, ethAdd)).to.be.equal(
                false
            );
            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal(0);
        });

        it("Should cancel a valid Sell Order if it is owner ", async function () {
            const depositETH = await Wallet.depositETH({ value: amount });

            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                amount
            );

            //Place sell order for ETH
            const orderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.createLimitSellOrder(
                ethAdd,
                amount,
                price
            );
            const newOrderId = await Exchange.s_orderId();

            //Order should be valid
            expect(await Exchange.orderExists(orderId, 1, ethAdd)).to.be.equal(
                true
            );
            expect(
                await Exchange.lockedFunds(owner.address, ethAdd)
            ).to.be.equal(amount);

            //Cancel Order
            const cancelOrder = await Exchange.cancelOrder(1, orderId, ethAdd);

            //Order should be invalid
            expect(await Exchange.orderExists(orderId, 1, ethAdd)).to.be.equal(
                false
            );
            expect(
                await Exchange.lockedFunds(owner.address, ethAdd)
            ).to.be.equal(0);
        });

        it("Should not be able to cancel order if not order owner ", async function () {
            const depositETH = await Wallet.depositETH({ value: amount });

            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                amount
            );

            //Place sell order for ETH
            const orderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.createLimitSellOrder(
                ethAdd,
                amount,
                price
            );
            const newOrderId = await Exchange.s_orderId();

            //Order should be valid
            expect(await Exchange.orderExists(orderId, 1, ethAdd)).to.be.equal(
                true
            );
            //Cancel Order should fail
            await expect(
                Exchange.connect(addr2).cancelOrder(1, orderId, ethAdd)
            ).to.be.revertedWith("Not Order Owner");
        });
    });
});
