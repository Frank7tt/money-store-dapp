// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MoneyStore - records "transfer money" and "store money" transactions on chain
contract MoneyStore {
    struct Record {
        string kind;      // "transfer" or "store"
        address from;     // payer / depositor
        address to;       // payee (address(0) for store)
        uint256 amount;
        uint256 time;
    }

    Record[] private records;

    event MoneyTransferred(address indexed payer, address indexed payee, uint256 amount);
    event MoneyStored(address indexed depositor, uint256 amount);

    /// Transfer Money: record a payment from payer to payee
    function transfer(address _payer, address _payee, uint256 _amount) external {
        require(_payer != address(0) && _payee != address(0), "Invalid address");
        require(_amount > 0, "Amount must be > 0");
        records.push(Record("transfer", _payer, _payee, _amount, block.timestamp));
        emit MoneyTransferred(_payer, _payee, _amount);
    }

    /// Store Money: record a deposit by depositor
    function store(address _depositor, uint256 _amount) external {
        require(_depositor != address(0), "Invalid address");
        require(_amount > 0, "Amount must be > 0");
        records.push(Record("store", _depositor, address(0), _amount, block.timestamp));
        emit MoneyStored(_depositor, _amount);
    }

    /// Latest transaction
    function transaction()
        external
        view
        returns (string memory kind, address from, address to, uint256 amount, uint256 time)
    {
        require(records.length > 0, "No transaction yet");
        Record storage r = records[records.length - 1];
        return (r.kind, r.from, r.to, r.amount, r.time);
    }

    function count() external view returns (uint256) {
        return records.length;
    }

    function getRecord(uint256 i)
        external
        view
        returns (string memory kind, address from, address to, uint256 amount, uint256 time)
    {
        require(i < records.length, "Index out of range");
        Record storage r = records[i];
        return (r.kind, r.from, r.to, r.amount, r.time);
    }
}
