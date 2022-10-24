// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./testUSDC.sol";
import "./Wallet.sol";

/// @notice Library SafeMath used to prevent overflows and underflows
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Exchange is Ownable{
    using SafeMath for uint256; //for prevention of integer overflow

    address public immutable Owner;
    address usdc;
    address public ethToken = address(0);


    //Token Address List available in DEX
    address[] public tokenList;

    //s_orderBook mappping: tokenAddress -> Side -> Order Array
    mapping(address => mapping(uint256 => _Order[])) public s_orderBook;

    //Balance in DEX
    mapping(address => mapping(address => uint256)) public s_tokens; //tokenAdress -> msg.sender -> tokenAmt

    //Locked value in orders in DEX  user->Token->lockedAmount
    mapping(address => mapping(address => uint256)) public lockedFunds;

    _filledOrder[] s_filledOrders; //array of filled orders

    uint256 public s_orderId = 0;
    bool private s_isManual=true;


    //Structs representing an order has unique id, user and amounts to give and get between two s_tokens to exchange
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

    constructor(address _usdc) {
        usdc = _usdc;
        addToken(usdc);
        addToken(ethToken);

        Owner = msg.sender;
    }


    //For Buyer, when making buy order they deposit usdc and receive token of choice
    //For seller, when making sell order, they deposit token of choice and receive usdc
    function createLimitBuyOrder(
        address _token,
        uint256 _amount,
        uint256 _price //in usdc/token
    ) external {
        //Token must be approved in DEX
        require(isVerifiedToken(_token), "Token unavailable in DEX");

        //Amount user has deposited in the DEX must be >= value he wants to buy
        require(
            balanceOf(usdc,msg.sender) - getlockedFunds(msg.sender, usdc) >= _amount.mul(_price),
            "Insufficient USDC"
        );


        //Lock the funds (USDC) in the wallet by removing balance in DEX
        updateLockedFunds(msg.sender, usdc, _amount.mul(_price), true);

        s_orderBook[_token][uint256(Side.BUY)].push(
            _Order(s_orderId, msg.sender, _token, _amount, _price, Side.BUY)
        );

        emit Order(s_orderId, msg.sender, _token, _amount, _price, Side.BUY);

        s_orderId = s_orderId.add(1);

    }

    function createLimitSellOrder(
        address _token,
        uint256 _amount,
        uint256 _price //in usdc/token
    ) external {
        //Token must be approved in DEX
        require(isVerifiedToken(_token), "Token unavailable in DEX");


        //Amount of tokens user deposit in DEX must be >= the amount of tokens they want to sell
        require(
            balanceOf(_token,msg.sender) - getlockedFunds(msg.sender, _token) >= _amount,
            "Insufficient tokens"
        );
        

        //Lock the funds (tokens) in the wallet
        updateLockedFunds(msg.sender, _token, _amount, true);

        s_orderBook[_token][uint256(Side.SELL)].push(
            _Order(s_orderId, msg.sender, _token, _amount, _price, Side.SELL)
        );

        emit Order(s_orderId, msg.sender, _token, _amount, _price, Side.SELL);

        s_orderId = s_orderId.add(1);

    }

    function cancelOrder(
        Side side,
        uint256 _id,
        address _token
    ) public {
        require(_id >= 0 && _id <= s_orderId, "Invalid Order ID");
        require(isVerifiedToken(_token), "Token unavailable in DEX");
        
        _Order[] storage _order = s_orderBook[_token][uint256(side)];
        uint256 size = _order.length;
        _Order memory order;

        uint256 index;
        for (uint256 i = 0; i < size; i++) {
            if (_order[i].id == _id) {
                index = i;
                order = _order[i];
                break;
            }
        }

        if (s_isManual) {
            require(msg.sender== order.user, "Not Order Owner");

            //Unlock funds
            if (side == Side.BUY) {
                updateLockedFunds(msg.sender, usdc, order.price.mul(order.amount), false);
            }
                
            else if (side == Side.SELL) {
                updateLockedFunds(msg.sender, _token, order.amount, false);
            }
        }



        
        for (uint256 j = index; j < size - 1; j++) {
            _order[j] = _order[j + 1];
        }
        delete _order[size - 1];
        _order.pop();

        s_orderBook[_token][uint256(side)] = _order;

        emit Cancel(order.id, msg.sender, _token, order.amount, order.price);
    }

    function fillBuyOrder(
        uint256 _id,
        address _token,
        uint256 _amount,
        uint256 _price
    ) public {
        require(_id >= 0 && _id <= s_orderId);
        _Order[] memory _order = s_orderBook[_token][0];
        _Order memory order;

        order = getOrderFromArray(_order, _id);

        require(order.amount >= _amount);


        order.amount = order.amount.sub(_amount);

        updateLockedFunds(order.user, usdc, order.price.mul(_amount), false);

        
        emit Fill(_id, order.user, _token, _amount, _price);

        if (order.amount == 0) {
            s_filledOrders.push(_filledOrder(Side.BUY, order));
            s_isManual=false;
            cancelOrder(Side.BUY, order.id, order.token); //remove filled orders
            s_isManual=true;
        }

    }

    function fillSellOrder(
        uint256 _id,
        address _token,
        uint256 _amount,
        uint256 _price
    ) public {
        require(_id >= 0 && _id <= s_orderId);
        _Order[] memory _order = s_orderBook[_token][1];
        _Order memory order;

        order = getOrderFromArray(_order, _id);

        require(order.amount >= _amount);

        order.amount = order.amount.sub(_amount);

        updateLockedFunds(order.user, _token, _amount, false);
        

        emit Fill(order.id, order.user , _token, _amount, _price);

        if (order.amount == 0) {
            s_filledOrders.push(_filledOrder(Side.SELL, order));
            s_isManual=false;
            cancelOrder(Side.SELL, order.id, order.token); //remove filled orders
            s_isManual=true;
        }
    }

    function matchOrders(
        address _token,
        uint256 _id,
        Side side
    ) external {
        //when order is filled,
        //BUY Side => deduct USDC from balance, sent token to balance, order updated.
        //SELL Side =>deduct token from balance, sent USDC from DEX, order updated.
        uint256 saleTokenAmt;
        //Token must be approved in DEX
        require(isVerifiedToken(_token), "Token unavailable in DEX");
        require(_id >= 0 && _id <= s_orderId);

        if (side == Side.BUY) {
            //Retrieve buy order to be filled
            _Order[] memory _order = s_orderBook[_token][0];
            _Order memory buyOrderToFill= getOrderFromArray(_order, _id);

            //Retrieve sell order to match
            _Order[] memory _sellOrder = s_orderBook[_token][1];
            for (uint256 i = 0; i < _sellOrder.length; i++) {
                //sell order hit buyer's limit price
                if (_sellOrder[i].price <= buyOrderToFill.price) {
                    _Order memory sellOrder = _sellOrder[i];
                    //if buyer's amount to buy > seller's amount to sell
                    if (buyOrderToFill.amount > sellOrder.amount) {
                        saleTokenAmt = sellOrder.amount;
                    }
                    //if seller's amount to sell >= buyer's amount to buy
                    else if (buyOrderToFill.amount <= sellOrder.amount) {
                        saleTokenAmt = buyOrderToFill.amount;
                    }

                    //Verify current balance
                    require(
                        balanceOf(usdc, buyOrderToFill.user) >= saleTokenAmt.mul(sellOrder.price),
                        "Insufficient buyer USDC Balance"
                    );
                    require(
                        balanceOf(_token,sellOrder.user) >= saleTokenAmt,
                        "Insufficient seller Token Balance"
                    );

                    //update orders
                    fillBuyOrder(_id, _token, saleTokenAmt, sellOrder.price);
                    fillSellOrder(sellOrder.id, _token, saleTokenAmt, sellOrder.price);

                    //buyer update
                    updateBalance(_token, buyOrderToFill.user, saleTokenAmt, true);
                    updateBalance(usdc, buyOrderToFill.user, sellOrder.price.mul(saleTokenAmt), false);
                    

                    //seller update
                    updateBalance(_token, sellOrder.user, saleTokenAmt, false);
                    updateBalance(usdc, sellOrder.user, sellOrder.price.mul(saleTokenAmt), true);
                }

                if (buyOrderToFill.amount == 0) break;
            }
        } else if (side == Side.SELL) {
            //Retrieve sell order to be filled
            _Order[] memory _order = s_orderBook[_token][1];
            _Order memory sellOrderToFill = getOrderFromArray(_order, _id);

            //Retrieve buy order to match
            _Order[] memory _buyOrder = s_orderBook[_token][0];
            for (uint256 i = 0; i < _buyOrder.length; i++) {
                //sell order hit buyer's limit price
                if (_buyOrder[i].price >= sellOrderToFill.price) {
                    _Order memory order = _buyOrder[i];

                    //if seller's amount to sell > buyer's amount to buy
                    if (sellOrderToFill.amount > order.amount) {
                        saleTokenAmt = order.amount;
                    }
                    //if buyer's amount to buy > seller's amount to sell
                    else if (sellOrderToFill.amount <= order.amount) {
                        saleTokenAmt = sellOrderToFill.amount;
                    }

                    //Verify current balance
                    require(
                        balanceOf(_token,sellOrderToFill.user) >= saleTokenAmt,
                        "Insufficient seller Token Balance"
                    );
                    require(
                        balanceOf(usdc,order.user) >= saleTokenAmt.mul(order.price),
                        "Insufficient buyer USDC Balance"
                    );

                    //update orders
                    fillSellOrder(_id, _token, saleTokenAmt, order.price);
                    fillBuyOrder(order.id, _token, saleTokenAmt, order.price);

                    //seller update
                    updateBalance(_token, sellOrderToFill.user, saleTokenAmt, false);
                    updateBalance(usdc, sellOrderToFill.user, order.price.mul(saleTokenAmt), true);

                    //buyer update
                    updateBalance(_token, order.user, saleTokenAmt, true);
                    updateBalance(usdc, order.user, order.price.mul(saleTokenAmt), false);
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

    function orderExists(
        uint256 _id,
        Side side,
        address _token
    ) public view returns (bool) {
        _Order[] memory orders = s_orderBook[_token][uint256(side)];

        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].id == _id) {
                return true;
            }
        }
        return false;
    }

    function getlockedFunds(address _user, address _token) public view returns (uint256) {
        return lockedFunds[_user][_token];
    }

    function updateLockedFunds(address _user, address _token, uint256 _amount, bool isAdd) public{
        if (isAdd) {
            lockedFunds[_user][_token] = lockedFunds[_user][_token].add(_amount);
        } 
        else if (!isAdd) {
            lockedFunds[_user][_token] = lockedFunds[_user][_token].sub(_amount);
        }
    }

    //balance of specific s_tokens in the dex owned by specific user
    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return s_tokens[_token][_user];
    }

    function updateBalance(address _token, address _user, uint256 _amount, bool isAdd) public {
        if (isAdd) {
            s_tokens[_token][_user] = s_tokens[_token][_user].add(_amount);
        } 
        else if (!isAdd) {
            s_tokens[_token][_user] = s_tokens[_token][_user].sub(_amount);
        }
    }   

    function addToken(address _token) public onlyOwner {
        tokenList.push(_token);
    }

    function isVerifiedToken(address _token) internal view returns(bool) {
        uint256 size = tokenList.length;

        for (uint i=0; i< size; i++) {
            if (tokenList[i]==_token) return true;
        }
        return false;
    }
}
