// Minimal ABI for MoneyStore.sol
const ABI = [
  "function deposit() payable",
  "function transfer(address to, uint256 amount)",
  "function withdraw(uint256 amount)",
  "function exit()",
  "function balanceOf(address user) view returns (uint256)",
  "event Deposited(address indexed user, uint256 amount)",
  "event Transferred(address indexed from, address indexed to, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)"
];

let provider, signer, contract, account;

const $ = (id) => document.getElementById(id);

function show(viewId) {
  ["connectView", "mainView", "transferView"].forEach((v) =>
    $(v).classList.toggle("hidden", v !== viewId)
  );
}

function setStatus(msg, isError = false) {
  $("status").textContent = msg;
  $("status").className = isError ? "error" : "";
}

function errMsg(e) {
  return e?.reason || e?.shortMessage || e?.info?.error?.message || e?.message || String(e);
}

async function refreshBalance() {
  const bal = await contract.balanceOf(account);
  $("balance").textContent = ethers.formatEther(bal);
}

// Run a transaction with button disabled + status messages
async function runTx(button, label, sendTx) {
  button.disabled = true;
  try {
    setStatus(`${label}: confirm in MetaMask...`);
    const tx = await sendTx();
    setStatus(`${label}: waiting for confirmation (${tx.hash.slice(0, 10)}...)`);
    await tx.wait();
    setStatus(`${label} successful ✅`);
    await refreshBalance();
    return true;
  } catch (e) {
    setStatus(`${label} failed: ${errMsg(e)}`, true);
    return false;
  } finally {
    button.disabled = false;
  }
}

// ---------- Connect ----------
$("connectBtn").onclick = async () => {
  try {
    if (!window.ethereum) throw new Error("MetaMask not found. Please install it.");
    const addr = $("contractAddr").value.trim();
    if (!ethers.isAddress(addr)) throw new Error("Invalid contract address");

    await window.ethereum.request({ method: "eth_requestAccounts" });

    // Contract lives on Sepolia: switch MetaMask there if needed
    const SEPOLIA = "0xaa36a7";
    if ((await window.ethereum.request({ method: "eth_chainId" })) !== SEPOLIA) {
      setStatus("Please approve switching MetaMask to Sepolia...");
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA }]
      });
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();

    const code = await provider.getCode(addr);
    if (code === "0x") throw new Error("No contract at this address on the current network");

    contract = new ethers.Contract(addr, ABI, signer);
    localStorage.setItem("moneyStoreAddr", addr);

    $("account").textContent = account;
    await refreshBalance();
    show("mainView");
    setStatus("Connected");
  } catch (e) {
    setStatus(errMsg(e), true);
  }
};

// ---------- Store money ----------
$("depositBtn").onclick = async () => {
  const amt = $("depositAmt").value;
  if (!amt || Number(amt) <= 0) return setStatus("Enter an amount to store", true);
  const ok = await runTx($("depositBtn"), "Store money", () =>
    contract.deposit({ value: ethers.parseEther(amt) })
  );
  if (ok) $("depositAmt").value = "";
};

// ---------- Transfer Money ----------
$("goTransferBtn").onclick = () => {
  setStatus("");
  show("transferView");
};
$("backBtn").onclick = () => show("mainView");

$("transferBtn").onclick = async () => {
  const to = $("toAddr").value.trim();
  const amt = $("transferAmt").value;
  if (!ethers.isAddress(to)) return setStatus("Invalid recipient address", true);
  if (to.toLowerCase() === account.toLowerCase()) return setStatus("Cannot transfer to yourself", true);
  if (!amt || Number(amt) <= 0) return setStatus("Enter an amount", true);

  const ok = await runTx($("transferBtn"), "Transfer", () =>
    contract.transfer(to, ethers.parseEther(amt))
  );
  if (ok) {
    $("toAddr").value = "";
    $("transferAmt").value = "";
    show("mainView");
  }
};

// ---------- Exit: withdraw everything, then disconnect ----------
$("exitBtn").onclick = async () => {
  const bal = await contract.balanceOf(account);
  if (bal > 0n) {
    if (!confirm(`Withdraw all ${ethers.formatEther(bal)} ETH to your wallet and exit?`)) return;
    const ok = await runTx($("exitBtn"), "Exit (withdraw all)", () => contract.exit());
    if (!ok) return;
  }
  contract = signer = provider = account = null;
  show("connectView");
  setStatus("You have exited. Goodbye 👋");
};

// Reset if user switches account/network in MetaMask
if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", () => location.reload());
  window.ethereum.on?.("chainChanged", () => { if (contract) location.reload(); });
}

// Prefill contract address (deployed on Sepolia) or last used one
const DEFAULT_ADDR = "0xAcEb57f4b812fB9938185B182a50C3C2f1BBbe8f";
try {
  $("contractAddr").value = localStorage.getItem("moneyStoreAddr") || DEFAULT_ADDR;
} catch (_) {
  $("contractAddr").value = DEFAULT_ADDR;
}
