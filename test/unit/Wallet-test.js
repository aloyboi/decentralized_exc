const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Wallet", async function () {
    let totalSupply = "10000000000000000000000";
    let Token;
    let testUSDC;
    let exchange;
    let Exchange;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.

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

    describe("Constructor", async function () {
        it("Correct Address Owner", async function () {
            const ownerAdd = await Wallet.Owner();
            assert.equal(ownerAdd, owner.address);
        });
    });

    // You can nest describe calls to create subsections.
    describe("Transactions", async function () {
        let eth;
        let ethAdd;
        describe("Depositing & Withdrawing ETH", async function () {
            beforeEach(async function () {
                eth = await ethers.utils.parseEther("0.1");
                ethAdd = "0x0000000000000000000000000000000000000000";
            });

            it("Should deposit ETH into DEX when enough balance", async function () {
                //Transfer 0.1 ETH into Exchange Contract
                const tx = await Wallet.depositETH({
                    value: eth,
                });
                // await tx.wait(1);
                // const amountBalance = await Exchange.s_tokens(
                //     ethAdd,
                //     owner.address
                // );
                // await expect(amountBalance).to.be.equal(eth);
            });

            it("Should withdraw ETH from DEX if enough balance", async function () {
                //Transfer 0.1 ETH into Exchange Contract
                const tx = await Wallet.depositETH({
                    value: eth,
                });
                await tx.wait(1);

                const txResponse = await Wallet.withdrawETH(eth);
                await txResponse.wait(1);

                const amountBalance = await Exchange.s_tokens(
                    ethAdd,
                    owner.address
                );
                await expect(amountBalance).to.be.equal(0);
            });

            it("Should fail if sender doesn’t have enough ETH in DEX", async function () {
                await expect(Wallet.withdrawETH(eth)).to.be.reverted;
            });
        });

        describe("Depositing & Withdrawing testUSDC tokens", async function () {
            let amount;
            beforeEach(async function () {
                amount = "10000000000000000000";
            });

            it("Should deposit correct amount of testUSDC tokens into Exchange", async function () {
                const sendToken = await testUSDC.transfer(
                    addr1.address,
                    amount
                );

                //testUSDC contract approve Wallet to spend token
                const approve = await testUSDC
                    .connect(addr1)
                    .approve(Wallet.address, amount);
                await approve.wait(1);

                const tx = await Wallet.connect(addr1).depositToken(
                    testUSDC.address,
                    amount
                );
                await tx.wait(1);

                const tokenBalance = await Exchange.s_tokens(
                    testUSDC.address,
                    addr1.address
                );

                expect(tokenBalance).to.be.equal(amount);
            });

            it("Should fail if sender does not have enough testUSDC tokens", async function () {
                //Should fail even with approve
                const approve = await testUSDC
                    .connect(addr1)
                    .approve(Wallet.address, amount);
                await approve.wait(1);

                await expect(
                    Wallet.connect(addr1).depositToken(testUSDC.address, amount)
                ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            });

            it("Should withdraw tokens if sender has enough balance in DEX", async function () {
                const sendToken = await testUSDC.transfer(
                    addr1.address,
                    amount
                );

                //testUSDC contract approve Exchange to spend token
                const approve = await testUSDC
                    .connect(addr1)
                    .approve(Wallet.address, amount);
                await approve.wait(1);

                const tx = await Wallet.connect(addr1).depositToken(
                    testUSDC.address,
                    amount
                );
                await tx.wait(1);

                expect(
                    await Exchange.s_tokens(testUSDC.address, addr1.address)
                ).to.be.equal(amount);

                const txReceipt = await Wallet.connect(addr1).withdrawToken(
                    testUSDC.address,
                    amount
                );
                await txReceipt.wait(1);

                expect(
                    await Exchange.s_tokens(testUSDC.address, addr1.address)
                ).to.be.equal("0");
            });

            it("Should not allow withdrawal of s_tokens if sender does not have enough balance in DEX", async function () {
                await expect(
                    Wallet.connect(addr2).withdrawToken(
                        testUSDC.address,
                        amount
                    )
                ).to.be.reverted;
            });
        });
    });
});
