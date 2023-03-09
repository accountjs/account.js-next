// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.15;

contract CheckBalance {
    event CheckedBalance(address account, uint balanceRequired);

    function checkEthers(uint balanceRequired) public {
        address sender = address(msg.sender);
        emit CheckedBalance(sender, balanceRequired);
        require(sender.balance >= balanceRequired, 'Balance is not enough!');
    }
}
