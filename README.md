# Blockchain Application – Money Store DApp

Live site: https://money-store-dapp.onrender.com
Contract (Sepolia): `0x66bff01fe3fe1d09a71a15c5f6218f536b471cd2`

## Flow
1. **Welcome** – enter your name → Enter
2. **Main** – Transfer Money / Store Money / Exit
3. **Transfer Money** – payer address, payee address, amount → `Transfer` writes `transfer(payer, payee, amount)` on chain; `transaction` shows the latest record
4. **Store Money** – depositor address, amount → `Transfer` writes `store(depositor, amount)`; `transaction` shows the latest record
5. **Exit** – back to the welcome page

## Tech
- Smart contract: Solidity (`MoneyStore.sol`), deployed with Remix on Sepolia
- Front end: HTML + JavaScript (ethers.js) + MetaMask
- Hosting: Render static site

## Use
Chrome + MetaMask, Sepolia test ETH for gas. The site switches MetaMask to Sepolia automatically.
