// MoneyStore contract on Sepolia
const CONTRACT_ADDR = "0x66bff01fe3fe1d09a71a15c5f6218f536b471cd2";
const SEPOLIA = "0xaa36a7";
const ABI = [
  "function transfer(address _payer, address _payee, uint256 _amount)",
  "function store(address _depositor, uint256 _amount)",
  "function transaction() view returns (string kind, address from, address to, uint256 amount, uint256 time)",
  "function count() view returns (uint256)"
];

let eth, provider, signer, contract, account;
const $ = (id) => document.getElementById(id);

// ---------- Views ----------
function show(id) {
  ["welcomeView", "mainView", "transferView", "storeView"].forEach((v) =>
    $(v).classList.toggle("hidden", v !== id)
  );
  setStatus("");
}

function setStatus(msg, isError = false) {
  $("status").textContent = msg;
  $("status").className = isError ? "error" : "";
}

function errMsg(e) {
  if (e?.code === 4001 || e?.code === "ACTION_REJECTED") return "Request rejected in MetaMask.";
  if (e?.code === -32002) return "A MetaMask request is already pending. Open MetaMask to approve it.";
  return e?.reason || e?.shortMessage || e?.info?.error?.message || e?.message || String(e);
}

// ---------- Wallet (prefers MetaMask when several wallets are installed) ----------
const wallets = [];
window.addEventListener("eip6963:announceProvider", (ev) => wallets.push(ev.detail));
window.dispatchEvent(new Event("eip6963:requestProvider"));

function findWallet() {
  const mm = wallets.find((w) => w.info?.rdns === "io.metamask");
  if (mm) return mm.provider;
  if (wallets.length) return wallets[0].provider;
  return window.ethereum || null;
}

async function connect() {
  if (contract) return;
  if (typeof ethers === "undefined") throw new Error("Failed to load ethers.js, please refresh.");
  eth = findWallet();
  if (!eth) throw new Error("MetaMask not found. Please install the MetaMask extension.");

  setStatus("Connecting to MetaMask...");
  await eth.request({ method: "eth_requestAccounts" });

  if ((await eth.request({ method: "eth_chainId" })) !== SEPOLIA) {
    setStatus("Please approve switching MetaMask to Sepolia...");
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA }] });
    } catch (e) {
      if (e?.code !== 4902) throw e;
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: SEPOLIA,
          chainName: "Sepolia",
          nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://rpc.sepolia.org"],
          blockExplorerUrls: ["https://sepolia.etherscan.io"]
        }]
      });
    }
  }

  provider = new ethers.BrowserProvider(eth);
  signer = await provider.getSigner();
  account = await signer.getAddress();
  contract = new ethers.Contract(CONTRACT_ADDR, ABI, signer);
  eth.on?.("accountsChanged", () => location.reload());
  eth.on?.("chainChanged", () => location.reload());
  setStatus("");
}

async function run(btn, fn) {
  btn.disabled = true;
  try { await fn(); }
  catch (e) { setStatus(errMsg(e), true); }
  finally { btn.disabled = false; }
}

function checkAddr(a, label) {
  if (!ethers.isAddress(a)) throw new Error(`Please enter a valid ${label} address.`);
}
function checkAmount(v) {
  if (!/^\d+$/.test(v) || BigInt(v) === 0n) throw new Error("Please enter a positive whole number amount.");
}

async function sendTx(label, txPromise) {
  setStatus(`${label}: please confirm in MetaMask...`);
  const tx = await txPromise;
  setStatus(`${label}: waiting for confirmation...\nTx: ${tx.hash}`);
  await tx.wait();
  setStatus(`${label} successful ✅\nTx: ${tx.hash}`);
}

// ---------- Welcome ----------
$("nameForm").onsubmit = (e) => {
  e.preventDefault();
  const name = $("name").value.trim();
  if (!name) return setStatus("Please enter your name.", true);
  try { sessionStorage.setItem("name", name); } catch (_) {}
  $("hello").textContent = `Hello, ${name}`;
  show("mainView");
};

// ---------- Navigation ----------
document.querySelectorAll("[data-go]").forEach((b) => {
  b.onclick = () => {
    show(b.dataset.go);
    // Prefill payer / depositor with the connected account
    if (b.dataset.go === "transferView" || b.dataset.go === "storeView") {
      run(b, async () => {
        await connect();
        if (!$("payer").value) $("payer").value = account;
        if (!$("depositor").value) $("depositor").value = account;
      });
    }
  };
});

$("exitBtn").onclick = () => {
  try { sessionStorage.removeItem("name"); } catch (_) {}
  $("name").value = "";
  show("welcomeView");
};

// ---------- Transfer Money ----------
$("transferBtn").onclick = () => run($("transferBtn"), async () => {
  const payer = $("payer").value.trim();
  const payee = $("payee").value.trim();
  const amt = $("tAmount").value.trim();
  checkAddr(payer, "payer");
  checkAddr(payee, "payee");
  checkAmount(amt);
  await connect();
  await sendTx("Transfer", contract.transfer(payer, payee, amt));
});

// ---------- Store Money ----------
$("storeBtn").onclick = () => run($("storeBtn"), async () => {
  const dep = $("depositor").value.trim();
  const amt = $("sAmount").value.trim();
  checkAddr(dep, "depositor");
  checkAmount(amt);
  await connect();
  await sendTx("Store", contract.store(dep, amt));
});

// ---------- transaction: show the latest record ----------
document.querySelectorAll("[data-tx]").forEach((b) => {
  b.onclick = () => run(b, async () => {
    await connect();
    setStatus("Loading latest transaction...");
    if ((await contract.count()) === 0n) return setStatus("No transaction yet.");
    const r = await contract.transaction();
    const when = new Date(Number(r.time) * 1000).toLocaleString();
    setStatus(
      r.kind === "transfer"
        ? `Latest transaction (Transfer Money)\nPayer: ${r.from}\nPayee: ${r.to}\nAmount: ${r.amount}\nTime: ${when}`
        : `Latest transaction (Store Money)\nDepositor: ${r.from}\nAmount: ${r.amount}\nTime: ${when}`
    );
  });
});

// Restore name after refresh
try {
  const saved = sessionStorage.getItem("name");
  if (saved) { $("hello").textContent = `Hello, ${saved}`; show("mainView"); }
} catch (_) {}
