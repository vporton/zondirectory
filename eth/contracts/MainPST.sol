// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import './MyERC20.sol';

contract MainPST is MyERC20 {
    function initialize(address payable _founder, uint256 _initialBalance) external {
        super.initialize("Zon Directory PST Token (ETH)", "ZDPSTE");
        _mint(_founder, _initialBalance);
    }
}
