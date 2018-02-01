pragma solidity ^0.4.15;

contract AttestedEvent {
    address public Owner;
    uint public Registered;
    uint public Confirmed;
    mapping(address => bool) public OwnerRegistered;
    mapping(address => bool) public Participants;
    bool private IsClosed;

    function AttestedEvent(address owner) public {
        Owner = owner;
    }

    function Register() public {
        if (IsClosed) {
            revert();
        }

        if (!Participants[msg.sender]) {
            Participants[msg.sender] = true;
            Registered ++;
            Confirm(msg.sender);
        }
    }

    function RegisterParticipant(address x) public {
        if (IsClosed || Owner != msg.sender) {
            revert();
        }

        if (!OwnerRegistered[x]) {
            OwnerRegistered[x] = true;
            Confirm(x);
        }
    }

    function Confirm(address x) private {
        if (OwnerRegistered[x] && Participants[x]) {
            Confirmed ++;
        }
    }

    function IsConfirmed(address x) public constant returns(bool) {
        return OwnerRegistered[x] && Participants[x];
    }
}
