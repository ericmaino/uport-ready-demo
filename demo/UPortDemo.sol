pragma solidity ^0.4.15;

contract EventRegistration {
    string public EventName;
    address public Owner;
    uint public Count;
    mapping(address => bool) public Participants;
    bool private IsClosed;

    function EventRegistration(address owner) public {
        Owner = owner;
    }

    function SetName(string name) public  {
        if (!IsClosed) {
            EventName = name;
        }
    }

    function Register() public {
        if (IsClosed) {
            revert();
        }

        Participants[msg.sender] = true;
        Count ++;
    }

    function CloseEvent() public {
        if (!IsClosed) {
            if (msg.sender == Owner) {
                IsClosed = true;
            }
        }
    }
}

contract RegistrationFactory {
    address public Owner;
    uint public Count;
    mapping(uint => address) public Events;

    function RegistrationFactory() public {
        Owner = msg.sender;
    }

    function CreateEvent() public {
        var count = Count++;
        address newEvent = new EventRegistration(msg.sender);
        Events[count] = newEvent;
    }
}
