// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";

/// @notice Library SafeMath used to prevent overflows and underflows
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Exchange is Ownable {
    using SafeMath for uint256; //for prevention of integer overflow

    address constant ethToken = address(0);
    address Owner;
    mapping(address => mapping(address => uint256)) public tokens; //tokenAdress -> msg.sender -> tokenAmt

    

    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;
    uint256 public orderCount;

    uint256 public filledOrderCount;

    AggregatorV3Interface private ethUsdPriceFeed;
    AggregatorV3Interface private btcUsdPriceFeed;

    bool internal locked;

    //add platform fees?

    enum Side { BUY, SELL }

    /// Structs representing an order has unique id, user and amounts to give and get between two tokens to exchange
    struct _buyOrder {
        uint256 id;
        address user;
        Side side;
        address token;
        uint256 amount;
        uint256 price; //in usdc
        uint256 timestamp;
    }

    struct _sellOrder {
        uint256 id;
        address user;
        Side side;
        address token;
        uint256 amount;
        uint256 price; //in usdc
        uint256 timestamp;
    }

    //add events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    /// @notice Event when amount withdrawn exchange
    event Withdraw(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );
    /// @notice Event when an order is placed on an exchange
    event Order(
        uint256 id,
        address user,
        Side side,
        address token,
        uint256 amount,
        uint256 price, //in usdc
        uint256 timestamp
    );
    /// @notice Event when an order is cancelled
    event Cancel(
        uint256 id,
        address user,
        Side side,
        address token,
        uint256 amount,
        uint256 price, //in usdc
        uint256 timestamp
    );
    // /// @notice Event when a trade is done, buy , sell matched
    // /// Also returns true if the trade was a lucky one, so no fees
    // event Trade(
    //     uint256 id,
    //     address user,
    //     address tokenGet,
    //     uint256 amountGet,
    //     address tokenGive,
    //     uint256 amountGive,
    //     address userFill,
    //     uint256 timestamp
    // );

    constructor(address _ethUsdPriceFeed, address _btcUsdPriceFeed) {
        Owner = msg.sender;
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        btcUsdPriceFeed = AggregatorV3Interface(_btcUsdPriceFeed);
    }

    function depositETH() external payable {
        tokens[ethToken][msg.sender] = tokens[ethToken][msg.sender].add(
            msg.value
        );
        emit Deposit(
            ethToken,
            msg.sender,
            msg.value,
            tokens[ethToken][msg.sender]
        );
    }

    function withdrawETH(uint256 _amount) external {
        require(tokens[ethToken][msg.sender] >= _amount);
        require(!locked, "Reentrant call detected!");
        locked = true;
        tokens[ethToken][msg.sender] = tokens[ethToken][msg.sender].sub(
            _amount
        );
        locked = false;
        payable(msg.sender).transfer(_amount);
        // (bool success, ) = msg.sender.call{value: _amount}("");
        // require(success, "failed to send amount");

        emit Withdraw(
            ethToken,
            msg.sender,
            _amount,
            tokens[ethToken][msg.sender]
        );
    }

    //from and transferFrom is from ERC20 contract
    //_token should be an ERC20 token
    function depositToken(address _token, uint256 _amount) external {
        require(_token != ethToken);
        //need to add a check to prove that it is an ERC20 token
        ERC20 token = ERC20(_token);
        require(token.transferFrom(msg.sender, address(this), _amount));
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) external {
        require(_token != ethToken);
        require(tokens[_token][msg.sender] >= _amount);
        require(!locked, "Reentrant call detected!");
        locked = true;
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        ERC20 token = ERC20(_token);
        require(token.transfer(msg.sender, _amount));
        locked = false;
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user)
        external
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    // function makeOrder(
    //     address _tokenGet,
    //     uint256 _amountGet,
    //     address _tokenGive,
    //     uint256 _amountGive
    // ) external {
    //     orderCount = orderCount.add(1);
    //     orders[orderCount] = _Order(
    //         orderCount,
    //         msg.sender,
    //         _tokenGet,
    //         _amountGet,
    //         _tokenGive,
    //         _amountGive,
    //         block.timestamp
    //     );
    //     emit Order(
    //         orderCount,
    //         msg.sender,
    //         _tokenGet,
    //         _amountGet,
    //         _tokenGive,
    //         _amountGive,
    //         block.timestamp
    //     );
    // }


    //For Buyer, when making buy order they deposit usdc and receive token of choice
    //For seller, when making sell order, they deposit token of choice and receive usdc
    function createLimitOrder(Side _side, address _token, uint _amount, uint _price) public {
        if (_side == Side.BUY) {
            //require(balances[msg.sender]["USDC"] >= _amount.mul(_price));

        } else if (side == Side.SELL) {
            require(balances[msg.sender][ticker] >= amount);
        }

        Order[] storage orders = orderBook[ticker][uint(side)];
        orders.push(Order(nextOrderId, msg.sender, side, ticker, amount, price, 0));

        // Bubble sort
        uint i = orders.length > 0 ? orders.length - 1 : 0;

        if (side == Side.BUY) {
            while (i > 0) {
                if (orders[i - 1].price > orders[i].price) {
                    break;
                }
                Order memory orderToMove = orders[i - 1];
                orders[i - 1] = orders[i];
                orders[i] = orderToMove;
                i--;
            }
        } else if (side == Side.SELL) {
            while (i > 0) {
                if (orders[i - 1].price < orders[i].price) {
                    break;
                }
                Order memory orderToMove = orders[i - 1];
                orders[i - 1] = orders[i];
                orders[i] = orderToMove;
                i--;
            }
        }

        nextOrderId++;
    }

    function cancelOrder(uint256 _id) external {
        _Order storage _order = orders[_id];
        require(address(_order.user) == msg.sender);
        require(_order.id == _id); // The order must exist
        cancelledOrderCount = cancelledOrderCount.add(1);
        orderCancelled[_id] = true;
        emit Cancel(
            _order.id,
            msg.sender,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            block.timestamp
        );
    }

    function fillOrder(uint256 _id, uint256 _tokenAmount) external {
        require(_id > 0 && _id <= orderCount);
        require(!orderFilled[_id]);
        require(!orderCancelled[_id]);
        _Order storage _order = orders[_id];
        _trade(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );
        if ()
        //filledOrderCount = filledOrderCount.add(1);
        orderFilled[_order.id] = true;
    }

    //to add _trade
    function _trade(
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(
            _amountGet.add(_feeAmount)
        );
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(
            _amountGive
        );
        emit Trade(
            _orderId,
            _user,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            msg.sender,
            block.timestamp
        );
    }

    // function checkDEXBalance() external view returns (uint256) {
    //     return address(this).balance;
    // }
}
