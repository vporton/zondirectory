// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;
//pragma experimental ABIEncoderV2;

import './BaseToken.sol';
import './ABDKMath64x64.sol';

// TODO: Encode wallets and hashes as uint256

contract Files is BaseToken {

    using ABDKMath64x64 for int128;

    enum EntryKind { NONE, DOWNLOADS, LINK, CATEGORY }

    uint256 constant LINK_KIND_LINK = 0;
    uint256 constant LINK_KIND_MESSAGE = 1;

    string public name;
    uint8 public decimals;
    string public symbol;

    // 64.64 fixed point number
    int128 public salesOwnersShare = int128(1).divi(int128(10)); // 10%
    int128 public upvotesOwnersShare = int128(1).divi(int128(2)); // 50%
    int128 public uploadOwnersShare = int128(15).divi(int128(100)); // 15%

    uint maxId = 0;

    mapping (uint => EntryKind) entries;

    // to avoid categories with duplicate titles:
    mapping (string => mapping (string => uint)) categoryTitles; // locale => (title => id)

    mapping (string => address payable) nickAddresses;
    mapping (address => string) addressNicks;

    event SetOwner(address payable owner); // share is 64.64 fixed point number
    event SetSalesOwnerShare(int128 share); // share is 64.64 fixed point number
    event SetUpvotesOwnerShare(int128 share); // share is 64.64 fixed point number
    event SetUploadOwnerShare(int128 share); // share is 64.64 fixed point number
    event SetNick(address payable indexed owner, string nick);
    event SetARWallet(address payable indexed owner, string arWallet);
    event SetAuthorInfo(address payable indexed owner, string link, string description, string locale);
    event ItemCreated(uint indexed itemId);
    event SetItemOwner(uint indexed itemId, address payable indexed owner);
    event ItemUpdated(uint indexed itemId,
                      string title,
                      string description,
                      uint256 priceETH,
                      uint256 priceAR,
                      string locale,
                      string license);
    event LinkUpdated(uint indexed linkId,
                      string link,
                      string title,
                      string description,
                      string locale,
                      uint256 indexed linkKind);
    event ItemCoverUpdated(uint indexed itemId, uint indexed version, bytes cover, uint width, uint height);
    event ItemFilesUpdated(uint indexed itemId, string format, uint indexed version, string hash);
    event SetLastItemVersion(uint indexed itemId, uint version);
    event CategoryCreated(uint256 indexed categoryId, address indexed owner); // zero owner - no owner
    event CategoryUpdated(uint256 indexed categoryId, string title, string locale, address indexed owner);
    event ChildParentVote(uint child,
                          uint parent,
                          int256 value,
                          int256 featureLevel,
                          bool primary); // Vote is primary if it's an owner's vote.
    event Pay(address indexed payer, address indexed payee, uint indexed itemId, uint256 value);
    event Donate(address indexed payer, address indexed payee, uint indexed itemId, uint256 value);

    address payable public founder;
    mapping (uint => address payable) public itemOwners;
    mapping (uint => mapping (uint => int256)) private childParentVotes;
    mapping (uint => uint256) public pricesETH;
    mapping (uint => uint256) public pricesAR;

    constructor(address payable _founder, uint256 _initialBalance) public {
        founder = _founder;
        name = "Cryptozon PST Token (ETH)";
        decimals = 18;
        symbol = "CZPST";
        balances[_founder] = _initialBalance;
        totalSupply = _initialBalance;
    }

// Owners //

    function setOwner(address payable _founder) external {
        require(msg.sender == founder, "Access denied.");
        require(_founder != address(0), "Zero address."); // also prevents makeing owned categories unowned (spam)
        founder = _founder;
        emit SetOwner(_founder);
    }

    // _share is 64.64 fixed point number
    function setSalesOwnersShare(int128 _share) external {
        require(msg.sender == founder, "Access denied.");
        salesOwnersShare = _share;
        emit SetSalesOwnerShare(_share);
    }

    function setUpvotesOwnersShare(int128 _share) external {
        require(msg.sender == founder, "Access denied.");
        upvotesOwnersShare = _share;
        emit SetUpvotesOwnerShare(_share);
    }

    function setUploadOwnersShare(int128 _share) external {
        require(msg.sender == founder, "Access denied.");
        uploadOwnersShare = _share;
        emit SetUploadOwnerShare(_share);
    }

    function setItemOwner(uint _itemId, address payable _owner) external {
        require(itemOwners[_itemId] == msg.sender, "Access denied.");
        itemOwners[_itemId] = _owner;
        emit SetItemOwner(_itemId, _owner);
    }

/// Wallets ///

    function setARWallet(string calldata _arWallet) external {
        emit SetARWallet(msg.sender, _arWallet);
    }

    // TODO: Test.
    function setNick(string calldata _nick) external {
        require(nickAddresses[_nick] == address(0), "Nick taken.");
        nickAddresses[addressNicks[msg.sender]] = address(0);
        nickAddresses[_nick] = msg.sender;
        addressNicks[msg.sender] = _nick;
        emit SetNick(msg.sender, _nick);
    }

    function setAuthorInfo(string calldata _link, string calldata _description, string calldata _locale) external {
        emit SetAuthorInfo(msg.sender, _link, _description, _locale);
    }

/// Items ///

    function createItem(string calldata _title,
                        string calldata _description,
                        uint256 _priceETH,
                        uint256 _priceAR,
                        string calldata _locale,
                        string calldata _license) external returns (uint)
    {
        require(bytes(_title).length != 0, "Empty title.");
        itemOwners[++maxId] = msg.sender;
        pricesETH[maxId] = _priceETH;
        pricesAR[maxId] = _priceAR;
        entries[maxId] = EntryKind.DOWNLOADS;
        emit ItemCreated(maxId);
        emit SetItemOwner(maxId, msg.sender);
        emit ItemUpdated(maxId, _title, _description, _priceETH, _priceAR, _locale, _license);
        return maxId;
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
        require(entries[maxId] == EntryKind.DOWNLOADS, "Item does not exist.");
        require(bytes(_title).length != 0, "Empty title.");
        pricesETH[_itemId] = _priceETH;
        pricesAR[_itemId] = _priceAR;
        emit ItemUpdated(_itemId, _title, _description, _priceETH, _priceAR, _locale, _license);
    }

    function createLink(string calldata _link,
                        string calldata _title,
                        string calldata _description,
                        string calldata _locale,
                        uint256 _linkKind,
                        bool _owned) external returns (uint)
    {
        require(bytes(_title).length != 0, "Empty title.");
        address payable _owner = _owned ? msg.sender : address(0);
        itemOwners[++maxId] = _owner;
        entries[maxId] = EntryKind.LINK;
        emit ItemCreated(maxId);
        if (_owned) emit SetItemOwner(maxId, _owner);
        emit LinkUpdated(maxId, _link, _title, _description, _locale, _linkKind);
        return maxId;
    }

    // Can be used for spam.
    function updateLink(uint _linkId,
                        string calldata _link,
                        string calldata _title,
                        string calldata _description,
                        string calldata _locale,
                        uint256 _linkKind) external
    {
        require(itemOwners[_linkId] == msg.sender, "Attempt to modify other's link."); // only owned links
        require(bytes(_title).length != 0, "Empty title.");
        require(entries[maxId] == EntryKind.LINK, "Link does not exist.");
        emit LinkUpdated(_linkId, _link, _title, _description, _locale, _linkKind);
    }

    function updateItemCover(uint _itemId, uint _version, bytes calldata _cover, uint _width, uint _height) external {
        require(itemOwners[_itemId] == msg.sender, "Access denied."); // only owned entries
        EntryKind kind = entries[maxId];
        require(kind != EntryKind.NONE, "Entry does not exist.");
        emit ItemCoverUpdated(_itemId, _version, _cover, _width, _height);
    }

    function uploadFile(uint _itemId, uint _version, string calldata _format, string calldata _hash) external {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        require(entries[maxId] == EntryKind.DOWNLOADS, "Item does not exist.");
        emit ItemFilesUpdated(_itemId, _format, _version, _hash);
    }

    function setLastItemVersion(uint _itemId, uint _version) external {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        require(entries[maxId] == EntryKind.DOWNLOADS, "Item does not exist.");
        emit SetLastItemVersion(_itemId, _version);
    }

    function pay(uint _itemId) external payable returns (bytes memory) {
        require(pricesETH[_itemId] <= msg.value, "Paid too little.");
        require(entries[maxId] == EntryKind.DOWNLOADS, "Item does not exist.");
        uint256 _shareholdersShare = uint256(salesOwnersShare.muli(int256(msg.value)));
        totalDividends += _shareholdersShare;
        uint256 toAuthor = msg.value - _shareholdersShare;
        itemOwners[_itemId].transfer(toAuthor);
        emit Pay(msg.sender, itemOwners[_itemId], _itemId, toAuthor);
    }

    function donate(uint _itemId) external payable returns (bytes memory) {
        require(entries[maxId] == EntryKind.DOWNLOADS, "Item does not exist.");
        uint256 _shareholdersShare = uint256(salesOwnersShare.muli(int256(msg.value)));
        totalDividends += _shareholdersShare;
        uint256 toAuthor = msg.value - _shareholdersShare;
        itemOwners[_itemId].transfer(toAuthor);
        emit Donate(msg.sender, itemOwners[_itemId], _itemId, toAuthor);
    }

/// Categories ///

    function createCategory(string calldata _title, string calldata _locale, bool _owned) external returns (uint) {
        require(bytes(_title).length != 0, "Empty title.");
        address payable _owner = _owned ? msg.sender : address(0);
        ++maxId;
        if(!_owned) {
            uint _id = categoryTitles[_locale][_title];
            if(_id != 0)
                return _id;
            else
                categoryTitles[_locale][_title] = maxId;
        }
        entries[maxId] = EntryKind.CATEGORY;
        if(_owned) // check to speed-up
            itemOwners[maxId] = _owner;
        // Yes, issue _owner two times, for faster information retrieval
        emit CategoryCreated(maxId, _owner);
        emit SetItemOwner(maxId, _owner);
        emit CategoryUpdated(maxId, _title, _locale, _owner);
        return maxId;
    }

    function updateCategory(uint _categoryId, string calldata _title, string calldata _locale) external {
        require(itemOwners[_categoryId] == msg.sender, "Access denied.");
        require(entries[_categoryId] == EntryKind.CATEGORY, "Must be a category.");
        emit CategoryUpdated(maxId, _title, _locale, msg.sender);
    }

/// Voting ///

    function voteChildParent(uint _child, uint _parent, bool _yes) external payable {
        require(entries[_child] != EntryKind.NONE, "Child does not exist.");
        require(entries[_parent] == EntryKind.CATEGORY, "Must be a category.");
        int256 _value = _yes ? int256(msg.value) : -int256(msg.value);
        if(_value == 0) return; // We don't want to pollute the events with zero votes.
        int256 _newValue = childParentVotes[_child][_parent] + _value;
        childParentVotes[_child][_parent] = _newValue;
        address payable _owner = itemOwners[_child];
        if(_yes && _owner != address(0)) {
            uint256 _shareholdersShare = uint256(upvotesOwnersShare.muli(int256(msg.value)));
            totalDividends += _shareholdersShare;
            _owner.transfer(msg.value - _shareholdersShare);
        } else
            totalDividends += msg.value;
        emit ChildParentVote(_child, _parent, _newValue, 0, false);
    }

    function voteForOwnChild(uint _child, uint _parent) external payable {
        require(entries[_child] != EntryKind.NONE, "Child does not exist.");
        require(entries[_parent] == EntryKind.CATEGORY, "Must be a category.");
        address _owner = itemOwners[_child];
        require(_owner == msg.sender, "Must be owner.");
        if(msg.value == 0) return; // We don't want to pollute the events with zero votes.
        int256 _value = upvotesOwnersShare.inv().muli(int256(msg.value));
        int256 _newValue = childParentVotes[_child][_parent] + _value;
        childParentVotes[_child][_parent] = _newValue;
        totalDividends += msg.value;
        emit ChildParentVote(_child, _parent, _newValue, 0, false);
    }

    // _value > 0 - present
    function setMyChildParent(uint _child, uint _parent, int256 _value, int256 _featureLevel) external {
        require(entries[_child] != EntryKind.NONE, "Child does not exist.");
        require(entries[_parent] == EntryKind.CATEGORY, "Must be a category.");
        require(itemOwners[_parent] == msg.sender, "Access denied.");
        emit ChildParentVote(_child, _parent, _value, _featureLevel, true);
    }

    function getChildParentVotes(uint _child, uint _parent) external view returns (int256) {
        return childParentVotes[_child][_parent];
    }

// PST ///

    uint256 totalDividends = 0;
    uint256 totalDividendsPaid = 0; // actually paid sum
    mapping(address => uint256) lastTotalDivedends; // the value of totalDividends after the last payment to an address

    function _dividendsOwing(address _account) internal view returns(uint256) {
        uint256 _newDividends = totalDividends - lastTotalDivedends[_account];
        return (balances[_account] * _newDividends) / totalSupply; // rounding down
    }

    function dividendsOwing(address _account) external view returns(uint256) {
        return _dividendsOwing(_account);
    }

    function withdrawProfit() external {
        uint256 _owing = _dividendsOwing(msg.sender);

        // Against rounding errors. Not necessary because of rounding down.
        // if(_owing > address(this).balance) _owing = address(this).balance;

        if(_owing > 0) {
            msg.sender.transfer(_owing);
            totalDividendsPaid += _owing;
            lastTotalDivedends[msg.sender] = totalDividends;
        }
    }
}
