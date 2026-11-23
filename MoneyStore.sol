// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MoneyStore - store ETH, transfer it to others, exit with everything
contract MoneyStore {
    mapping(address => uint256) private balances;
    bool private locked;

    event Deposited(address indexed user, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    /// Store money: send ETH with the call
    function deposit() external payable {
        _deposit();
    }

    /// Plain ETH sent to the contract is also stored
    receive() external payable {
        _deposit();
    }

    /// Transfer Money: move stored balance to another address inside the contract
    function transfer(address to, uint256 amount) external {
        require(to != address(0), "Invalid address");
        require(to != msg.sender, "Cannot transfer to yourself");
        require(amount > 0, "Amount must be > 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transferred(msg.sender, to, amount);
    }

    /// Withdraw part of your balance back to your wallet
    function withdraw(uint256 amount) external nonReentrant {
        _withdraw(amount);
    }

    /// Exit: withdraw your whole balance back to your wallet
    function exit() external nonReentrant {
        _withdraw(balances[msg.sender]);
    }

    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }

    function myBalance() external view returns (uint256) {
        return balances[msg.sender];
    }

    function _deposit() private {
        require(msg.value > 0, "Must send ETH");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // Checks-Effects-Interactions: update balance BEFORE sending ETH
    function _withdraw(uint256 amount) private {
        require(amount > 0, "Nothing to withdraw");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "ETH transfer failed");
        emit Withdrawn(msg.sender, amount);
    }
}
