const { expect } = require("chai");

describe("testUSDC", function () {
    let totalSupply = "10000000000000000000000"; // 10000 * 1e18
    let Token;
    let testUSDC;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        Token = await ethers.getContractFactory("testUSDC");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        testUSDC = await Token.deploy(totalSupply);
    });

    // You can nest describe calls to create subsections.
    describe("Deployment", function () {
        it("Should assign the total supply of s_tokens to the owner", async function () {
            const ownerBalance = await testUSDC.balanceOf(owner.address);
            expect(await testUSDC.totalSupply()).to.equal(ownerBalance);
        });
    });

    describe("Transactions", function () {
        it("Should transfer s_tokens between accounts", async function () {
            // Transfer 50 s_tokens from owner to addr1
            await testUSDC.transfer(addr1.address, 50);
            const addr1Balance = await testUSDC.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(50);

            // Transfer 50 s_tokens from addr1 to addr2
            // We use .connect(signer) to send a transaction from another account
            await testUSDC.connect(addr1).transfer(addr2.address, 50);
            const addr2Balance = await testUSDC.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });

        it("Should fail if sender doesn’t have enough s_tokens", async function () {
            const initialOwnerBalance = await testUSDC.balanceOf(owner.address);

            // Try to send 1 token from addr1 (0 s_tokens) to owner (1000000 s_tokens).
            // `require` will evaluate false and revert the transaction.
            await expect(
                testUSDC.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

            // Owner balance shouldn't have changed.
            expect(await testUSDC.balanceOf(owner.address)).to.equal(
                initialOwnerBalance
            );
        });
    });
});
