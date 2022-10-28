// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Why is this a library and not abstract?
// Why not an interface?
contract PriceChecker is Ownable {
    // We could make this public, but then we'd have to deploy it
    _priceFeed[] public priceFeeds;

    struct _priceFeed {
        string name;
        AggregatorV3Interface priceFeed;
    }

    function addPriceFeed(string memory _name, address _address)
        external
        onlyOwner
    {
        _priceFeed[] memory pricefeed = priceFeeds;
        bool isAdded = false;
        for (uint256 i = 0; i < pricefeed.length; i++) {
            if (
                keccak256(abi.encodePacked(_name)) ==
                keccak256(abi.encodePacked(pricefeed[i].name))
            ) {
                isAdded = true;
                break;
            }
        }
        require(!isAdded, "Price Feed already added");
        AggregatorV3Interface priceFeed = AggregatorV3Interface(_address);
        priceFeeds.push(_priceFeed(_name, priceFeed));
    }

    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        // Goerli ETH / USD Address
        // https://docs.chain.link/docs/ethereum-addresses/
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        // );
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        // ETH/USD rate in 18 digit
        return uint256(answer * 10000000000);
        // or (Both will do the same thing)
        // return uint256(answer * 1e10); // 1* 10 ** 10 == 10000000000
    }

    // 1000000000
    function getConversionRate(
        uint256 _ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * _ethAmount) / 1000000000000000000;
        // or (Both will do the same thing)
        // uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18; // 1 * 10 ** 18 == 1000000000000000000
        // the actual ETH/USD conversion rate, after adjusting the extra 0s.
        return ethAmountInUsd;
    }
}
