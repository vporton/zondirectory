// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;
//pragma experimental ABIEncoderV2;

import './BaseToken.sol';
import './ABDKMath64x64.sol';

// TODO: Encode wallets and hashes as uint256

contract Files is BaseToken {

    using ABDKMath64x64 for int128;

    string public name;
    uint8 public decimals;
    string public symbol;

    // 64.64 fixed point number
    int128 public ownersShare = int128(1).divi(int128(10)); // 1/10
    mapping (uint => address) public holdersIndexes;
    uint public numberOfHolders = 1;

    uint maxId = 0;
    uint maxVoteId = 0;

    // to avoid categories with duplicate titles:
    mapping (string => mapping (string => bool)) categoryTitles; // locale => (title => bool)

    event SetOwner(address payable owner); // share is 64.64 fixed point number
    event SetOwnerShare(int128 share); // share is 64.64 fixed point number
    event SetARWallet(address payable indexed owner, string arWallet);
    event SetAuthorInfo(address payable indexed owner, string description, string locale);
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
                      string locale);
    event ItemCoverUpdated(uint indexed itemId, uint indexed version, bytes cover, uint width, uint height);
    event ItemFilesUpdated(uint indexed itemId, string format, uint indexed version, string hash);
    event SetLastItemVersion(uint indexed itemId, uint version);
    event CategoryCreated(uint256 indexed categoryId, string title, string locale);
    event ChildParentVote(uint child, uint parent, int256 value);
    event Pay(address indexed payer, address indexed payee, uint indexed itemId, uint256 value);
    event Donate(address indexed payer, address indexed payee, uint indexed itemId, uint256 value);

    address payable founder;
    mapping (uint => address payable) itemOwners;
    mapping (uint => mapping (uint => int256)) private childParentVotes;
    mapping (uint => uint256) pricesETH;
    mapping (uint => uint256) pricesAR;

    constructor(address payable _founder, uint256 _initialBalance) public {
        founder = _founder;
        name = "Cryptozon PST Token (ETH)";
        decimals = 18;
        symbol = "CZPST";
        totalSupply = _initialBalance;
        holdersIndexes[0] = _founder;
    }

// ERC-20 //

    function transfer(address _to, uint256 _value) external override returns (bool success) {
        if (balances[_to] == 0 && _value != 0) {
            holdersIndexes[numberOfHolders++] = _to;
        }
        return BaseToken(this).transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) external override returns (bool success) {
        if (balances[_to] == 0 && _value != 0) {
            holdersIndexes[numberOfHolders++] = _to;
        }
        return BaseToken(this).transferFrom(_from, _to, _value);
    }

