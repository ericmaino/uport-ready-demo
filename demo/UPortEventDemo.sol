pragma solidity ^0.4.15;

contract EventDemo {
    address public Owner;
    uint public Registered;
    mapping(address => bool) public Participants;
    bool private IsClosed;

    function EventDemo() public {
        Owner = msg.sender;
    }

    function Register() public {
        if (IsClosed) {
            revert();
        }

        if (!Participants[msg.sender]) {
            Participants[msg.sender] = true;
            Registered ++;
        }
    }

    function CloseEvent() public {
        if (IsClosed || msg.sender != Owner) {
            revert();
        }

        IsClosed = true;
    }

    function IsConfirmed(address x) public constant returns(bool) {
        return Participants[x];
    }
}
