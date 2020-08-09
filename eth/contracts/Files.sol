// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './BaseFiles.sol';

contract Files is BaseFiles {
    constructor(address payable _founder, uint256 _initialBalance)
        BaseFiles(_founder, _initialBalance)
        public
    {
    }
}
