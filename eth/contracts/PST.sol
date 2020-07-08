// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;
//pragma experimental ABIEncoderV2;

import './BaseToken.sol';

contract PST is BaseToken {

    string public name;
    uint8 public decimals;
    string public symbol;

    mapping (uint => address) public holdersIndexes;
    uint public numberOfHolders = 1;

    constructor(address payable _founder, uint256 _initialBalance) public {
        name = "Cryptozon PST Token (ETH)";
        decimals = 18;
        symbol = "CZPST";
        totalSupply = _initialBalance;
        holdersIndexes[0] = _founder;
    }

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
}
