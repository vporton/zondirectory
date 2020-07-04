// SPDX-License-Identifier: AGPL-3.0-or-later

// TODO: Keep secret keys of ciphered files in Ethereum. you should use native browser crypto apis, aes-256-gcm is pretty much the standard

pragma solidity ^0.6.0;
//pragma experimental ABIEncoderV2;

import './BaseToken.sol';

contract Categories is BaseToken {

    // I get 10% of sales
    uint256 constant PROGRAMMER_SHARE_MULT = 1;
    uint256 constant PROGRAMMER_SHARE_DIV = 10;

    string public name;
    uint8 public decimals;
    string public symbol;

    uint maxId = 0;
    uint maxVoteId = 0;

    event ItemCreated(uint indexed itemId);
    // WARNING: If priceAR != (1<<256) - 1, then the downloadURLs are not kept secret,
    // because AR is inherently insecure anyway.
    event SetItemOwner(uint indexed itemId, address payable indexed owner);
    event ItemUpdated(uint indexed itemId,
                      string title,
                      string description,
                      uint256 priceETH,
                      uint256 priceAR,
                      string locale,
                      bytes cover);
    event ItemFilesUpdated(uint indexed itemId, string format, uint version);
    event CategoryCreated(uint256 indexed categoryId, string title, string locale);
    event ItemAdded(uint256 indexed categoryId, uint indexed itemId);
    event SubcategoryAdded(uint256 indexed categoryId, uint indexed subId);
    event Vote(uint child, uint parent, int256 value);

    address payable programmerAddress;
    mapping (uint => address payable) itemOwners; // TODO: update
    mapping (address => mapping (uint => mapping (uint => int256))) private votes; // TODO: accessor
    mapping (uint => mapping (uint => int256)) private votesForCategories; // TODO: accessor
    mapping (uint => uint256) pricesETH;
    mapping (uint => uint256) pricesAR;
    mapping (uint => bytes) downloadURLs; // concatenation of 46 bytes hashes, for files split into chunks

/// ERC-20 ///

    constructor(address payable _programmerAddress) public {
        name = "Voting";
        decimals = 8;
        symbol = "VOT";
        programmerAddress = _programmerAddress;
    }

    receive() payable external {
        totalSupply += msg.value;
        balances[msg.sender] += msg.value; // 1/1 exchange rate
        programmerAddress.transfer(msg.value);
        emit Transfer(address(this), msg.sender, msg.value);
    }

    function setOwner(address payable _programmerAddress) external {
        require(_programmerAddress == msg.sender, "Access denied.");
        require(_programmerAddress != address(0), "Zero address.");
        programmerAddress = _programmerAddress;
    }

/// Items ///

    function createItem(string calldata _title,
                        string calldata _description,
                        uint256 _priceETH,
                        uint256 _priceAR,
                        string calldata _locale,
                        bytes calldata _cover) external
    {
        itemOwners[++maxId] = msg.sender;
        pricesETH[maxId] = _priceETH;
        pricesAR[maxId] = _priceAR;
        emit ItemCreated(maxId);
        emit SetItemOwner(maxId, msg.sender);
        emit ItemUpdated(maxId, _title, _description, _priceETH, _priceAR, _locale, _cover);
    }

    function updateItem(uint _itemId,
                        string calldata _title,
                        string calldata _description,
                        uint256 _priceETH,
                        uint256 _priceAR,
                        string calldata _locale,
                        bytes calldata _cover) external
    {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        pricesETH[_itemId] = _priceETH;
        pricesAR[_itemId] = _priceAR;
        emit ItemUpdated(_itemId, _title, _description, _priceETH, _priceAR, _locale, _cover);
    }

    function uploadFile(uint _itemId, uint _version, string calldata _format, bytes calldata _chunks) external {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        downloadURLs[_itemId] = _chunks;
        emit ItemFilesUpdated(_itemId, _format, _version);
    }

    function obtainURLs(uint _itemId) external payable returns (bytes memory) {
        require(pricesETH[_itemId] <= msg.value, "Paid too little.");
        uint256 myShare = msg.value * PROGRAMMER_SHARE_MULT / PROGRAMMER_SHARE_DIV;
        programmerAddress.transfer(myShare);
        itemOwners[_itemId].transfer(msg.value - myShare);
        return downloadURLs[_itemId];
    }

    function obtainURLsFree(uint _itemId) external view returns (bytes memory) {
        require(pricesETH[_itemId] == 0 || pricesAR[_itemId] == (1<<256) - 1, "Cannot obtain for free.");
        return downloadURLs[_itemId];
    }

/// Categories ///

    function createCategory(string calldata _title, string calldata _locale) external {
        emit CategoryCreated(++maxId, _title, _locale);
    }

    function addItemToCategory(uint256 _categoryId, uint256 _itemId) external {
        emit ItemAdded(_categoryId, _itemId);
    }

    function addSubcategory(uint256 _category, uint256 _subCategory) external {
        emit SubcategoryAdded(_category, _subCategory);
    }

/// Voting ///

    // FIXME: Check!
    // TODO: Partial votes.
    function voteForCategory(uint _child, uint _parent, bool _yes) external {
        int256 _value = _yes ? int256(balances[msg.sender]) : -int256(balances[msg.sender]);
        int256 _newValue = votesForCategories[_child][_parent] - votes[msg.sender][_child][_parent] + _value; // reclaim the previous vote
        votes[msg.sender][_child][_parent] = _value;
        votesForCategories[_child][_parent] = _newValue;
        emit Vote(_child, _parent, _newValue);
    }
}
