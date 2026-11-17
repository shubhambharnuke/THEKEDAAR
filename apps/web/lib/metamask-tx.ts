import deployments from "./deployments.json";
import BookingManagerArtifact from "./BookingManager.json";
import ApprovalManagerArtifact from "./ApprovalManager.json";
import DocumentRegistryArtifact from "./DocumentRegistry.json";

export const BESU_CHAIN_ID_HEX = "0x539"; // 1337 in hex

export const CONTRACT_ADDRESSES = {
  BookingManager: deployments.contracts.BookingManager,
  ApprovalManager: deployments.contracts.ApprovalManager,
  DocumentRegistry: deployments.contracts.DocumentRegistry,
  CollegeAccessControl: deployments.contracts.CollegeAccessControl,
  ResourceRegistry: deployments.contracts.ResourceRegistry,
};

/**
 * Ensures user is connected to the Besu QBFT Consortium (Chain ID 1337)
 */
export async function ensureBesuNetwork(): Promise<boolean> {
  if (typeof window === "undefined" || !(window as any).ethereum) return false;
  const ethereum = (window as any).ethereum;

  try {
    const currentChain = await ethereum.request({ method: "eth_chainId" });
    if (currentChain === BESU_CHAIN_ID_HEX || parseInt(currentChain, 16) === 1337) {
      return true;
    }

    // Try to switch
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BESU_CHAIN_ID_HEX }],
      });
      return true;
    } catch (switchError: any) {
      // If chain not added, add it
      if (switchError.code === 4902) {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: BESU_CHAIN_ID_HEX,
              chainName: "Besu QBFT Consortium",
              nativeCurrency: { name: "College Ether", symbol: "cETH", decimals: 18 },
              rpcUrls: ["http://127.0.0.1:8545"],
            },
          ],
        });
        return true;
      }
      return false;
    }
  } catch (err) {
    console.error("Network switch error:", err);
    return false;
  }
}

/**
 * Triggers interactive MetaMask popup for booking request on BookingManager.sol
 */
export async function sendMetaMaskBookingTx(
  resourceId: number,
  startTimeEpoch: number,
  endTimeEpoch: number
): Promise<string | null> {
  if (typeof window === "undefined" || !(window as any).ethereum) return null;
  const ethereum = (window as any).ethereum;

  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts || accounts.length === 0) return null;
  const from = accounts[0];

  await ensureBesuNetwork();

  // encode function data for requestBooking(uint256,uint256,uint256,uint256,string)
  // function selector: keccak256("requestBooking(uint256,uint256,uint256,uint256,string)") -> 0x82520fcc
  const methodId = "0x82520fcc";
  const deadline = startTimeEpoch - 1800; // 30 mins before start

  // Encode ABI parameters
  const padUint = (num: number) => num.toString(16).padStart(64, "0");
  const p1 = padUint(resourceId);
  const p2 = padUint(startTimeEpoch);
  const p3 = padUint(endTimeEpoch);
  const p4 = padUint(deadline > 0 ? deadline : startTimeEpoch);
  // Offset to string parameter (5th argument = 5 * 32 = 160 = 0xa0)
  const p5Offset = padUint(160);
  const strData = Buffer.from("ipfs://event-metadata", "utf8").toString("hex");
  const strLen = padUint(Buffer.from("ipfs://event-metadata", "utf8").length);
  const strPadded = strData.padEnd(64, "0");

  const data = methodId + p1 + p2 + p3 + p4 + p5Offset + strLen + strPadded;

  try {
    const txHash = await ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from,
          to: CONTRACT_ADDRESSES.BookingManager,
          data,
          gas: "0x4C4B40", // 5,000,000 gas limit
        },
      ],
    });
    return txHash;
  } catch (err) {
    console.error("MetaMask sendBooking error:", err);
    throw err;
  }
}

/**
 * Triggers interactive MetaMask popup for approval on ApprovalManager.sol
 */
export async function sendMetaMaskApprovalTx(bookingId: number, comments: string): Promise<string | null> {
  if (typeof window === "undefined" || !(window as any).ethereum) return null;
  const ethereum = (window as any).ethereum;

  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts || accounts.length === 0) return null;
  const from = accounts[0];

  await ensureBesuNetwork();

  // function selector for recordApproval(uint256,string) -> keccak256("recordApproval(uint256,string)") -> 0x163f7522
  const methodId = "0x163f7522";
  const padUint = (num: number) => num.toString(16).padStart(64, "0");
  const p1 = padUint(bookingId);
  const p2Offset = padUint(64); // 2 * 32
  const commentBytes = Buffer.from(comments || "Approved on-chain", "utf8").toString("hex");
  const strLen = padUint(Buffer.from(comments || "Approved on-chain", "utf8").length);
  const strPadded = commentBytes.padEnd(Math.ceil(commentBytes.length / 64) * 64, "0");

  const data = methodId + p1 + p2Offset + strLen + strPadded;

  try {
    const txHash = await ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from,
          to: CONTRACT_ADDRESSES.ApprovalManager,
          data,
          gas: "0x4C4B40",
        },
      ],
    });
    return txHash;
  } catch (err) {
    console.error("MetaMask sendApproval error:", err);
    throw err;
  }
}
