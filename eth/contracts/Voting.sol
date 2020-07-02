pragma solidity ^0.5.0;

import "./BaseToken.sol";

contract Voting is BaseToken {

    string public name;
    uint8 public decimals;
    string public symbol;
    string public version = 'U1';

    event IssueCreated(uint256 issue);
    
    uint256 public maxIssue = 0;
    
    // issue => votes
    mapping (uint256 => int256) votes;
    
    // voter => (issue => value)
    mapping (address => mapping (uint256 => int256)) voters;
    
    constructor() public {
        name = "Voting";
        decimals = 8;
        symbol = "VOT";
    }

    function() payable external {
        totalSupply = msg.value;
        balances[msg.sender] += msg.value; // 1/1 exchange rate
        emit Transfer(address(this), msg.sender, msg.value);
    }

    function createIssue() external returns (uint256) {
      return ++maxIssue;
    }
    
    function vote(uint256 _issue, bool _yes) external {
        int256 _value = _yes ? int256(balances[msg.sender]) : -int256(balances[msg.sender]);
        votes[_issue] += -voters[msg.sender][_issue] + _value; // reclaim the previous vote
        voters[msg.sender][_issue] = _value;
        emit IssueCreated(_issue);
    }
}
