pragma solidity ^0.5.0;

import './BaseToken.sol';

contract Categories is BaseToken {

    string public name;
    uint8 public decimals;
    string public symbol;
    string public version = 'U1';

    uint maxId = 0;
    
    event ItemCreated(uint256 indexed id, uint indexed version, string title, string description);
    event CategoryCreated(uint256 indexed id, string title);
    event ItemAdded(uint256 indexed categoryId, uint indexed itemId);
    event SubcategoryAdded(uint256 indexed categoryId, uint indexed subId);

    // voter => (issue => value)
    mapping (address => mapping (uint256 => int256)) voters;
    
    struct Item {
        uint256 id;
        int256 votes;
        byte[46][] links; // array of item versions
        uint256 eventBlock;
    }
    
    struct Subcategory {
        uint256 id;
        Category category;
        int256 votes;
    }

    struct Category {
        uint256[] subcategories;
        Item[] items;
        uint256 eventBlock;
    }

    mapping (uint256 => Item) private items;
    mapping (uint256 => Subcategory) private categories;

/// ERC-20 ///

    constructor() public {
        name = "Voting";
        decimals = 8;
        symbol = "VOT";
    }

    function() payable external {
        totalSupply = msg.value;
        balances[msg.sender] += msg.value; // 1/1 exchange rate
        emit Transfer(address(this), msg.sender, msg.value);
    }

/// Items ///

    function createItem(bytes calldata _link, string calldata _title, string calldata _description) external {
        byte[46][] memory _links = new byte[46][](1);
        for (uint i=0; i<46; ++i)
            _links[0][i] = _link[i];
        Item memory item = Item({id: ++maxId, votes: 0, links: _links, eventBlock: block.number});
        items[maxId] = item;
        emit ItemCreated(item.id, item.length, _title, _description);
    }

    function createCategory(bytes calldata _link, string calldata _title, string calldata _description) external {
        Category memory item;
        categories[maxId] = item;
        category.subcategories.push(item);
        emit CategoryCreated(item.id, _title);
    }

    function addItemToCategory(uint256 _categoryId, uint256 _itemId) external {
        categories[_categoryId].category.items.push(items[_itemId]);
        emit ItemAdded(_categoryId, _itemId);
    }

    function addSubcategory(uint256 _categoryId, uint256 _subCategory) external {
        categories[_categoryId].category.subcategories.push(_subCategory);
        emit SubcategoryAdded(_categoryId, _itemId);
    }

/// Voting ///

    function voteForItem(uint256 _issue, bool _yes) external {
        int256 _value = _yes ? int256(balances[msg.sender]) : -int256(balances[msg.sender]);
        items[_issue].votes += -voters[msg.sender][_issue] + _value; // reclaim the previous vote
        voters[msg.sender][_issue] = _value;
    }

    function voteForCategory(uint256 _issue, bool _yes) external {
        int256 _value = _yes ? int256(balances[msg.sender]) : -int256(balances[msg.sender]);
        categories[_issue].votes += -voters[msg.sender][_issue] + _value; // reclaim the previous vote
        voters[msg.sender][_issue] = _value;
    }
}
