// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;
//pragma experimental ABIEncoderV2;

import './BaseToken.sol';
import './ABDKMath64x64.sol';
import './PST.sol';

// TODO: Encode wallets and hashes as uint256

contract Files is BaseToken {

    using ABDKMath64x64 for int128;

    // I get 10% of sales
    string public name;
    uint8 public decimals;
    string public symbol;

    // 64.64 fixed point number
    int128 public ownersShare = int128(1).divi(int128(10)); // 1/10
    PST shares;

    uint maxId = 0;
    uint maxVoteId = 0;

    event SetOwner(address payable owner); // share is 64.64 fixed point number
    event SetOwnerShare(int128 share); // share is 64.64 fixed point number
    event SetARWallet(address payable indexed owner, string arWallet);
    event ItemCreated(uint indexed itemId);
    event SetItemOwner(uint indexed itemId, address payable indexed owner);
    event ItemUpdated(uint indexed itemId,
                      string title,
                      string description,
                      uint256 priceETH,
                      uint256 priceAR,
                      string locale,
                      string license);
    event ItemCoverUpdated(uint indexed itemId, uint indexed version, bytes cover, uint width, uint height);
    event ItemFilesUpdated(uint indexed itemId, string format, uint version, string hash);
    event CategoryCreated(uint256 indexed categoryId, string title, string locale);
    event ItemAddedToCategory(uint256 indexed categoryId, uint indexed itemId);
    event SubcategoryAdded(uint256 indexed categoryId, uint indexed subId);
    event Vote(uint child, uint parent, int256 value);

    address payable programmerAddress;
    mapping (uint => address payable) itemOwners;
    mapping (address => mapping (uint => mapping (uint => int256))) private votes;
    mapping (uint => mapping (uint => int256)) private votesForCategories;
    mapping (uint => uint256) pricesETH;
    mapping (uint => uint256) pricesAR;

    constructor(address payable _programmerAddress, PST _shares) public {
        name = "Voting";
        decimals = 18;
        symbol = "VOT";
        programmerAddress = _programmerAddress;
        shares = _shares;
    }

    receive() payable external {
        totalSupply += msg.value;
        balances[msg.sender] += msg.value; // 1/1 exchange rate
        programmerAddress.transfer(msg.value);
        emit Transfer(address(this), msg.sender, msg.value);
    }

    function setOwner(address payable _programmerAddress) external {
        require(msg.sender == programmerAddress, "Access denied.");
        require(_programmerAddress != address(0), "Zero address.");
        programmerAddress = _programmerAddress;
        emit SetOwner(_programmerAddress);
    }

    // _share is 64.64 fixed point number
    function setOwnersShare(int128 _share) external {
        require(msg.sender == programmerAddress, "Access denied.");
        ownersShare = _share;
        emit SetOwnerShare(_share);
    }

    function setItemOwner(uint _itemId, address payable _owner) external {
        require(itemOwners[_itemId] == msg.sender, "Access denied.");
        itemOwners[_itemId] = _owner;
        emit SetItemOwner(_itemId, _owner);
    }

/// Wallets ///

    function setARWallet(address payable _owner, string calldata _arWallet) external {
        emit SetARWallet(_owner, _arWallet);
    }

/// Items ///

    function createItem(string calldata _title,
                        string calldata _description,
                        uint256 _priceETH,
                        uint256 _priceAR,
                        string calldata _locale,
                        string calldata _license) external
    {
        itemOwners[++maxId] = msg.sender;
        pricesETH[maxId] = _priceETH;
        pricesAR[maxId] = _priceAR;
        emit ItemCreated(maxId);
        emit SetItemOwner(maxId, msg.sender);
        emit ItemUpdated(maxId, _title, _description, _priceETH, _priceAR, _locale, _license);
    }

    function updateItem(uint _itemId,
                        string calldata _title,
                        string calldata _description,
                        uint256 _priceETH,
                        uint256 _priceAR,
                        string calldata _locale,
                        string calldata _license) external
    {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        pricesETH[_itemId] = _priceETH;
        pricesAR[_itemId] = _priceAR;
        emit ItemUpdated(_itemId, _title, _description, _priceETH, _priceAR, _locale, _license);
    }

    function updateItemCover(uint _itemId, uint _version, bytes calldata _cover, uint _width, uint _height) external {
        emit ItemCoverUpdated(_itemId, _version, _cover, _width, _height);
    }

    function uploadFile(uint _itemId, uint _version, string calldata _format, string calldata _hash) external {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        emit ItemFilesUpdated(_itemId, _format, _version, _hash);
    }

    function pay(uint _itemId) external payable returns (bytes memory) {
        require(pricesETH[_itemId] <= msg.value, "Paid too little.");
        uint256 myShare = uint256(ownersShare.muli(int256(msg.value)));
        programmerAddress.transfer(myShare);
        itemOwners[_itemId].transfer(msg.value - myShare);
    }

/// Categories ///

    function createCategory(string calldata _title, string calldata _locale) external {
        emit CategoryCreated(++maxId, _title, _locale);
    }

    function addItemToCategory(uint256 _categoryId, uint256 _itemId) external {
        emit ItemAddedToCategory(_categoryId, _itemId);
    }

    function addSubcategory(uint256 _category, uint256 _subCategory) external {
        emit SubcategoryAdded(_category, _subCategory);
    }

/// Voting ///

    function voteForCategory(uint _child, uint _parent, bool _yes) external {
        int256 _value = _yes ? int256(balances[msg.sender]) : -int256(balances[msg.sender]);
        int256 _newValue = votesForCategories[_child][_parent] - votes[msg.sender][_child][_parent] + _value; // reclaim the previous vote
        votes[msg.sender][_child][_parent] = _value;
        votesForCategories[_child][_parent] = _newValue;
        emit Vote(_child, _parent, _newValue);
    }

    function voterInfo(address _voter, uint _child, uint _parent) external view returns (int256) {
        return votes[_voter][_child][_parent];
    }

    function getCategoryVotes(uint _child, uint _parent) external view returns (int256) {
        return votesForCategories[_child][_parent];
    }

// PST ///

    mapping(address => uint256) lastTotalDivedends; // the value of totalDivendents at the last payment to an address
    uint256 totalDividends = 0;
    
    function dividendsOwing(address _account) internal view returns(uint256) {
        uint256 _newDividends = totalDividends - lastTotalDivedends[_account];
        return (shares.balances(_account) * _newDividends) / shares.totalSupply; // rounding down
    }

    function withdrawProfit() external {
        uint256 _owing = dividendsOwing(msg.sender);

        // Against rounding errors. Not necessary because of rounding down.
        // if(owing > address(this).balance) owing = address(this).balance;

        if(_owing > 0) {
            msg.sender.transfer(_owing);
            lastTotalDivedends[msg.sender] = totalDividends;
            totalDividends += _owing;
        }
    }
}
