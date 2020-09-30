// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import './BaseToken.sol';

contract MainPST is BaseToken {
    string public name;
    uint8 public decimals;
    string public symbol;

    bool initialized;

    function initialize(address payable _founder, uint256 _initialBalance) external {
        require(!initialized);
        initialized = true;

        name = "Zon Directory PST Token (ETH)";
        decimals = 18;
        symbol = "ZDPSTE";
        balances[_founder] = _initialBalance;
        totalSupply = _initialBalance;
    }
}
