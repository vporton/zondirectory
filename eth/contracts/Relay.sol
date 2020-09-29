// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.7.0;

import './Proxy.sol';
import './Address.sol';

contract Relay is Proxy {

    using Address for address;

    // bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
    bytes32 constant private IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    // 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103
    bytes32 constant private OWNER_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    // Missing in Proxy.sol
    receive() external payable {
        _fallback();
    }

    modifier onlyOwner() {
        require(msg.sender == _getOwner());
        _;
    }

    constructor(address _contract, address _owner) {
        _setImplementation(_contract);
        _setOwner(_owner); // this owner may be another contract with multisig, not a single contract owner
    }

    function changeContract(address _contract) external
        onlyOwner()
    {
        _setImplementation(_contract);
    }

    function changeRelayer(address _owner) external
        onlyOwner()
    {
        _setOwner(_owner);
    }

    function _implementation() internal override view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            impl := sload(slot)
        }
    }

    function _setImplementation(address _contract) private {
        require(Address.isContract(_contract), "UpgradeableProxy: new implementation is not a contract");

        bytes32 slot = IMPLEMENTATION_SLOT;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            sstore(slot, _contract)
        }
    }

    function _getOwner() internal view returns (address impl) {
        bytes32 slot = OWNER_SLOT;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            impl := sload(slot)
        }
    }

    function _setOwner(address _owner) private {
        bytes32 slot = OWNER_SLOT;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            sstore(slot, _owner)
        }
    }
}