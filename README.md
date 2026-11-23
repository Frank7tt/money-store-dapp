# Money Store DApp

Files: `MoneyStore.sol` (contract), `index.html` + `style.css` + `app.js` (front end).

Contract deployed on Sepolia: `0xAcEb57f4b812fB9938185B182a50C3C2f1BBbe8f`

## Use it
Open the site with MetaMask installed, switch MetaMask to **Sepolia**, click **Connect MetaMask**.

## Deploy the contract yourself (Remix)
1. Open https://remix.ethereum.org and create `MoneyStore.sol`, paste the code.
2. Compiler tab → version 0.8.20+ → Compile.
3. Deploy tab → Environment: Browser Extension / MetaMask (Sepolia).
4. Deploy, then paste the contract address into the front end.

## Run locally
```
python3 -m http.server 8000
```
Open http://localhost:8000.

## Functions
| Button | Contract call | What it does |
|---|---|---|
| Store Money | `deposit()` payable | Store ETH in the contract |
| Transfer Money | `transfer(to, amount)` | Move stored balance to another address |
| Exit | `exit()` | Withdraw your whole balance to your wallet, then disconnect |

## Security points
- Checks-Effects-Interactions: balance is reduced before ETH is sent.
- `nonReentrant` lock on `withdraw` / `exit`.
- Solidity 0.8 built-in overflow checks; zero-address / self-transfer / zero-amount checks.
