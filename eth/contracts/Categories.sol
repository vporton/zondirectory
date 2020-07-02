// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './BaseToken.sol';

contract Categories is BaseToken {

    string public name;
    uint8 public decimals;
    string public symbol;

    uint maxId = 0;

    event ItemUpdated(uint256 indexed id, string title, string shortDecription, string longDescription);
    event ItemFilesUpdated(uint itemId, File file, uint _version);
    event CategoryCreated(uint256 indexed id, string title);
    event ItemAdded(uint256 indexed categoryId, uint indexed itemId);
    event SubcategoryAdded(uint256 indexed categoryId, uint indexed subId);

    struct File {
        string format;
        byte[46][] chunks;
    }

    struct Item {
        uint id;
        int256 votes;
        //File[] files;
        uint256 eventBlock;
    }
    
    mapping (uint => Item) private items;
    mapping (uint => mapping (uint => int256)) private votesForSubcategories; // TODO: accessor

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
                        string calldata _longDescription) external {
        Item memory item = Item({id: ++maxId, votes: 0, eventBlock: block.number});
        items[maxId] = item;
        emit ItemUpdated(item.id, _title, _shortDescription, _longDescription);
    }

    function updateItem(uint _itemId,
                        string calldata _title,
                        string calldata _shortDescription,
                        string calldata _longDescription) external {
        emit ItemUpdated(_itemId, _title, _shortDescription, _longDescription);
    }

    function uploadFile(uint _itemId, uint _version, string calldata _format, byte[46][] calldata _chunks) external {
        emit ItemFilesUpdated(_itemId, File({format: _format, chunks: _chunks}), _version);
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
        votesForSubcategories[_child][_parent] += -votesForSubcategories[_child][_parent] + _value; // reclaim the previous vote
    }
}
