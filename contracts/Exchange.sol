// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";

/// @notice Library SafeMath used to prevent overflows and underflows
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Exchange is Ownable {
    using SafeMath for uint256; //for prevention of integer overflow

    address Owner;
    uint256 decimals = 10**18;
    //Deposit in contract
    mapping(address => mapping(address => uint256)) public tokens; //tokenAdress -> msg.sender -> tokenAmt

    //Token Address List available in DEX
    address[] public tokenList;
    address ethToken = address(0); //to be changed
    address usdc = 0x07865c6E87B9F70255377e024ace6630C1Eaa37F;

    //orderBook mappping: tokenAddress -> Side -> Order Array
    mapping(address => mapping(uint256 => _Order[])) public orderBook;

    _filledOrder[] filledOrders; //array of filled orders

    uint256 private orderId = 0;

    // AggregatorV3Interface private ethUsdPriceFeed;
    // AggregatorV3Interface private btcUsdPriceFeed;

    //For prevention of reentrancy
    bool internal locked;

    //Structs representing an order has unique id, user and amounts to give and get between two tokens to exchange
    struct _Order {
        uint256 id;
        address user;
        address token;
        uint256 amount;
        uint256 price; //in usdc
        Side side;
    }

    struct _filledOrder {
        Side side;
        _Order order;
    }

    enum Side {
        BUY,
        SELL
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
        address token,
        uint256 amount,
        uint256 price,
        Side side
    );

    /// @notice Event when an order is cancelled
    event Cancel(
        uint256 id,
        address user,
        address token,
        uint256 amount,
        uint256 price
    );

    event Fill(
        uint256 id,
        address user,
        address token,
        uint256 amount,
        uint256 price
    );

    constructor() {
        Owner = msg.sender;
        // ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        // btcUsdPriceFeed = AggregatorV3Interface(_btcUsdPriceFeed);
    }

    function depositETH() public payable {
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

    function withdrawETH(uint256 _amount) public {
        _amount = _amount * decimals;
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
    function depositToken(address _token, uint256 _amount) public {
        _amount = _amount * 10**6;
        require(_token != ethToken);
        //need to add a check to prove that it is an ERC20 token
        ERC20 token = ERC20(_token);
        token.approve(address(this), _amount);
        require(token.transfer(address(this), _amount));
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        _amount = _amount * decimals;
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

    //balance of specific tokens in the dex owned by specific user
    function balanceOf(address _token, address _user)
        external
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    //For Buyer, when making buy order they deposit usdc and receive token of choice
    //For seller, when making sell order, they deposit token of choice and receive usdc
    function createLimitBuyOrder(
        address _token,
        uint256 _amount,
        uint256 _price //in usdc/token
    ) public {
        _amount = _amount * decimals;
        //Amount user has deposited in the DEX must be >= value he wants to buy
        require(tokens[usdc][msg.sender] >= _amount.mul(_price));

        _Order[] storage _order = orderBook[_token][uint256(Side.BUY)];
        _order.push(
            _Order(orderId, msg.sender, _token, _amount, _price, Side.BUY)
        );

        emit Order(orderId, msg.sender, _token, _amount, _price, Side.BUY);

        orderId++;
    }

    function createLimitSellOrder(
        address _token,
        uint256 _amount,
        uint256 _price //in usdc/token
    ) public {
        _amount = _amount * decimals;
        //Amount of tokens user deposit in DEX must be >= the amount of tokens they want to sell
        require(tokens[_token][msg.sender] >= _amount);

        _Order[] storage _order = orderBook[_token][uint256(Side.SELL)];
        _order.push(
            _Order(orderId, msg.sender, _token, _amount, _price, Side.SELL)
        );

        emit Order(orderId, msg.sender, _token, _amount, _price, Side.SELL);

        orderId++;
    }

    function cancelOrder(
        Side side,
        uint256 _id,
        address _token
    ) public {
        require(_id >= 0 && _id <= orderId, "Invalid Order ID to cancel");
        _Order[] storage _order = orderBook[_token][uint256(side)];
        _Order memory order;

        uint256 index;
        for (uint256 i = 0; i < _order.length; i++) {
            if (_order[i].id == _id) {
                index = i;
                order = _order[i];
                break;
            }
        }

        for (uint256 j = index; j < _order.length - 1; j++) {
            _order[j] = _order[j + 1];
        }
        delete _order[_order.length - 1];
        _order.pop();

        uint256 amount = order.amount * decimals;
        uint256 price = order.price;
        require(address(order.user) == msg.sender);

        orderBook[_token][uint256(side)] = _order;

        emit Cancel(_id, msg.sender, _token, amount, price);
    }

    function fillBuyOrder(
        uint256 _id,
        address _token,
        uint256 _amount,
        uint256 _price
    ) public {
        require(_id >= 0 && _id <= orderId);
        _amount = _amount * decimals;
        _Order[] memory _order = orderBook[_token][0];
        _Order memory order;

        order = getOrderFromArray(_order, _id);

        require(order.user == msg.sender);
        require(order.amount >= _amount);
        order.amount = order.amount.sub(_amount);

        emit Fill(_id, msg.sender, _token, _amount, _price);

        if (order.amount == 0) {
            filledOrders.push(_filledOrder(Side.BUY, order));
            cancelOrder(Side.BUY, order.id, order.token); //remove filled orders
        }
    }

    function fillSellOrder(
        uint256 _id,
        address _token,
        uint256 _amount,
        uint256 _price
    ) public {
        require(_id >= 0 && _id <= orderId);
        _amount = _amount * decimals;
        _Order[] memory _order = orderBook[_token][1];
        _Order memory order;

        order = getOrderFromArray(_order, _id);

        require(order.user == msg.sender);
        require(order.amount >= _amount);
        order.amount = order.amount.sub(_amount);

        emit Fill(_id, msg.sender, _token, _amount, _price);

        if (order.amount == 0) {
            filledOrders.push(_filledOrder(Side.SELL, order));
            cancelOrder(Side.SELL, order.id, order.token); //remove filled orders
        }
    }

    // function removeFilledOrders() public {
    //     for (uint256 i = 0; i < filledOrders.length; i++) {
    //         address token = (filledOrders[i].order).token;
    //         uint256 id = (filledOrders[i].order).id;

    //         if (filledOrders[i].side == Side.BUY) {
    //             delete (buyOrders[token][id]);
    //         } else if (filledOrders[i].side == Side.SELL) {
    //             delete (sellOrders[token][id]);
    //         }
    //     }
    // }

    function matchOrders(
        address _token,
        uint256 _id,
        Side side
    ) internal {
        //when order is filled,
        //BUY Side => deduct USDC from balance, sent token to balance, order updated.
        //SELL Side =>deduct token from balance, sent USDC from DEX, order updated.
        uint256 saleTokenAmt;

        if (side == Side.BUY) {
            //Retrieve buy order to be filled
            _Order[] memory _order = orderBook[_token][0];
            _Order memory buyOrderToFill = getOrderFromArray(_order, _id);
            uint256 limitPrice = buyOrderToFill.price;
            uint256 amountTokens = buyOrderToFill.amount;
            address owner = buyOrderToFill.user;

            //Retrieve sell order to match
            _Order[] storage _sellOrder = orderBook[_token][1];
            for (uint256 i = 0; i < _sellOrder.length; i++) {
                //sell order hit buyer's limit price
                if (_sellOrder[i].price <= limitPrice) {
                    uint256 sellId = _sellOrder[i].id;
                    uint256 sellPrice = _sellOrder[i].price;
                    uint256 sellTokenAmt = _sellOrder[i].amount;
                    address seller = _sellOrder[i].user;

                    //if buyer's amount to buy > seller's amount to sell
                    if (amountTokens > sellTokenAmt) {
                        saleTokenAmt = sellTokenAmt;
                    }
                    //if seller's amount to sell >= buyer's amount to buy
                    else if (amountTokens <= sellTokenAmt) {
                        saleTokenAmt = amountTokens;
                    }

                    //Verify current balance
                    require(
                        tokens[usdc][owner] >= amountTokens.mul(sellPrice),
                        "Buyer currently does not have enough USDC Balance"
                    );
                    require(
                        tokens[_token][seller] >= amountTokens,
                        "Seller currently does not have enough Token Balance"
                    );

                    //update orders
                    fillBuyOrder(_id, _token, saleTokenAmt, sellPrice);
                    fillSellOrder(sellId, _token, saleTokenAmt, sellPrice);

                    //buyer update
                    //require(owner==msg.sender);
                    tokens[_token][owner] = tokens[_token][owner].add(
                        saleTokenAmt
                    );
                    tokens[usdc][owner] = tokens[usdc][owner].sub(
                        sellPrice.mul(saleTokenAmt)
                    );

                    //seller update
                    tokens[_token][seller] = tokens[_token][seller].sub(
                        saleTokenAmt
                    );
                    tokens[usdc][seller] = tokens[usdc][seller].add(
                        sellPrice.mul(saleTokenAmt)
                    );
                }

                if (buyOrderToFill.amount == 0) break;
            }
        } else if (side == Side.SELL) {
            //Retrieve buy order to be filled
            _Order[] memory _order = orderBook[_token][1];
            _Order memory sellOrderToFill = getOrderFromArray(_order, _id);
            uint256 limitPrice = sellOrderToFill.price;
            uint256 amountTokens = sellOrderToFill.amount;
            address owner = sellOrderToFill.user;

            //Retrieve sell order to match
            _Order[] storage _buyOrder = orderBook[_token][0];
            for (uint256 i = 0; i < _buyOrder.length; i++) {
                //sell order hit buyer's limit price
                if (_buyOrder[i].price >= limitPrice) {
                    uint256 buyId = _buyOrder[i].id;
                    uint256 buyPrice = _buyOrder[i].price;
                    uint256 buyTokenAmt = _buyOrder[i].amount;
                    address buyer = _buyOrder[i].user;

                    //if seller's amount to sell > buyer's amount to buy
                    if (amountTokens > buyTokenAmt) {
                        saleTokenAmt = buyTokenAmt;
                    }
                    //if buyer's amount to buy > seller's amount to sell
                    else if (amountTokens <= buyTokenAmt) {
                        saleTokenAmt = amountTokens;
                    }

                    //Verify current balance
                    require(
                        tokens[_token][owner] >= amountTokens,
                        "Seller currently does not have enough Token Balance"
                    );
                    require(
                        tokens[usdc][buyer] >= amountTokens.mul(buyPrice),
                        "Buyer currently does not have enough USDC Balance"
                    );

                    //update orders
                    fillSellOrder(_id, _token, saleTokenAmt, buyPrice);
                    fillBuyOrder(buyId, _token, saleTokenAmt, buyPrice);

                    //seller update
                    require(owner == msg.sender);
                    tokens[_token][owner] = tokens[_token][owner].sub(
                        saleTokenAmt
                    );
                    tokens[usdc][owner] = tokens[usdc][owner].add(
                        buyPrice.mul(saleTokenAmt)
                    );

                    //buyer update
                    tokens[_token][buyer] = tokens[_token][buyer].add(
                        saleTokenAmt
                    );
                    tokens[usdc][buyer] = tokens[usdc][buyer].sub(
                        buyPrice.mul(saleTokenAmt)
                    );
                }

                if (sellOrderToFill.amount == 0) break;
            }
        }
    }

    function getOrderFromArray(_Order[] memory _order, uint256 _id)
        public
        pure
        returns (_Order memory)
    {
        _Order memory order;
        for (uint256 i = 0; i < _order.length; i++) {
            if (_order[i].id == _id) {
                order = _order[i];
                break;
            }
        }
        return order;
    }
}
