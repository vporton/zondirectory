// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;
//pragma experimental ABIEncoderV2;

import './BaseToken.sol';

contract Categories is BaseToken {

    string public name;
    uint8 public decimals;
    string public symbol;

    uint maxId = 0;

    event ItemUpdated(address owner, uint256 indexed id, string title, string shortDecription, string longDescription);
    event ItemFilesUpdated(uint itemId, string format, byte[46][] chunks, uint version);
    event CategoryCreated(uint256 indexed id, string title);
    event ItemAdded(uint256 indexed categoryId, uint indexed itemId);
    event SubcategoryAdded(uint256 indexed categoryId, uint indexed subId);

    mapping (uint => address) itemOwners;
    mapping (uint => mapping (uint => int256)) private votesForCategories; // TODO: accessor

/// ERC-20 ///

    constructor() public {
        name = "Voting";
        decimals = 8;
        symbol = "VOT";
    }

    receive() payable external {
        totalSupply = msg.value;
        balances[msg.sender] += msg.value; // 1/1 exchange rate
        emit Transfer(address(this), msg.sender, msg.value);
    }

/// Items ///

    function createItem(string calldata _title,
                        string calldata _shortDescription,
                        string calldata _longDescription) external
    {
        itemOwners[++maxId] = msg.sender;
        emit ItemUpdated(msg.sender, maxId, _title, _shortDescription, _longDescription);
    }

    function updateItem(uint _itemId,
                        string calldata _title,
                        string calldata _shortDescription,
                        string calldata _longDescription) external
    {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        emit ItemUpdated(msg.sender, _itemId, _title, _shortDescription, _longDescription);
    }

    function uploadFile(uint _itemId, uint _version, string calldata _format, byte[46][] calldata _chunks) external {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        emit ItemFilesUpdated(_itemId, _format, _chunks, _version);
    }

/// Categories ///

    function createCategory(string calldata _title) external {
        emit CategoryCreated(++maxId, _title);
    }

    function addItemToCategory(uint256 _categoryId, uint256 _itemId) external {
        emit ItemAdded(_categoryId, _itemId);
    }

    function addSubcategory(uint256 _category, uint256 _subCategory) external {
        emit SubcategoryAdded(_category, _subCategory);
    }

/// Voting ///

    function voteForCategory(uint _child, uint _parent, bool _yes) external {
        int256 _value = _yes ? int256(balances[msg.sender]) : -int256(balances[msg.sender]);
        votesForCategories[_child][_parent] += -votesForCategories[_child][_parent] + _value; // reclaim the previous vote
    }
}
