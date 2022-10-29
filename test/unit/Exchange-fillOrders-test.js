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
    const decimals = 18;

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

    describe("Filling Orders", async function () {
        it("Should completely fill a Buy & Sell Order", async function () {
            //Create a Buy Order
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            const buyOrderId = await Exchange.s_orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                amount,
                price
            );

            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal(totalAmount.toString());

            //Create a Sell Order
            const depositETH = await Wallet.connect(addr1).depositETH({
                value: amount,
            });

            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                amount
            );

            const sellOrderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.connect(
                addr1
            ).createLimitSellOrder(ethAdd, amount, price);

            expect(
                await Exchange.lockedFunds(addr1.address, ethAdd)
            ).to.be.equal(amount);

            //Match Order
            const fillOrder = await Exchange.matchOrders(ethAdd, buyOrderId, 0);

            //Orders should not exist
            expect(
                await Exchange.orderExists(buyOrderId, 0, ethAdd)
            ).to.be.equal(false);
            expect(
                await Exchange.orderExists(sellOrderId, 1, ethAdd)
            ).to.be.equal(false);

            //Balance should be updated

            //Buyer
            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                amount
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(0);
            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal(0);

            //Seller
            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                0
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr1.address)
            ).to.be.equal(totalAmount);
            expect(
                await Exchange.lockedFunds(addr1.address, ethAdd)
            ).to.be.equal(0);
        });

        it("Should partially fill a Buy Order", async function () {
            //Create a Buy Order
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            const buyOrderId = await Exchange.s_orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                amount,
                price
            );

            //Create a Sell Order
            const depositETH = await Wallet.connect(addr1).depositETH({
                value: amount,
            });

            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                amount
            );

            //change to verify
            const sellAmount = (5 * 10 ** 18).toString();

            const sellOrderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.connect(
                addr1
            ).createLimitSellOrder(ethAdd, sellAmount, price);

            //Match Order
            const fillOrder = await Exchange.matchOrders(ethAdd, buyOrderId, 0);

            expect(
                await Exchange.orderExists(buyOrderId, 0, ethAdd)
            ).to.be.equal(true);

            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal((price * 5).toString());

            expect(
                await Exchange.orderExists(sellOrderId, 1, ethAdd)
            ).to.be.equal(false);

            //Balance should be updated

            // //Buyer
            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                sellAmount
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(
                (totalAmount - (sellAmount * price) / 10 ** 18).toString()
            );

            //Seller
            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                (amount - sellAmount).toString()
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr1.address)
            ).to.be.equal(((sellAmount * price) / 10 ** 18).toString());
        });

        it("Should partially fill a Sell Order", async function () {
            //Create a Buy Order
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            //change to verify
            const buyAmount = (7.5 * 10 ** 18).toString();

            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            const buyOrderId = await Exchange.s_orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                buyAmount,
                price
            );

            //Create a Sell Order
            const depositETH = await Wallet.connect(addr1).depositETH({
                value: amount,
            });

            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                amount
            );

            const sellOrderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.connect(
                addr1
            ).createLimitSellOrder(ethAdd, amount, price);

            //Match Order
            const fillOrder = await Exchange.matchOrders(
                ethAdd,
                sellOrderId,
                1
            );

            expect(
                await Exchange.orderExists(buyOrderId, 0, ethAdd)
            ).to.be.equal(false);
            expect(
                await Exchange.orderExists(sellOrderId, 1, ethAdd)
            ).to.be.equal(true);
            expect(
                await Exchange.lockedFunds(addr1.address, ethAdd)
            ).to.be.equal((amount - 7.5 * 10 ** 18).toString());

            //Balance should be updated

            //Buyer
            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                buyAmount
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(
                (totalAmount - (buyAmount * price) / 10 ** 18).toString()
            );

            //Seller
            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                (amount - buyAmount).toString()
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr1.address)
            ).to.be.equal(((buyAmount * price) / 10 ** 18).toString());
        });

        it("Should fill Sell Order if Price Target of Sell Order is met, takes SellPrice of whichever is higher", async function () {
            //Create a Buy Order
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            const buyOrderId = await Exchange.s_orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                amount,
                price
            );

            //Create a Sell Order
            const depositETH = await Wallet.connect(addr1).depositETH({
                value: amount,
            });

            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                amount
            );

            const sellPrice = (10 * 10 ** 18).toString();

            const sellOrderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.connect(
                addr1
            ).createLimitSellOrder(ethAdd, amount, sellPrice);

            //Match Order
            const fillOrder = await Exchange.matchOrders(
                ethAdd,
                sellOrderId,
                1
            );

            expect(
                await Exchange.orderExists(buyOrderId, 0, ethAdd)
            ).to.be.equal(false);
            expect(
                await Exchange.orderExists(sellOrderId, 1, ethAdd)
            ).to.be.equal(false);

            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal(0);
            expect(
                await Exchange.lockedFunds(addr1.address, ethAdd)
            ).to.be.equal(0);

            //Balance should be updated, in this case buyer's buy price is selected since it is higher than sell price

            //Buyer
            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                amount
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(
                (totalAmount - (amount * price) / 10 ** 18).toString()
            );

            //Seller
            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                0
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr1.address)
            ).to.be.equal(((amount * price) / 10 ** 18).toString());
        });

        it("Should fill Buy Order if Price Target of Buy Order is met, takes buyPrice of whichever is higher", async function () {
            //Create a Buy Order
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            const buyOrderId = await Exchange.s_orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                amount,
                price
            );

            //Create a Sell Order
            const depositETH = await Wallet.connect(addr1).depositETH({
                value: amount,
            });

            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                amount
            );

            const sellPrice = (10 * 10 ** 18).toString();

            const sellOrderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.connect(
                addr1
            ).createLimitSellOrder(ethAdd, amount, sellPrice);

            //Match Order
            const fillOrder = await Exchange.matchOrders(ethAdd, buyOrderId, 0);

            expect(
                await Exchange.orderExists(buyOrderId, 0, ethAdd)
            ).to.be.equal(false);
            expect(
                await Exchange.orderExists(sellOrderId, 1, ethAdd)
            ).to.be.equal(false);
            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal(0);
            expect(
                await Exchange.lockedFunds(addr1.address, ethAdd)
            ).to.be.equal(0);

            //Balance should be updated, in this case buyer's buy price is selected since it is higher than sell price

            //Buyer
            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                amount
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(
                (totalAmount - amount * (sellPrice / 10 ** 18)).toString()
            );

            //Seller
            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                0
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr1.address)
            ).to.be.equal(((amount * sellPrice) / 10 ** 18).toString());
        });

        it("Should not fill Buy/Sell Order if Price Target of Order is not met", async function () {
            //Create a Buy Order
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            const buyOrderId = await Exchange.s_orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                amount,
                price
            );

            //Create a Sell Order
            const depositETH = await Wallet.connect(addr1).depositETH({
                value: amount,
            });

            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                amount
            );

            const sellPrice = (20 * 10 ** 18).toString();

            const sellOrderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.connect(
                addr1
            ).createLimitSellOrder(ethAdd, amount, sellPrice);

            //Match Order - can change btwn Buyer or Seller
            const fillOrder = await Exchange.matchOrders(
                ethAdd,
                sellOrderId,
                1
            );

            expect(
                await Exchange.orderExists(buyOrderId, 0, ethAdd)
            ).to.be.equal(true);
            expect(
                await Exchange.orderExists(sellOrderId, 1, ethAdd)
            ).to.be.equal(true);
            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal(totalAmount);
            expect(
                await Exchange.lockedFunds(addr1.address, ethAdd)
            ).to.be.equal(amount);

            //Buyer
            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                0
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            //Seller
            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                amount
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr1.address)
            ).to.be.equal(0);
        });

        it("Should fill multiple sell orders that match price target of buy order", async function () {
            //Create a Buy Order
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            const buyOrderId = await Exchange.s_orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                amount,
                price
            );

            const depositETH = await Wallet.connect(addr1).depositETH({
                value: amount,
            });

            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                amount
            );

            const sellOrderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.connect(
                addr1
            ).createLimitSellOrder(ethAdd, (1 * 10 ** 18).toString(), price);

            const depositETH1 = await Wallet.connect(addr2).depositETH({
                value: amount,
            });

            expect(await Exchange.s_tokens(ethAdd, addr2.address)).to.be.equal(
                amount
            );

            const sellOrderId1 = await Exchange.s_orderId();
            const sellOrder1 = await Exchange.connect(
                addr2
            ).createLimitSellOrder(ethAdd, (3 * 10 ** 18).toString(), price);

            //Match Order - can change btwn Buyer or Seller
            const fillOrder = await Exchange.matchOrders(ethAdd, buyOrderId, 0);

            expect(
                await Exchange.orderExists(buyOrderId, 0, ethAdd)
            ).to.be.equal(true);
            expect(
                await Exchange.orderExists(sellOrderId, 1, ethAdd)
            ).to.be.equal(false);
            expect(
                await Exchange.orderExists(sellOrderId1, 1, ethAdd)
            ).to.be.equal(false);

            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal(((6 * 10 ** 18 * price) / 10 ** 18).toString());
            expect(
                await Exchange.lockedFunds(addr1.address, ethAdd)
            ).to.be.equal(0);
            expect(
                await Exchange.lockedFunds(addr2.address, ethAdd)
            ).to.be.equal(0);

            //Buyer
            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                (4 * 10 ** 18).toString()
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal((totalAmount - 4 * price).toString());

            //Sellers
            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                (amount - 1 * 10 ** 18).toString()
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr1.address)
            ).to.be.equal((1 * price).toString());

            expect(await Exchange.s_tokens(ethAdd, addr2.address)).to.be.equal(
                (amount - 3 * 10 ** 18).toString()
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr2.address)
            ).to.be.equal((3 * price).toString());
        });

        it("Should fill multiple buy orders that match price target of sell order", async function () {
            //Create multiple Buy Orders
            const approve = await testUSDC.approve(Wallet.address, totalAmount);

            const depositToken = await Wallet.depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal(totalAmount);

            const buyOrderId = await Exchange.s_orderId();
            const buyOrder = await Exchange.createLimitBuyOrder(
                ethAdd,
                (2 * 10 ** 18).toString(),
                price
            );

            const transferToWallet = await testUSDC.transfer(
                addr1.address,
                totalAmount
            );

            const approve1 = await testUSDC
                .connect(addr1)
                .approve(Wallet.address, totalAmount);

            const depositToken1 = await Wallet.connect(addr1).depositToken(
                testUSDC.address,
                totalAmount
            );

            expect(
                await Exchange.s_tokens(testUSDC.address, addr1.address)
            ).to.be.equal(totalAmount);

            const buyOrderId1 = await Exchange.s_orderId();
            const buyOrder1 = await Exchange.connect(addr1).createLimitBuyOrder(
                ethAdd,
                (2 * 10 ** 18).toString(),
                price
            );

            const depositETH = await Wallet.connect(addr2).depositETH({
                value: amount,
            });

            expect(await Exchange.s_tokens(ethAdd, addr2.address)).to.be.equal(
                amount
            );

            const sellOrderId = await Exchange.s_orderId();
            const sellOrder = await Exchange.connect(
                addr2
            ).createLimitSellOrder(ethAdd, amount, price);

            //Match Order - can change btwn Buyer or Seller
            const fillOrder = await Exchange.connect(addr2).matchOrders(
                ethAdd,
                sellOrderId,
                1
            );

            expect(
                await Exchange.orderExists(buyOrderId, 0, ethAdd)
            ).to.be.equal(false);
            expect(
                await Exchange.orderExists(buyOrderId1, 0, ethAdd)
            ).to.be.equal(false);
            expect(
                await Exchange.orderExists(sellOrderId, 1, ethAdd)
            ).to.be.equal(true);

            expect(
                await Exchange.lockedFunds(owner.address, testUSDC.address)
            ).to.be.equal(0);
            expect(
                await Exchange.lockedFunds(addr1.address, testUSDC.address)
            ).to.be.equal(0);
            expect(
                await Exchange.lockedFunds(addr2.address, ethAdd)
            ).to.be.equal((6 * 10 ** 18).toString());

            //Buyers
            expect(await Exchange.s_tokens(ethAdd, owner.address)).to.be.equal(
                (2 * 10 ** 18).toString()
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, owner.address)
            ).to.be.equal((totalAmount - 2 * price).toString());

            expect(await Exchange.s_tokens(ethAdd, addr1.address)).to.be.equal(
                (2 * 10 ** 18).toString()
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr1.address)
            ).to.be.equal((totalAmount - 2 * price).toString());

            //Seller
            expect(await Exchange.s_tokens(ethAdd, addr2.address)).to.be.equal(
                (amount - 4 * 10 ** 18).toString()
            );
            expect(
                await Exchange.s_tokens(testUSDC.address, addr2.address)
            ).to.be.equal((4 * price).toString());
        });
    });
});