// Owners //

    function setOwner(address payable _founder) external {
        require(msg.sender == founder, "Access denied.");
        require(_founder != address(0), "Zero address.");
        founder = _founder;
        emit SetOwner(_founder);
    }

    // _share is 64.64 fixed point number
    function setOwnersShare(int128 _share) external {
        require(msg.sender == founder, "Access denied.");
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

    function setAuthorInfo(address payable _owner, string calldata _description, string calldata _locale) external {
        emit SetAuthorInfo(_owner, _description, _locale);
    }

/// Items ///

    function createItem(string calldata _title,
                        string calldata _description,
                        uint256 _priceETH,
                        uint256 _priceAR,
                        string calldata _locale,
                        string calldata _license) external
    {
        require(bytes(_title).length != 0, "Empty title.");
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
        require(bytes(_title).length != 0, "Empty title.");
        pricesETH[_itemId] = _priceETH;
        pricesAR[_itemId] = _priceAR;
        emit ItemUpdated(_itemId, _title, _description, _priceETH, _priceAR, _locale, _license);
    }

    function createLink(string calldata _link,
                        string calldata _title,
                        string calldata _description,
                        string calldata _locale) external
    {
        require(bytes(_title).length != 0, "Empty title.");
        itemOwners[++maxId] = msg.sender;
        emit ItemCreated(maxId);
        emit SetItemOwner(maxId, msg.sender);
        emit LinkUpdated(maxId, _link, _title, _description, _locale);
    }

    function updateLink(uint _linkId,
                        string calldata _link,
                        string calldata _title,
                        string calldata _description,
                        string calldata _locale) external
    {
        require(itemOwners[_linkId] == msg.sender, "Attempt to modify other's item.");
        require(bytes(_title).length != 0, "Empty title.");
        emit LinkUpdated(_linkId, _link, _title, _description, _locale);
    }

    function updateItemCover(uint _itemId, uint _version, bytes calldata _cover, uint _width, uint _height) external {
        emit ItemCoverUpdated(_itemId, _version, _cover, _width, _height);
    }

    function uploadFile(uint _itemId, uint _version, string calldata _format, string calldata _hash) external {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        emit ItemFilesUpdated(_itemId, _format, _version, _hash);
    }

    function setLastItemVersion(uint _itemId, uint _version) external {
        require(itemOwners[_itemId] == msg.sender, "Attempt to modify other's item.");
        emit SetLastItemVersion(_itemId, _version);
    }

    function pay(uint _itemId) external payable returns (bytes memory) {
        require(pricesETH[_itemId] <= msg.value, "Paid too little.");
        uint256 _shareholdersShare = uint256(ownersShare.muli(int256(msg.value)));
        totalDividends += _shareholdersShare;
        uint256 toAuthor = msg.value - _shareholdersShare;
        itemOwners[_itemId].transfer(toAuthor);
        emit Pay(msg.sender, itemOwners[_itemId], _itemId, toAuthor);
    }

    function donate(uint _itemId) external payable returns (bytes memory) {
        uint256 _shareholdersShare = uint256(ownersShare.muli(int256(msg.value)));
        totalDividends += _shareholdersShare;
        itemOwners[_itemId].transfer(msg.value - _shareholdersShare);
        uint256 toAuthor = msg.value - _shareholdersShare;
        itemOwners[_itemId].transfer(toAuthor);
        emit Donate(msg.sender, itemOwners[_itemId], _itemId, toAuthor);
    }

/// Categories ///

    function createCategory(string calldata _title, string calldata _locale) external {
        require(bytes(_title).length != 0, "Empty title.");
        if(categoryTitles[_locale][_title])
            return;
        else
            categoryTitles[_locale][_title] = true;
        emit CategoryCreated(++maxId, _title, _locale);
    }

/// Voting ///

    function voteChildParent(uint _child, uint _parent, bool _yes) external payable {
        int256 _value = _yes ? int256(msg.value) : -int256(msg.value);
        if(_value == 0) return; // We don't want to pollute the events with zero votes.
        totalDividends += msg.value;
        int256 _newValue = childParentVotes[_child][_parent] + _value;
        childParentVotes[_child][_parent] = _newValue;
        emit ChildParentVote(_child, _parent, _newValue);
    }

    function getChildParentVotes(uint _child, uint _parent) external view returns (int256) {
        return childParentVotes[_child][_parent];
    }

// PST ///

    uint256 totalDividends = 0;
    uint256 totalDividendsPaid = 0; // actually paid sum
    mapping(address => uint256) lastTotalDivedends; // the value of totalDividendsPaid at the last payment to an address

    function dividendsOwing(address _account) internal view returns(uint256) {
        uint256 _newDividends = totalDividends - lastTotalDivedends[_account];
        return (balances[_account] * _newDividends) / totalSupply; // rounding down
    }

    function withdrawProfit() external {
        uint256 _owing = dividendsOwing(msg.sender);

        // Against rounding errors. Not necessary because of rounding down.
        // if(owing > address(this).balance) owing = address(this).balance;

        if(_owing > 0) {
            msg.sender.transfer(_owing);
            totalDividendsPaid += _owing;
            lastTotalDivedends[msg.sender] = totalDividendsPaid;
        }
    }
}
