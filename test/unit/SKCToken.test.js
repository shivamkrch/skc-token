const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers } = require("hardhat");
const { INITIAL_SUPPLY } = require("../../helper-hardhat-config");

describe("SKCToken Unit Test", function () {
  //Multipler is used to make reading the math easier because of the 18 decimal points
  const multiplier = 10 ** 18;
  let skcToken, deployer, user1;
  beforeEach(async function () {
    const accounts = await getNamedAccounts();
    deployer = accounts.deployer;
    user1 = accounts.user1;

    // await deployments.fixture("all");
    skcToken = await ethers.getContract("SKCToken", deployer);
  });
  it("was deployed", async () => {
    assert(skcToken.address);
  });
  describe("constructor", () => {
    it("Should have correct INITIAL_SUPPLY of token ", async () => {
      const totalSupply = await skcToken.totalSupply();
      assert.equal(totalSupply.toString(), INITIAL_SUPPLY);
    });
    it("initializes the token with the correct name and symbol ", async () => {
      const name = (await skcToken.name()).toString();
      assert.equal(name, "SKC Token");

      const symbol = (await skcToken.symbol()).toString();
      assert.equal(symbol, "SKC");
    });
  });
  describe("minting", () => {
    it("user can not mint", async () => {
      try {
        await skcToken._mint(deployer, 100);
        assert(false);
      } catch (e) {
        assert(e);
      }
    });
  });
  describe("transfers", () => {
    it("Should be able to transfer tokens successfully to an address", async () => {
      const tokensToSend = ethers.utils.parseEther("10");
      await skcToken.transfer(user1, tokensToSend);
      expect(await skcToken.balanceOf(user1)).to.equal(tokensToSend);
    });
    it("emits an transfer event, when an transfer occurs", async () => {
      await expect(
        skcToken.transfer(user1, (10 * multiplier).toString())
      ).to.emit(skcToken, "Transfer");
    });
    describe("allowances", () => {
      const amount = (20 * multiplier).toString();
      beforeEach(async () => {
        playerToken = await ethers.getContract("SKCToken", user1);
      });
      it("Should approve other address to spend token", async () => {
        const tokensToSpend = ethers.utils.parseEther("5");
        await skcToken.approve(user1, tokensToSpend);
        const skcToken1 = await ethers.getContract("SKCToken", user1);
        await skcToken1.transferFrom(deployer, user1, tokensToSpend);
        expect(await skcToken1.balanceOf(user1)).to.equal(tokensToSpend);
      });
      it("doesn't allow an unnaproved member to do transfers", async () => {
        //Deployer is approving that user1 can spend 20 of their precious OT's

        await expect(
          playerToken.transferFrom(deployer, user1, amount)
        ).to.be.revertedWith("ERC20: insufficient allowance");
      });
      it("emits an approval event, when an approval occurs", async () => {
        await expect(skcToken.approve(user1, amount)).to.emit(
          skcToken,
          "Approval"
        );
      });
      it("the allowance being set is accurate", async () => {
        await skcToken.approve(user1, amount);
        const allowance = await skcToken.allowance(deployer, user1);
        assert.equal(allowance.toString(), amount);
      });
      it("won't allow a user to go over the allowance", async () => {
        await skcToken.approve(user1, amount);
        await expect(
          playerToken.transferFrom(
            deployer,
            user1,
            (40 * multiplier).toString()
          )
        ).to.be.revertedWith("ERC20: insufficient allowance");
      });
    });
  });
});
