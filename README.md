1. Download UPort
2. Setup an Ethereum RPC endpoint with eth,net,debug
    - Get the http endpoint for the RPC address
    - http://40.84.155.75:8545
3. Setup NGrok or Expose a port on the VM
    - ngrok http 8081
4. Build TypeScript and base docker image
    ./build.sh
5. Deploy registration contract
    - sudo RPC_URL=http://40.84.155.75:8545 docker-compose -f docker-compose.setup.yaml up
    - Wait for it to complete
    - Copy the contract address
6. Run watcher and UPort Web endpoint
    - sudo RPC_URL=http://40.84.155.75:8545 NGROK_HTTPS=https://33e7885c.ngrok.io CONTRACT_ADDRESS=0xf7031e10ae12d4a934f62f3ef235abcc5886c2f5 docker-compose up
7. Navigate to ngrok endpoint: https://33e7885c.ngrok.io 
8. Scan QR Code with UPort App
9. Approve Login
10. Register when notified
11. Wait for transaction to complete
12. Navigate to ngrok endpoint: https://33e7885c.ngrok.io/completed
13. Approve attestation when it comes back
