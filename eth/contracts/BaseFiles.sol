// SPDX-License-Identifier: AGPL-3.0-or-later

// FIXME: Pay shares dependently on the ORIGINAL author

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './Common.sol';
import './Address.sol';
import './SafeMath.sol';
import './IERC1155.sol';
import './IERC1155TokenReceiver.sol';
import './MainPST.sol';
import './ABDKMath64x64.sol';

abstract contract BaseFiles is IERC1155, ERC165, CommonConstants {

    using SafeMath for uint256;
    using ABDKMath64x64 for int128;
    using Address for address;

    enum EntryKind { NONE, DOWNLOADS, LINK, CATEGORY }

    uint256 constant LINK_KIND_LINK = 0;
    uint256 constant LINK_KIND_MESSAGE = 1;

    // 64.64 fixed point number
    int128 public salesOwnersShare = int128(1).divi(int128(10)); // 10%
    int128 public upvotesOwnersShare = int128(1).divi(int128(2)); // 50%
    int128 public uploadOwnersShare = int128(15).divi(int128(100)); // 15%
    int128 public buyerAffiliateShare = int128(1).divi(int128(10)); // 10%
    int128 public sellerAffiliateShare = int128(15).divi(int128(100)); // 15%
    int128 public arToETHCoefficient = int128(8).divi(int128(10)); // 80%

    uint maxId = 0;

    mapping (uint => EntryKind) public entries;

    mapping (address => address payable) public accountsMapping;
    mapping (address => address payable) public reverseAccountsMapping;

    // to avoid categories with duplicate titles:
    mapping (string => mapping (string => uint)) public categoryTitles; // locale => (title => id)

    mapping (string => address payable) public nickAddresses;
    mapping (address => string) public addressNicks;

    event SetOwner(address payable owner); // share is 64.64 fixed point number
    event SetSalesOwnerShare(int128 share); // share is 64.64 fixed point number
    event SetUpvotesOwnerShare(int128 share); // share is 64.64 fixed point number
    event SetUploadOwnerShare(int128 share); // share is 64.64 fixed point number
    event SetBuyerAffiliateShare(int128 share); // share is 64.64 fixed point number
    event SetSellerAffiliateShare(int128 share); // share is 64.64 fixed point number
    event SetARToETHCoefficient(int128 coeff); // share is 64.64 fixed point number
    event TransferAuthorship(address payable _orig, address payable _new);
    event SetNick(address payable indexed author, string nick);
    event SetARWallet(address payable indexed authro, string arWallet);
    event SetAuthorInfo(address payable indexed author, string link, string shortDescription, string description, string locale);
    event ItemCreated(uint indexed itemId);
    event SetItemOwner(uint indexed itemId, address payable indexed author);
    event ItemUpdated(uint indexed itemId, ItemInfo info);
    event LinkUpdated(uint indexed linkId,
                      string link,
                      string title,
                      string shortDescription,
                      string description,
                      string locale,
                      uint256 indexed linkKind);
    event ItemCoverUpdated(uint indexed itemId, uint indexed version, bytes cover, uint width, uint height);
    event ItemFilesUpdated(uint indexed itemId, string format, uint indexed version, bytes hash);
    event SetLastItemVersion(uint indexed itemId, uint version);
    event CategoryCreated(uint256 indexed categoryId, address indexed author); // zero author - no owner
    event CategoryUpdated(uint256 indexed categoryId, string title, string locale);
    event OwnedCategoryUpdated(uint256 indexed categoryId,
                               string title, string shortDescription,
                               string description,
                               string locale,
                               address indexed author);
    event ChildParentVote(uint child,
                          uint parent,
                          int256 value,
                          int256 featureLevel,
                          bool primary); // Vote is primary if it's an author's vote. // FIXME: if split ownership?
    event Pay(address indexed payer, address indexed payee, uint indexed itemId, uint256 value);
    event Donate(address indexed payer, address indexed payee, uint indexed itemId, uint256 value);

    address payable public founder;
    MainPST pst;
    mapping (uint => address payable) public itemOwners;
    mapping (uint => mapping (uint => int256)) private childParentVotes;
    mapping (uint => uint256) public pricesETH;
    mapping (uint => uint256) public pricesAR;

    constructor(address payable _founder, MainPST _pst) public {
        founder = _founder;
        pst = _pst;
    }

// Owners //

    function setMainOwner(address payable _founder) external {
        require(msg.sender == founder, "Access denied.");
        require(_founder != address(0), "Zero address."); // also prevents makeing owned categories unowned (spam)
        founder = _founder;
        emit SetOwner(_founder);
    }

    function removeMainOwner() external {
        require(msg.sender == founder, "Access denied.");
        founder = address(0);
        emit SetOwner(address(0));
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

    function setBuyerAffiliateShare(int128 _share) external {
        require(msg.sender == founder, "Access denied.");
        buyerAffiliateShare = _share;
        emit SetBuyerAffiliateShare(_share);
    }

    function setSellerAffiliateShare(int128 _share) external {
        require(msg.sender == founder, "Access denied.");
        sellerAffiliateShare = _share;
        emit SetSellerAffiliateShare(_share);
    }

    function setARToETHCoefficient(int128 _coeff) external {
        require(msg.sender == founder, "Access denied.");
        arToETHCoefficient = _coeff;
        emit SetARToETHCoefficient(_coeff);
    }

    function setItemOwner(uint _itemId, address payable _author) external {
        require(_effectiveAccount(itemOwners[_itemId]) == msg.sender, "Access denied.");
        require(_author != address(0), "Zero address.");
        itemOwners[_itemId] = _author;
        emit SetItemOwner(_itemId, _author);
    }

    function removeItemOwner(uint _itemId) external {
        require(_effectiveAccount(itemOwners[_itemId]) == msg.sender, "Access denied.");
        itemOwners[_itemId] = address(0);
        emit SetItemOwner(_itemId, address(0));
    }

// Wallets //

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

    function setAuthorInfo(string calldata _link,
                           string calldata _shortDescription,
                           string calldata _description,
                           string calldata _locale) external {
        emit SetAuthorInfo(msg.sender, _link, _shortDescription, _description, _locale);
    }

// Items //

    struct ItemInfo {
        string title;
        string shortDescription;
        string description;
        uint256 priceETH;
        string locale;
        string license;
    }

    function createItem(ItemInfo calldata _info, address payable _affiliate) external returns (uint)
    {
        return _createItem(_info, _affiliate);
    }

    function _createItem(ItemInfo calldata _info, address payable _affiliate) public returns (uint)
    {
        require(bytes(_info.title).length != 0, "Empty title.");
        setAffiliate(_affiliate);
        _initializeAuthor(++maxId);
        pricesETH[maxId] = _info.priceETH;
        entries[maxId] = EntryKind.DOWNLOADS;
        emit ItemCreated(maxId);
        emit SetItemOwner(maxId, msg.sender);
        emit ItemUpdated(maxId, _info);
        return maxId;
    }

    function updateItem(uint _itemId, ItemInfo calldata _info) external
    {
        require(_effectiveAccount(itemOwners[_itemId]) == msg.sender, "Attempt to modify other's item.");
        require(entries[_itemId] == EntryKind.DOWNLOADS, "Item does not exist.");
        require(bytes(_info.title).length != 0, "Empty title.");
        pricesETH[_itemId] = _info.priceETH;
        emit ItemUpdated(_itemId, _info);
    }

    struct LinkInfo {
        string link;
        string title;
        string shortDescription;
        string description;
        string locale;
        uint256 linkKind;
    }

    function createLink(LinkInfo calldata _info, bool _owned, address payable _affiliate) external returns (uint)
    {
        return _createLink(_info, _owned, _affiliate);
    }

    function _createLink(LinkInfo calldata _info, bool _owned, address payable _affiliate) public returns (uint)
    {
        require(bytes(_info.title).length != 0, "Empty title.");
        setAffiliate(_affiliate);
        address payable _author = _owned ? msg.sender : address(0);
        ++maxId;
        entries[maxId] = EntryKind.LINK;
        emit ItemCreated(maxId);
        if (_owned) {
            _initializeAuthor(maxId);
            emit SetItemOwner(maxId, _author);
        }
        emit LinkUpdated(maxId, _info.link, _info.title, _info.shortDescription, _info.description, _info.locale, _info.linkKind);
        return maxId;
    }

    // Can be used for spam.
    function updateLink(uint _linkId, LinkInfo calldata _info) external
    {
        require(itemOwners[_linkId] == msg.sender, "Attempt to modify other's link."); // only owned links
        require(bytes(_info.title).length != 0, "Empty title.");
        require(entries[_linkId] == EntryKind.LINK, "Link does not exist.");
        emit LinkUpdated(_linkId,
                         _info.link,
                         _info.title,
                         _info.shortDescription,
                         _info.description,
                         _info.locale,
                         _info.linkKind);
    }

    function updateItemCover(uint _itemId, uint _version, bytes calldata _cover, uint _width, uint _height) external {
        require(_effectiveAccount(itemOwners[_itemId]) == msg.sender, "Access denied."); // only owned entries
        EntryKind kind = entries[_itemId];
        require(kind != EntryKind.NONE, "Entry does not exist.");
        emit ItemCoverUpdated(_itemId, _version, _cover, _width, _height);
    }

    function uploadFile(uint _itemId, uint _version, string calldata _format, bytes calldata _hash) external {
        require(_hash.length == 32, "Wrong hash length.");
        require(_effectiveAccount(itemOwners[_itemId]) == msg.sender, "Attempt to modify other's item.");
        require(entries[_itemId] == EntryKind.DOWNLOADS, "Item does not exist.");
        emit ItemFilesUpdated(_itemId, _format, _version, _hash);
    }

    function setLastItemVersion(uint _itemId, uint _version) external {
        require(_effectiveAccount(itemOwners[_itemId]) == msg.sender, "Attempt to modify other's item.");
        require(entries[_itemId] == EntryKind.DOWNLOADS, "Item does not exist.");
        emit SetLastItemVersion(_itemId, _version);
    }

    function pay(uint _itemId, address payable _affiliate) external payable returns (bytes memory) {
        require(pricesETH[_itemId] <= msg.value, "Paid too little.");
        require(entries[_itemId] == EntryKind.DOWNLOADS, "Item does not exist.");
        setAffiliate(_affiliate);
        uint256 _shareholdersShare = uint256(salesOwnersShare.muli(int256(msg.value)));
        address payable _author = itemOwners[_itemId];
        payToShareholders(_shareholdersShare, _author);
        uint256 toAuthor = msg.value - _shareholdersShare;
        payToAuthor(_author, toAuthor);
        emit Pay(msg.sender, itemOwners[_itemId], _itemId, toAuthor);
    }

    function donate(uint _itemId, address payable _affiliate) external payable returns (bytes memory) {
        require(entries[_itemId] == EntryKind.DOWNLOADS, "Item does not exist.");
        setAffiliate(_affiliate);
        uint256 _shareholdersShare = uint256(salesOwnersShare.muli(int256(msg.value)));
        address payable _author = itemOwners[_itemId];
        payToShareholders(_shareholdersShare, _author);
        uint256 toAuthor = msg.value - _shareholdersShare;
        payToAuthor(_author, toAuthor);
        emit Donate(msg.sender, itemOwners[_itemId], _itemId, toAuthor);
    }

// Categories //

    function createCategory(string calldata _title, string calldata _locale, address payable _affiliate) external returns (uint) {
        return _createCategory(_title, _locale, _affiliate);
    }

    function _createCategory(string calldata _title, string calldata _locale, address payable _affiliate) public returns (uint) {
        require(bytes(_title).length != 0, "Empty title.");
        setAffiliate(_affiliate);
        ++maxId;
        uint _id = categoryTitles[_locale][_title];
        if(_id != 0)
            return _id;
        else
            categoryTitles[_locale][_title] = maxId;
        entries[maxId] = EntryKind.CATEGORY;
        // Yes, issue ID two times, for faster information retrieval
        emit CategoryCreated(maxId, address(0));
        emit CategoryUpdated(maxId, _title, _locale);
        return maxId;
    }

    struct OwnedCategoryInfo {
        string title;
        string shortDescription;
        string description;
        string locale;
    }

    function createOwnedCategory(OwnedCategoryInfo calldata _info, address payable _affiliate) external returns (uint) {
        return _createOwnedCategory(_info, _affiliate);
    }

    function _createOwnedCategory(OwnedCategoryInfo calldata _info, address payable _affiliate) public returns (uint) {
        require(bytes(_info.title).length != 0, "Empty title.");
        setAffiliate(_affiliate);
        ++maxId;
        entries[maxId] = EntryKind.CATEGORY;
        _initializeAuthor(maxId);
        // Yes, issue ID two times, for faster information retrieval
        emit CategoryCreated(maxId, msg.sender);
        emit SetItemOwner(maxId, msg.sender);
        emit OwnedCategoryUpdated(maxId, _info.title, _info.shortDescription, _info.description, _info.locale, msg.sender);
        return maxId;
    }

    function updateOwnedCategory(uint _categoryId, OwnedCategoryInfo calldata _info) external {
        require(itemOwners[_categoryId] == msg.sender, "Access denied.");
        require(entries[_categoryId] == EntryKind.CATEGORY, "Must be a category.");
        emit OwnedCategoryUpdated(_categoryId, _info.title, _info.shortDescription, _info.description, _info.locale, msg.sender);
    }

// Voting //

    function voteChildParent(uint _child, uint _parent, bool _yes, address payable _affiliate) external payable {
        _voteChildParent(_child, _parent, _yes, _affiliate, msg.value);
    }

    function _voteChildParent(uint _child, uint _parent, bool _yes, address payable _affiliate, uint256 _amount) public {
        require(entries[_child] != EntryKind.NONE, "Child does not exist.");
        require(entries[_parent] == EntryKind.CATEGORY, "Must be a category.");
        setAffiliate(_affiliate);
        int256 _value = _yes ? int256(_amount) : -int256(_amount);
        if(_value == 0) return; // We don't want to pollute the events with zero votes.
        int256 _newValue = childParentVotes[_child][_parent] + _value;
        childParentVotes[_child][_parent] = _newValue;
        address payable _author = itemOwners[_child];
        if(_yes && _author != address(0)) {
            uint256 _shareholdersShare = uint256(upvotesOwnersShare.muli(int256(_amount)));
            payToShareholders(_shareholdersShare, _author);
            payToAuthor(_author, _amount - _shareholdersShare);
        } else
            payToShareholders(_amount, address(0));
        emit ChildParentVote(_child, _parent, _newValue, 0, false);
    }

    function voteForOwnChild(uint _child, uint _parent) external payable {
        require(entries[_child] != EntryKind.NONE, "Child does not exist.");
        require(entries[_parent] == EntryKind.CATEGORY, "Must be a category.");
        address _author = itemOwners[_child];
        require(_author == msg.sender, "Must be owner.");
        if(msg.value == 0) return; // We don't want to pollute the events with zero votes.
        int256 _value = upvotesOwnersShare.inv().muli(int256(msg.value));
        int256 _newValue = childParentVotes[_child][_parent] + _value;
        childParentVotes[_child][_parent] = _newValue;
        payToShareholders(msg.value, address(0));
        emit ChildParentVote(_child, _parent, _newValue, 0, false);
    }

    function setMyChildParent(uint _child, uint _parent, int256 _value, int256 _featureLevel) external {
        _setMyChildParent(_child, _parent, _value, _featureLevel);
    }

    // _value > 0 - present
    function _setMyChildParent(uint _child, uint _parent, int256 _value, int256 _featureLevel) public {
        require(entries[_child] != EntryKind.NONE, "Child does not exist.");
        require(entries[_parent] == EntryKind.CATEGORY, "Must be a category.");
        require(itemOwners[_parent] == msg.sender, "Access denied.");
        emit ChildParentVote(_child, _parent, _value, _featureLevel, true);
    }

    function getChildParentVotes(uint _child, uint _parent) external view returns (int256) {
        return childParentVotes[_child][_parent];
    }

// PST //

    uint256 totalDividends = 0;
    mapping(address => uint256) lastTotalDivedends; // the value of totalDividends after the last payment to an address
    mapping(address => uint256) authorTotalDividends;
    mapping(address => mapping(address => uint256)) lastAuthorTotalDivedends; // the value of totalDividends after the last payment to an address

    function _dividendsOwing(address _account) internal view returns(uint256) {
        uint256 _newDividends = totalDividends - lastTotalDivedends[_account];
        return (pst.balanceOf(_account) * _newDividends) / pst.totalSupply(); // rounding down
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
            lastTotalDivedends[msg.sender] = totalDividends;
        }
    }

    function _authorDividendsOwing(address payable _author, address _account) internal view returns(uint256) {
        uint256 _newDividends = authorTotalDividends[_author] - lastAuthorTotalDivedends[_author][_account];
        return (balances[_sellerToToken(_author)][_account] * _newDividends) / 10**uint256(decimalsConstant); // rounding down
    }

    function authorDividendsOwing(address payable _author, address _account) external view returns(uint256) {
        return _authorDividendsOwing(_author, _account);
    }

    function withdrawAuthorsProfit(address payable[] calldata _authors) external {
        uint256 _owing = 0;
        for(uint i = 0; i < _authors.length; ++i)
            _owing += _authorDividendsOwing(_authors[i], msg.sender);

        // Against rounding errors. Not necessary because of rounding down.
        // if(_owing > address(this).balance) _owing = address(this).balance;

        if(_owing > 0) {
            msg.sender.transfer(_owing);
            for(uint i = 0; i < _authors.length; ++i) {
                address _author = _authors[i];
                lastAuthorTotalDivedends[_author][msg.sender] = authorTotalDividends[_author];
            }
        }
    }

    function payToShareholders(uint256 _amount, address _author) internal {
        address payable _buyerAffiliate = affiliates[msg.sender];
        address payable _sellerAffiliate = affiliates[_author];
        uint256 _shareHoldersAmount = _amount;
        if(uint(_buyerAffiliate) > 1) {
            uint256 _buyerAffiliateAmount = uint256(buyerAffiliateShare.muli(int256(_amount)));
            _buyerAffiliate.transfer(_buyerAffiliateAmount);
            require(_shareHoldersAmount >= _buyerAffiliateAmount, "Attempt to pay negative amount.");
            _shareHoldersAmount -= _buyerAffiliateAmount;
        }
        if(uint(_sellerAffiliate) > 1) {
            uint256 _sellerAffiliateAmount = uint256(sellerAffiliateShare.muli(int256(_amount)));
            payable(_sellerAffiliate).transfer(_sellerAffiliateAmount);
            require(_shareHoldersAmount >= _sellerAffiliateAmount, "Attempt to pay negative amount.");
            _shareHoldersAmount -= _sellerAffiliateAmount;
        }
        totalDividends += _shareHoldersAmount;
    }

    function payToAuthor(address payable _author, uint256 _amount) internal {
        _author.transfer(_amount);
        authorTotalDividends[_author] += _amount;
    }

// Affiliates //

    mapping (address => address payable) affiliates;

    // Last affiliate wins.
    function setAffiliate(address payable _affiliate) internal {
        // if(affiliates[_affiliate] == address(0))
        //     affiliates[_affiliate] = _affiliate;
        if(uint256(_affiliate) > 1)
            affiliates[msg.sender] = _affiliate;
    }

// Authorship //

    function transferAuthorship(address payable _newAuthor) external {
        require(_newAuthor != address(0), "Zero address.");
        address payable _orig = _originalAccount(_newAuthor);
        accountsMapping[_orig] = _newAuthor;
        reverseAccountsMapping[_newAuthor] = _orig;
        emit TransferAuthorship(_orig, _newAuthor);
    }

    function _effectiveAccount(address payable _orig) internal view returns (address payable) {
        address payable _result = accountsMapping[_orig];
        return _result != address(0) ? _result : _orig;
    }

    function _originalAccount(address payable _effective) internal view returns (address payable) {
        address payable _result = reverseAccountsMapping[_effective];
        return _result != address(0) ? _result : _effective;
    }

// Author's PSTs follow //

    uint8 constant decimalsConstant = 50;

    // id => (owner => balance)
    mapping (uint256 => mapping(address => uint256)) internal balances;

    // owner => (operator => approved)
    mapping (address => mapping(address => bool)) internal operatorApproval;

    mapping (address => bool) public sellerInitialized; // public for Files.sol

/////////////////////////////////////////// ERC165 //////////////////////////////////////////////

    /*
        bytes4(keccak256('supportsInterface(bytes4)'));
    */
    bytes4 constant private INTERFACE_SIGNATURE_ERC165 = 0x01ffc9a7;

    /*
        bytes4(keccak256("safeTransferFrom(address,address,uint256,uint256,bytes)")) ^
        bytes4(keccak256("safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)")) ^
        bytes4(keccak256("balanceOf(address,uint256)")) ^
        bytes4(keccak256("balanceOfBatch(address[],uint256[])")) ^
        bytes4(keccak256("setApprovalForAll(address,bool)")) ^
        bytes4(keccak256("isApprovedForAll(address,address)"));
    */
    bytes4 constant private INTERFACE_SIGNATURE_ERC1155 = 0xd9b67a26;

    function supportsInterface(bytes4 _interfaceId)
    override
    public
    view
    returns (bool) {
         if (_interfaceId == INTERFACE_SIGNATURE_ERC165 ||
             _interfaceId == INTERFACE_SIGNATURE_ERC1155) {
            return true;
         }

         return false;
    }

/////////////////////////////////////////// ERC1155 //////////////////////////////////////////////

    /**
        @notice Transfers `_value` amount of an `_id` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if balance of holder for token `_id` is lower than the `_value` sent.
        MUST revert on any other error.
        MUST emit the `TransferSingle` event to reflect the balance change (see "Safe Transfer Rules" section of the standard).
        After the above conditions are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call `onERC1155Received` on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param _from    Source address
        @param _to      Target address
        @param _id      ID of the token type
        @param _value   Transfer amount
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
    */
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes calldata _data) override external {

        require(_to != address(0x0), "_to must be non-zero.");
        require(_from == msg.sender || operatorApproval[_from][msg.sender] == true, "Need operator approval for 3rd party transfers.");

        // SafeMath will throw with insuficient funds _from
        // or if _id is not valid (balance will be 0)
        balances[_id][_from] = balances[_id][_from].sub(_value);
        balances[_id][_to]   = _value.add(balances[_id][_to]);

        // MUST emit event
        emit TransferSingle(msg.sender, _from, _to, _id, _value);

        // Now that the balance is updated and the event was emitted,
        // call onERC1155Received if the destination is a contract.
        if (_to.isContract()) {
            _doSafeTransferAcceptanceCheck(msg.sender, _from, _to, _id, _value, _data);
        }
    }

    /**
        @notice Transfers `_values` amount(s) of `_ids` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if length of `_ids` is not the same as length of `_values`.
        MUST revert if any of the balance(s) of the holder(s) for token(s) in `_ids` is lower than the respective amount(s) in `_values` sent to the recipient.
        MUST revert on any other error.
        MUST emit `TransferSingle` or `TransferBatch` event(s) such that all the balance changes are reflected (see "Safe Transfer Rules" section of the standard).
        Balance changes and events MUST follow the ordering of the arrays (_ids[0]/_values[0] before _ids[1]/_values[1], etc).
        After the above conditions for the transfer(s) in the batch are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call the relevant `ERC1155TokenReceiver` hook(s) on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param _from    Source address
        @param _to      Target address
        @param _ids     IDs of each token type (order and length must match _values array)
        @param _values  Transfer amounts per token type (order and length must match _ids array)
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `_to`
    */
    function safeBatchTransferFrom(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) override external {

        // MUST Throw on errors
        require(_to != address(0x0), "destination address must be non-zero.");
        require(_ids.length == _values.length, "_ids and _values array length must match.");
        require(_from == msg.sender || operatorApproval[_from][msg.sender] == true, "Need operator approval for 3rd party transfers.");

        for (uint256 i = 0; i < _ids.length; ++i) {
            uint256 id = _ids[i];
            uint256 value = _values[i];

            // SafeMath will throw with insuficient funds _from
            // or if _id is not valid (balance will be 0)
            balances[id][_from] = balances[id][_from].sub(value);
            balances[id][_to]   = value.add(balances[id][_to]);
        }

        // Note: instead of the below batch versions of event and acceptance check you MAY have emitted a TransferSingle
        // event and a subsequent call to _doSafeTransferAcceptanceCheck in above loop for each balance change instead.
        // Or emitted a TransferSingle event for each in the loop and then the single _doSafeBatchTransferAcceptanceCheck below.
        // However it is implemented the balance changes and events MUST match when a check (i.e. calling an external contract) is done.

        // MUST emit event
        emit TransferBatch(msg.sender, _from, _to, _ids, _values);

        // Now that the balances are updated and the events are emitted,
        // call onERC1155BatchReceived if the destination is a contract.
        if (_to.isContract()) {
            _doSafeBatchTransferAcceptanceCheck(msg.sender, _from, _to, _ids, _values, _data);
        }
    }

    /**
        @notice Get the balance of an account's Tokens.
        @param _owner  The address of the token holder
        @param _id     ID of the Token
        @return        The _owner's balance of the Token type requested
     */
    function balanceOf(address _owner, uint256 _id) override external view returns (uint256) {
        // The balance of any account can be calculated from the Transfer events history.
        // However, since we need to keep the balances to validate transfer request,
        // there is no extra cost to also privide a querry function.
        return balances[_id][_owner];
    }


    /**
        @notice Get the balance of multiple account/token pairs
        @param _owners The addresses of the token holders
        @param _ids    ID of the Tokens
        @return        The _owner's balance of the Token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) override external view returns (uint256[] memory) {

        require(_owners.length == _ids.length);

        uint256[] memory balances_ = new uint256[](_owners.length);

        for (uint256 i = 0; i < _owners.length; ++i) {
            balances_[i] = balances[_ids[i]][_owners[i]];
        }

        return balances_;
    }

    /**
        @notice Enable or disable approval for a third party ("operator") to manage all of the caller's tokens.
        @dev MUST emit the ApprovalForAll event on success.
        @param _operator  Address to add to the set of authorized operators
        @param _approved  True if the operator is approved, false to revoke approval
    */
    function setApprovalForAll(address _operator, bool _approved) override external {
        operatorApproval[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /**
        @notice Queries the approval status of an operator for a given owner.
        @param _owner     The owner of the Tokens
        @param _operator  Address of authorized operator
        @return           True if the operator is approved, false if not
    */
    function isApprovedForAll(address _owner, address _operator) override external view returns (bool) {
        return operatorApproval[_owner][_operator];
    }

/////////////////////////////////////////// IERC1155Views //////////////////////////////////////////////

    mapping (uint256 => uint256) public totalSupply;

    function name(uint256 /*_id*/) external pure returns (string memory) {
        return "SEL";
    }

    function symbol(uint256 /*_id*/) external pure returns (string memory) {
        return "A seller";
    }

    function decimals(uint256 /*_id*/) external pure returns (uint8) {
        return decimalsConstant;
    }

    function uri(uint256 /*_id*/) external pure returns (string memory) {
        return "FIXME";
    }

/////////////////////////////////////////// Minting //////////////////////////////////////////////

    function _initializeAuthor(uint _itemId) internal {
        if(sellerInitialized[msg.sender]) return;
        sellerInitialized[msg.sender] = true;
        itemOwners[_itemId] = msg.sender;
        uint256 _id = _sellerToToken(msg.sender);
        balances[_id][msg.sender] = 10**uint256(decimalsConstant);
        totalSupply[_id] = 10**uint256(decimalsConstant);
        TransferSingle(msg.sender, address(0), msg.sender, _id, 10**uint256(decimalsConstant));
    }

/////////////////////////////////////////// Internal //////////////////////////////////////////////

    function _doSafeTransferAcceptanceCheck(address _operator, address _from, address _to, uint256 _id, uint256 _value, bytes memory _data) internal {

        // If this was a hybrid standards solution you would have to check ERC165(_to).supportsInterface(0x4e2312e0) here but as this is a pure implementation of an ERC-1155 token set as recommended by
        // the standard, it is not necessary. The below should revert in all failure cases i.e. _to isn't a receiver, or it is and either returns an unknown value or it reverts in the call to indicate non-acceptance.


        // Note: if the below reverts in the onERC1155Received function of the _to address you will have an undefined revert reason returned rather than the one in the require test.
        // If you want predictable revert reasons consider using low level _to.call() style instead so the revert does not bubble up and you can revert yourself on the ERC1155_ACCEPTED test.
        require(ERC1155TokenReceiver(_to).onERC1155Received(_operator, _from, _id, _value, _data) == ERC1155_ACCEPTED, "contract returned an unknown value from onERC1155Received");
    }

    function _doSafeBatchTransferAcceptanceCheck(address _operator, address _from, address _to, uint256[] memory _ids, uint256[] memory _values, bytes memory _data) internal {

        // If this was a hybrid standards solution you would have to check ERC165(_to).supportsInterface(0x4e2312e0) here but as this is a pure implementation of an ERC-1155 token set as recommended by
        // the standard, it is not necessary. The below should revert in all failure cases i.e. _to isn't a receiver, or it is and either returns an unknown value or it reverts in the call to indicate non-acceptance.

        // Note: if the below reverts in the onERC1155BatchReceived function of the _to address you will have an undefined revert reason returned rather than the one in the require test.
        // If you want predictable revert reasons consider using low level _to.call() style instead so the revert does not bubble up and you can revert yourself on the ERC1155_BATCH_ACCEPTED test.
        require(ERC1155TokenReceiver(_to).onERC1155BatchReceived(_operator, _from, _ids, _values, _data) == ERC1155_BATCH_ACCEPTED, "contract returned an unknown value from onERC1155BatchReceived");
    }

    function _getSeller(uint256 _id) internal pure returns (address payable) {
        return address(_id);
    }

    function _sellerToToken(address payable _seller) internal pure returns (uint256) {
        return uint256(_seller);
    }
}
