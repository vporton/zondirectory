pragma solidity ^0.6.0;

import './BaseToken.sol';

contract Categories is BaseToken {

    string public name;
    uint8 public decimals;
    string public symbol;

    uint maxId = 0;

    event ItemUpdated(uint256 indexed id, string title, string shortDecription, string longDescription);
    event CategoryCreated(uint256 indexed id, string title);
    event ItemAdded(uint256 indexed categoryId, uint indexed itemId);
    event SubcategoryAdded(uint256 indexed categoryId, uint indexed subId);

    // voter => (issue => value)
    mapping (address => mapping (uint256 => int256)) voters;

    struct File {
        string format;
        byte[46][] chunks;
    }

    struct Item {
        uint id;
        int256 votes;
        File[] files;
        uint256 eventBlock;
    }
    
    struct Subcategory {
        uint id;
        Category category;
        int256 votes;
    }

    struct Category {
        uint id;
        uint256[] subcategories;
        Item[] items;
        uint256 eventBlock;
    }

    mapping (uint => Item) private items;
    mapping (uint => Subcategory) private categories;

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
        Item memory item = Item({id: ++maxId, votes: 0, files: new File[](0), eventBlock: block.number});
        items[maxId] = item;
        emit ItemUpdated(item.id, _title, _shortDescription, _longDescription);
    }

    function updateItem(uint _itemId,
                        string calldata _title,
                        string calldata _shortDescription,
                        string calldata _longDescription) external {
        emit ItemUpdated(_itemId, _title, _shortDescription, _longDescription);
    }

    function uploadFile(uint _itemId, string calldata _format, byte[46][] calldata _chunks) external {
        items[_itemId].files.push(File({format: _format, chunks: _chunks}));
    }

/// Categories ///

    function createCategory(bytes calldata _link, string calldata _title, string calldata _description) external {
        Category memory category = Category({
            id: ++maxId,
            subcategories: new uint256[](0),
            items: new Item[](0),
            eventBlock: block.number
        });
        categories[category.id] = storage(category);
        emit CategoryCreated(category.id, _title);
    }

    function addItemToCategory(uint256 _categoryId, uint256 _itemId) external {
        categories[_categoryId].category.items.push(items[_itemId]);
        emit ItemAdded(_categoryId, _itemId);
    }

    function addSubcategory(uint256 _categoryId, uint256 _subCategory) external {
        categories[_categoryId].category.subcategories.push(_subCategory);
        emit SubcategoryAdded(_categoryId, _categoryId);
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
