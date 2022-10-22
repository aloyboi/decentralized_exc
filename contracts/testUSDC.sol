/* ERC 20 constructor takes in 2 strings, feel free to change the first string to the name of your token name, and the second string to the corresponding symbol for your custom token name */
// SPDX-License-Identifier: MIT
import "./ERC20.sol";

pragma solidity ^0.8.0;

contract testUSDC is ERC20 {
    constructor(uint256 _initial_supply) ERC20("testUSDC", "tUSDC") {
        _mint(msg.sender, _initial_supply);
    }
}
