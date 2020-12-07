# Audit report

| Name       | Information |
|:----------:|-----------|
| Repository | https://github.com/vporton/zondirectory |
| Revision   | [9fd543fa83d5d3ce9f642c85d566f5ad122b9509](https://github.com/vporton/zondirectory/tree/9fd543fa83d5d3ce9f642c85d566f5ad122b9509/eth/contracts) |
| Branch     | [design](https://github.com/vporton/zondirectory/tree/design/eth/contracts) |
| Time       | Mon, 07 Dec 2020 07:42:21 UTC |
| Author     | Chiro Hiro |
| Ignore     | Proxy.sol  |

# Result

| Severity | Count     | Link |
|:--------:|----------:|------|
| High     | 5        | |
|||[H01 - Modify contract's state without any permission](#H01)|
|||[H02 - Methods should not available in public](#H02)|
|||[H03 - Possible Ethereum trapped and lost](#H03)|
|||[H04 - Possible logic issue of voting](#H04)|
|||[H05 - Possible integer underflow/overflow](#H05)|
| Medium   | 4        |      |
|||[M01 - Possible wrong result in smart contract existence check](#M01)|
|||[M02 - Prefer to use self-define modifier](#M02)|
|||[M03 - Should use better ERC20 implementation](#M03)|
|||[M04 - Should use SafeMath](#M04)|
| Low      | 3         |      |
|||[L01 - User constructor instead of initialize](#L01)|
|||[L02 - Out date library](#L02)|
|||[L03 - Better to revert](#L03)|

<a name="H01"/>

## H01 - Modify contract's state without any permission

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| BaseFiles.sol   | High      |   1   | [158](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L158)|

This function need to be protected

```solidity
    function setTokenUri(string calldata _tokenUri) external {
        tokenUri = _tokenUri;
    }
```

Suggest fix:

```solidity
    modifier onlyFounder(){
        require(msg.sender == founder, "Access denied");
        _;
    }

    function setTokenUri(string calldata _tokenUri) external onlyFounder {
        tokenUri = _tokenUri;
    }
```

<a name="H02"/>

## H02 - These methods should not available in public

| Affected        | Severity  | Count | Lines |
|:---------------:|:----------|------:|-------|
| BaseFiles.sol   | High      |   6   |[200](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L200), [237](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L237), [313](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L313), [340](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L340), [365](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L365), [401](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L401)|
|BlogTemplates.sol|High|1|[69](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L69)|
|Files.sol|High|1|[13](https://github.com/vporton/zondirectory/blob/design/eth/contracts/Files.sol#L13)|

These methods should have `internal` modifier instead of `public` since unwanted actor could trick system to unexpected state.

@vporton: Unwanted actor could use only `external` methods. So what is the harm of `public` ones?

**For example:** In [BaseFiles.sol#L361-L381](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L361-L381):

```solidity
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
```

`_voteChildParent()` was accessible without **any** restriction, that mean anyone could vote with **zero cost**.

@vporton: That's correct: `_voteChildParent()` is called from `voteChildParent()` and the "amount" of the vote is `msg.value`. So voting without any cost would produce a zero-value vote, what is not a security volnurability.

<a name="H03"/>

## H03 - Possible Ethereum trapped and lost

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| Files.sol       | High      |   4   |[29](https://github.com/vporton/zondirectory/blob/design/eth/contracts/Files.sol#L29), [39](https://github.com/vporton/zondirectory/blob/design/eth/contracts/Files.sol#L39), [49](https://github.com/vporton/zondirectory/blob/design/eth/contracts/Files.sol#L49), [58](https://github.com/vporton/zondirectory/blob/design/eth/contracts/Files.sol#L58)|

These methods have nothing to do with `msg.value` but it still `payable` that could lead to fund trapped and lost.

Suggest fix: Remove `payable` modifier.

@vporton: Instead of removing payable I add the check that the summary vote value is less than or equal to `msg.value`. _That_ was an error.

@vporton: Additional error: `voteMultiple()` in `Files.sol` should be payable.

<a name="H04"/>

## H04 - Possible logic issue of voting

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| Files.sol       | High      |   1   |[9-24](https://github.com/vporton/zondirectory/blob/design/eth/contracts/Files.sol#L9-L24)|

In [Files.sol#L9-L24](https://github.com/vporton/zondirectory/blob/design/eth/contracts/Files.sol#L9-L24), we're allow use to input `_voteAmounts` that doesn't look correct, weighted voting mechanism need to tie on stake, fund, share, etc.

```solidity
    function voteMultiple(uint _child, uint[] calldata _parents, uint256[] calldata _voteAmounts) external {
        _voteMultiple(_child, _parents, _voteAmounts);
    }

    function _voteMultiple(uint _child, uint[] calldata _parents, uint256[] calldata _voteAmounts) public {
        require(_parents.length == _voteAmounts.length, "Lengths don't match.");
        for(uint i = 0; i < _parents.length; ++i) {
            uint _parent = _parents[i];
            uint256 _amount = _voteAmounts[i];
            if(itemOwners[_parent] == msg.sender) {
                _setMyChildParent(_child, _parent, int256(_amount), 0);
            } else {
                _voteChildParent(_child, _parent, true, address(1), _amount);
            }
        }
    }
```

Suggest fix:

```solidity
function _voteMultiple(uint _child, uint[] calldata _parents, uint256[] calldata _voteAmounts) internal {
```

Please check `uint256[] calldata _voteAmounts` your own.

@vporton: Responded above, added a `require` check.

<a name="H05"/>

## H05 - Possible integer underflow/overflow

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| Files.sol       | High      |   1   |[9-24](https://github.com/vporton/zondirectory/blob/design/eth/contracts/Files.sol#L9-L24)|

@vporton: It seems you have a typo about line numbers in the table above.

In [BaseFiles.sol#L369](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L369), this issue related to [H02](#H02).

```solidity
    function _voteChildParent(uint _child, uint _parent, bool _yes, address payable _affiliate, uint256 _amount) public {
        require(entries[_child] != EntryKind.NONE, "Child does not exist.");
        require(entries[_parent] == EntryKind.CATEGORY, "Must be a category.");
        setAffiliate(_affiliate);
        int256 _value = _yes ? int256(_amount) : -int256(_amount);
```

This line will be overflow: `int256 _value = _yes ? int256(_amount) : -int256(_amount);`

Suggest fix: all math formula should be handle by `SafeMath` or `ABDKMath64x64`

<a name="M01"/>

## M01 - Possible wrong result in smart contract existence check

| Affected      | Severity  | Count | Lines |
|:-------------:|:----------|------:|-------|
| Address.sol   | Medium    |   1   | [26-27](https://github.com/vporton/zondirectory/blob/design/eth/contracts/Address.sol#L26-L27)

During initialization code execution, `EXTCODESIZE` on the address should return zero, which is the length of the code of the account while `CODESIZE` should return the length of the initialization code (as defined in H.2) - [Ethereum Yellow Page](https://ethereum.github.io/yellowpaper/paper.pdf)

```solidity
        assembly { size := extcodesize(account) }
        return size > 0;
```

It's better to check with [EIP-1052](https://eips.ethereum.org/EIPS/eip-1052)

```solidity
    function isContract(address account) internal view returns (bool) {
        // According to EIP-1052, 0x0 is the value returned for not-yet created accounts
        // and 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 is returned
        // for accounts without code, i.e. `keccak256('')`
        bytes32 codehash;
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        // solhint-disable-next-line no-inline-assembly
        assembly { codehash := extcodehash(account) }
        return (codehash != accountHash && codehash != 0x0);
    }
```

<a name="M02"/>

## M02 - Prefer to use self-define modifier

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| BaseFiles.sol   | Medium    |   46  | [96](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L96), [97](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L97), [103](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L103), [110](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L110), [116](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L116), [122](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L122), [128](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L128), [134](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L134), [140](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L140), [146](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L146), [147](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L147), [153](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L153), [170](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L170), [202](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L202), [215](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L215), [216](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L216), [217](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L217), [239](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L239), [240](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L240), [257](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L257), [258](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L258), [259](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L259), [260](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L260), [265](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L265), [267](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L267), [273](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L273), [274](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L274), [279](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L279), [280](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L280), [285](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L285), [286](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L286), [297](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L297), [314](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L314), [354](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L354), [355](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L355), [366](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L366), [367](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L367), [384](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L384), [385](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L385), [387](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L387), [401](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L401), [402](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L402), [403](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L403), [404](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L404), [551](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L551), [552](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L552) |
|BlogTemplates.sol|Medium|6|[48](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L48), [54](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L54), [60](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L60), [70](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L70), [71](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L71), [82](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L82), [83](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L83), [88](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L88)|

Modifier would be better in many cases to discover which part of code are exposed or able to be trigger from unwanted actor.

```solidity
    function setMainOwner(address payable _founder) external {
        require(msg.sender == founder, "Access denied.");
        require(_founder != address(0), "Zero address."); // also prevents makeing owned categories unowned (spam)
        founder = _founder;
        emit SetOwner(_founder);
    }
```

Suggest fix:

```solidity
    modifier onlyFounder(){
        require(msg.sender == founder, "Access denied");
        _;
    }

    modifier nonZeroAddress(address inputAddress){
        require(inputAddress != address(0), "Zero address.");
        _;
    }

    function setMainOwner(address payable _founder) external onlyFounder nonZeroAddress(_founder) {
        founder = _founder;
        emit SetOwner(_founder);
    }
```

<a name="M03"/>

## M03 - Should use better ERC20 implementation

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| BaseToken.sol   | Medium    |   2   |[15-17](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseToken.sol#L15-L17),[23-29](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseToken.sol#L23-L29)|

Suggest fix: [OpenZeppelin ERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol)

@vporton: Done, however I've modified their ERC20 implementation for reason related with `initialize()` (see below).

<a name="M04"/>

## M04 - Should use SafeMath

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| BaseFiles.sol   | Medium    |   6   |[416](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L416), [438](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L438), [449](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L449), [479](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L479), [483](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L483), [698](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L698)|

We should use `SafeMath` to make sure there are no overflow/underflow or side effect.

@vporton: No, overflow is impossible (unless you have like `1<<255` Ether).

**Note**: Please aware that, round down could be cause of token lost. A tiny amount of token wil be "burnt" after `floor()`.

<a name="L01"/>

## L01 - User constructor instead of initialize

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| BaseFiles.sol   | Low       |   1   |[78-91](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L78-L91)|
| BlogTemplates.sol   | Low       |   1   |[L32-L36](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BlogTemplates.sol#L32-L36)|
| MainPST.sol   | Low       |   1   |[15-24](https://github.com/vporton/zondirectory/blob/design/eth/contracts/MainPST.sol#L15-L24)|

We should use `constructor()` instead of implement it our own.

Example, [BaseFiles.sol#L78-L91](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L78-L91)

```solidity
    function initialize(address payable _founder, MainPST _pst) external {
        require(!initialized);
        initialized = true;

        founder = _founder;
        pst = _pst;

        salesOwnersShare = int128(1).divi(int128(10)); // 10%
        upvotesOwnersShare = int128(1).divi(int128(2)); // 50%
        uploadOwnersShare = int128(15).divi(int128(100)); // 15%
        buyerAffiliateShare = int128(1).divi(int128(10)); // 10%
        sellerAffiliateShare = int128(15).divi(int128(100)); // 15%
        arToETHCoefficient = int128(8).divi(int128(10)); // 80%
    }
```

Suggest fix:

```solidity
    constructor(address payable _founder, MainPST _pst) {
        founder = _founder;
        pst = _pst;

        salesOwnersShare = int128(1).divi(int128(10)); // 10%
        upvotesOwnersShare = int128(1).divi(int128(2)); // 50%
        uploadOwnersShare = int128(15).divi(int128(100)); // 15%
        buyerAffiliateShare = int128(1).divi(int128(10)); // 10%
        sellerAffiliateShare = int128(15).divi(int128(100)); // 15%
        arToETHCoefficient = int128(8).divi(int128(10)); // 80%
    }
```

<a name="L02"/>

## L02 - Out date library

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| ABDKMath64x64.sol   | Low       |   1   |[ABDKMath64x64.sol](https://github.com/vporton/zondirectory/blob/design/eth/contracts/ABDKMath64x64.sol)|
| SafeMath.sol   | Low       |   1   |[SafeMath.sol](https://github.com/vporton/zondirectory/blob/design/eth/contracts/SafeMath.sol)|

Need to keep these two up to date, please check:
- [ABDKMath64x64.sol](https://github.com/abdk-consulting/abdk-libraries-solidity/blob/master/ABDKMath64x64.sol): Latest version with Solidity 0.7.x support and gas optimization.
- [SafeMath.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/commits/master/contracts/math/SafeMath.sol): Latest version of `SafeMath`

<a name="L03"/>

## L03 - Better to revert

| Affected        | Severity  | Count | Lines |
|:----------------|:----------|------:|-------|
| BaseFiles.sol   | Low       |   3   |[370](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L370), [388](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L388), [693](https://github.com/vporton/zondirectory/blob/design/eth/contracts/BaseFiles.sol#L693)|

It's better to revert, It prevents state change or unnecessary transaction. Some wallet able to warning people that transaction won't work.

```solidity
        if(_value == 0) return; // We don't want to pollute the events with zero votes.
```

Suggest fix:
```
        if(_value == 0) revert("We don't want to pollute the events with zero votes");
```

# Extra note

- Lack of testing and code coverage
- We probably should split a big smart contract to smaller files and keep each file simple as much as possible
- Gas cost to deploy is around 10 mils and around 6 mils for `Files.sol`. Your deployment could be failed and all gas will be consumed.