// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./testUSDC.sol";
import "./Exchange.sol";

/// @notice Library SafeMath used to prevent overflows and underflows
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Ownable {
    using SafeMath for uint256; //for prevention of integer overflow

    address public immutable Owner;

    //For prevention of reentrancy
    bool private locked;

    address public ethToken = address(0);

    Exchange tokens;

    IERC20 token;

    event Deposit(
        address token, 
        address user, 
        uint256 amount, 
        uint256 balance);

    /// @notice Event when amount withdrawn exchange
    event Withdraw(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );

    constructor(address _ExchangeAdd) {
        tokens = Exchange(_ExchangeAdd);
        Owner = msg.sender;
    }

    function depositETH() external payable {
        
        // s_tokens[ethToken][msg.sender] = s_tokens[ethToken][msg.sender].add(
        //     msg.value
        // );
        tokens.updateBalance(ethToken, msg.sender, msg.value, true);

        emit Deposit(
            ethToken,
            msg.sender,
            msg.value,
            tokens.balanceOf(ethToken, msg.sender)
        );
    }

    function withdrawETH(uint256 _amount) external {
        require(
            tokens.balanceOf(ethToken, msg.sender) - tokens.getlockedFunds(msg.sender, ethToken) >= _amount,
            "Insufficient balance ETH to withdraw"
        );
        require(!locked, "Reentrant call detected!");
        locked = true;
        // s_tokens[ethToken][msg.sender] = s_tokens[ethToken][msg.sender].sub(
        //     _amount
        // );
        tokens.updateBalance(ethToken, msg.sender, _amount, false);
        locked = false;
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "failed to send amount");

        emit Withdraw(
            ethToken,
            msg.sender,
            _amount,
            tokens.balanceOf(ethToken, msg.sender)
        );
    }

    //from and transferFrom is from ERC20 contract
    //_token should be an ERC20 token
    function depositToken(address _token, uint256 _amount) external {
        require(_token != ethToken);
        //need to add a check to prove that it is an ERC20 token
        token = IERC20(_token);

        //Requires approval first
        require(
            token.transferFrom(msg.sender, address(this), _amount)
        );
        tokens.updateBalance(_token, msg.sender, _amount, true);
        //s_tokens[_token][msg.sender] = s_tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens.balanceOf(_token, msg.sender));
    }

    function withdrawToken(address _token, uint256 _amount) external {
        require(_token != ethToken);
        require(tokens.balanceOf(_token, msg.sender) - tokens.getlockedFunds(msg.sender, _token) >= _amount);
        require(!locked, "Reentrant call detected!");
        locked = true;
        //s_tokens[_token][msg.sender] = s_tokens[_token][msg.sender].sub(_amount);
        tokens.updateBalance(_token, msg.sender, _amount, false);
        token = IERC20(_token);
        require(token.transfer(msg.sender, _amount));
        locked = false;
        emit Withdraw(_token, msg.sender, _amount, tokens.balanceOf(_token, msg.sender));
    }
}