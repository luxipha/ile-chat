/*
 * Aptos Wallet Service (React Native–ready)
 * -------------------------------------------------------------
 * ✅ Generates Aptos wallets (ed25519)
 * ✅ Funds via Faucet (TESTNET)
 * ✅ Reads balances for:
 *    - APT (native coin, Coin standard)
 *    - Fungible Assets (FA) like USDC test tokens (via Indexer GraphQL)
 * ✅ Normalizes addresses to 64-hex canonical form
 * ✅ Stores keys in AsyncStorage (swap to a secure store for prod)
 *
 * ⚠️ RN prerequisite:
 *    import "react-native-get-random-values"; // at app entry (before using this service)
 * -------------------------------------------------------------
 */

import {
  Account,
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -----------------------------
// Types
// -----------------------------
interface AptosWalletResponse {
  success: boolean;
  address?: string;
  privateKey?: string;
  error?: string;
}

interface AptosBalanceResponse {
  success: boolean;
  balances?: Record<string, string>; // { SYMBOL: amount }
  error?: string;
}

// -----------------------------
// Helpers
// -----------------------------
const normalizeAptos = (addr: string) =>
  "0x" + (addr || "").replace(/^0x/i, "").toLowerCase().padStart(64, "0");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Aptos Indexer GraphQL endpoint for TESTNET
const APTOS_TESTNET_GRAPHQL = "https://api.testnet.aptoslabs.com/v1/graphql";

// -----------------------------
// Service
// -----------------------------
class AptosService {
  private aptos: Aptos;
  private network: Network;

  constructor() {
    // Default to TESTNET (change here if needed)
    this.network = Network.TESTNET;
    const config = new AptosConfig({ network: this.network });
    this.aptos = new Aptos(config);
    console.log("🔗 Aptos service initialized for:", this.network);
  }

  // ---------------------------
  // Wallet lifecycle
  // ---------------------------
  async generateWallet(fundOctas = 200_000_000): Promise<AptosWalletResponse> {
    try {
      console.log("🔐 Generating new Aptos wallet...");
      const account = Account.generate();

      const address = account.accountAddress.toString();
      const privateKey = account.privateKey.toString();

      // Store (for hackathon; use Secure Store in prod)
      await AsyncStorage.setItem("aptosWalletAddress", address);
      await AsyncStorage.setItem("aptosWalletPrivateKey", privateKey);

      console.log("✅ Wallet generated:", { address });

      // Optional: pre-fund so it's usable right away
      if (fundOctas && fundOctas > 0) {
        await this.fundWithFaucet(address, fundOctas);
        // small delay so indexer/follow-up reads see it
        await sleep(800);
      }

      return { success: true, address, privateKey };
    } catch (e: any) {
      console.error("❌ generateWallet error:", e);
      return { success: false, error: e?.message || "Failed to generate wallet" };
    }
  }

  async getWallet(): Promise<AptosWalletResponse> {
    try {
      // First try to get from database (if crossmintService is available)
      try {
        // Check if we can import crossmintService dynamically
        const crossmintService = await import('../services/crossmintService');
        const backendWallet = await crossmintService.default.getWalletFromBackend('aptos-testnet', 'aptos');
        
        if (backendWallet && backendWallet.success && backendWallet.wallet) {
          console.log('✅ Aptos wallet retrieved from database');
          
          // Update AsyncStorage to match database
          await AsyncStorage.setItem("aptosWalletAddress", backendWallet.wallet.address);
          if (backendWallet.wallet.privateKey) {
            await AsyncStorage.setItem("aptosWalletPrivateKey", backendWallet.wallet.privateKey);
          }
          
          return { 
            success: true, 
            address: backendWallet.wallet.address, 
            privateKey: backendWallet.wallet.privateKey 
          };
        }
      } catch (dbError) {
        console.log('ℹ️ Database check failed, falling back to AsyncStorage:', dbError);
      }
      
      // Fallback to AsyncStorage
      const address = await AsyncStorage.getItem("aptosWalletAddress");
      const privateKey = await AsyncStorage.getItem("aptosWalletPrivateKey");
      if (!address || !privateKey) return { success: false, error: "No Aptos wallet found" };
      return { success: true, address, privateKey };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to get wallet" };
    }
  }

  async hasWallet(): Promise<boolean> {
    try {
      // First check database
      try {
        const crossmintService = await import('../services/crossmintService');
        const backendWallet = await crossmintService.default.getWalletFromBackend('aptos-testnet', 'aptos');
        
        if (backendWallet && backendWallet.success && backendWallet.wallet) {
          console.log('✅ Database has Aptos wallet');
          return true;
        }
      } catch (dbError) {
        console.log('ℹ️ Database check failed, checking AsyncStorage:', dbError);
      }
      
      // Fallback to AsyncStorage check
      const hasLocalWallet = !!(await AsyncStorage.getItem("aptosWalletAddress"));
      console.log('📱 AsyncStorage has Aptos wallet:', hasLocalWallet);
      return hasLocalWallet;
    } catch {
      return false;
    }
  }

  // ---------------------------
  // Funding
  // ---------------------------
  async fundWithFaucet(address: string, amountOctas = 100_000_000): Promise<{ success: boolean; message?: string; error?: string }> {
    const acct = normalizeAptos(address);
    try {
      console.log("🚰 Funding via TESTNET faucet:", acct, amountOctas, "octas");
      // Preferred path (v5): under Aptos.faucet
      // If a future SDK exposes aptos.fundAccount, keep a fallback below.
      // @ts-ignore
      if (this.aptos.faucet?.fundAccount) {
        // @ts-ignore
        await this.aptos.faucet.fundAccount({ accountAddress: acct, amount: amountOctas });
      } else if ((this.aptos as any).fundAccount) {
        // Fallback some versions exposed directly
        await (this.aptos as any).fundAccount({ accountAddress: acct, amount: amountOctas });
      } else {
        throw new Error("Faucet method not found on SDK instance");
      }
      console.log("✅ Faucet funded");
      return { success: true, message: `Funded ${amountOctas} octas` };
    } catch (e: any) {
      console.error("❌ Faucet error:", e?.response?.data || e?.message || e);
      return { success: false, error: e?.message || "Faucet funding failed" };
    }
  }

  // ---------------------------
  // Balances (APT + FA)
  // ---------------------------
  /**
   * Return a combined view of this account balances.
   * - APT via getAccountAPTAmount
   * - All FA via getAccountCoinAmount and Indexer GraphQL
   */
  async getAllBalances(address: string): Promise<AptosBalanceResponse> {
    const acct = normalizeAptos(address);
    try {
      const balances: Record<string, string> = {};

      // 1) APT (Native coin)
      try {
        const aptAmount = await this.aptos.getAccountAPTAmount({ accountAddress: acct });
        balances["APT"] = aptAmount.toString();
        console.log("✅ APT balance:", aptAmount);
      } catch (aptErr: any) {
        console.warn("[APT] balance read failed:", aptErr?.message);
        balances["APT"] = "0";
      }

      // 2) FA balances (Indexer's current_fungible_asset_balances)
      try {
        console.log("🔍 Fetching FA balances from GraphQL for:", acct);
        
        const res = await fetch(APTOS_TESTNET_GRAPHQL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query($addr:String!){
              current_fungible_asset_balances(where:{owner_address:{_eq:$addr}}){
                amount
                asset_type
                metadata{ symbol name decimals }
              }
            }`,
            variables: { addr: acct },
          }),
        });
        
        // Response successful
        
        if (!res.ok) {
          throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
        }
        
        const json = await res.json();
        console.log("📊 FA GraphQL response:", json);
        
        // Check for GraphQL errors
        if (json.errors) {
          console.error("📊 GraphQL errors:", json.errors);
          throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
        }
        
        const rows: Array<{ amount: string; asset_type?: string; metadata?: { symbol?: string; name?: string; decimals?: number } }>
          = json?.data?.current_fungible_asset_balances || [];
        
        console.log("📊 Found FA balances:", rows.length);
        
        for (const row of rows) {
          const sym = row?.metadata?.symbol || row?.metadata?.name || (row?.asset_type?.slice(0, 10) ?? "FA");
          const dec = Number(row?.metadata?.decimals ?? 0);
          const amt = Number(row?.amount || 0) / Math.pow(10, dec || 0);
          balances[sym] = ((Number(balances[sym] || "0")) + amt).toString();
          console.log(`💰 ${sym}: ${amt} (${row?.amount} raw, ${dec} decimals)`);
        }
      } catch (faErr: any) {
        console.error("❌ [FA] indexer read failed:", faErr?.message);
        console.error("❌ [FA] full error:", faErr);
      }

      return { success: true, balances };
    } catch (e: any) {
      console.error("❌ getAllBalances error:", e);
      return { success: false, error: e?.message || "Failed to fetch balances" };
    }
  }

  /**
   * Read a specific FA balance if you know the token's metadata address (e.g., USDC metadata object address).
   */
  async getFaBalanceByMetadata(address: string, metadataAddress: string): Promise<{ success: boolean; raw?: number; normalized?: string; decimals?: number; symbol?: string; error?: string }>{
    const acct = normalizeAptos(address);
    const meta = normalizeAptos(metadataAddress);
    try {
      console.log(`🔍 Getting FA balance for ${acct} with metadata ${meta}`);
      
      // Use getAccountCoinAmount with faMetadataAddress parameter
      const amount = await this.aptos.getAccountCoinAmount({
        accountAddress: acct,
        faMetadataAddress: meta,
      });
      
      console.log(`📊 Raw FA amount: ${amount}`);

      // Fetch metadata to get decimals/symbol for pretty display
      let decimals = 0;
      let symbol = "FA";
      try {
        const metaRes = await fetch(APTOS_TESTNET_GRAPHQL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query($m:String!){ fungible_asset_metadata(where:{asset_type:{_eq:$m}}){ symbol name decimals } }`,
            variables: { m: meta },
          }),
        });
        const j = await metaRes.json();
        const md = j?.data?.fungible_asset_metadata?.[0];
        decimals = Number(md?.decimals ?? 0);
        symbol = md?.symbol || md?.name || symbol;
        console.log(`🏷️ Token metadata: ${symbol}, ${decimals} decimals`);
      } catch (metaErr) {
        console.warn("⚠️ Failed to fetch metadata:", metaErr);
      }

      return { success: true, raw: amount, normalized: amount.toString(), decimals, symbol };
    } catch (e: any) {
      console.error("❌ getFaBalanceByMetadata error:", e);
      return { success: false, error: e?.message || "Failed to read FA balance" };
    }
  }

  /**
   * If your "USDC" is a legacy Coin (rare on Aptos now), pass its coin type here.
   * Example coinType: 0x<package>::usdc::USDC
   */
  async getCoinBalanceByType(address: string, coinType: string): Promise<{ success: boolean; raw?: number; normalized?: string; error?: string }>{
    const acct = normalizeAptos(address);
    try {
      console.log(`🔍 Getting coin balance for ${acct} with coinType ${coinType}`);
      
      const amount = await this.aptos.getAccountCoinAmount({
        accountAddress: acct,
        coinType: coinType,
      });
      
      console.log(`📊 Coin amount: ${amount}`);
      return { success: true, raw: amount, normalized: amount.toString() };
    } catch (e: any) {
      console.error("❌ getCoinBalanceByType error:", e);
      return { success: false, error: e?.message || "Failed to read Coin balance" };
    }
  }

  /**
   * Get USDC balance specifically (common use case)
   * Returns balance in human-readable format (e.g., 10.5 for 10.5 USDC)
   */
  async getUSDCBalance(address: string): Promise<{ success: boolean; balance?: string; raw?: number; error?: string }> {
    const acct = normalizeAptos(address);
    try {
      console.log(`💵 Getting USDC balance for ${acct}`);
      
      // First try to get all balances to see what tokens exist
      const allBalances = await this.getAllBalances(acct);
      if (allBalances.success && allBalances.balances) {
        console.log("🔍 All available balances:", allBalances.balances);
        
        // Look for USDC in various forms
        const usdcKeys = Object.keys(allBalances.balances).filter(key => 
          key.toLowerCase().includes('usdc') || 
          key.toLowerCase().includes('usd')
        );
        
        if (usdcKeys.length > 0) {
          const usdcBalance = allBalances.balances[usdcKeys[0]];
          console.log(`💵 Found USDC balance: ${usdcBalance}`);
          return { success: true, balance: usdcBalance, raw: parseFloat(usdcBalance) };
        }
      }
      
      // If no USDC found in general balances, return 0
      console.log("💵 No USDC balance found");
      return { success: true, balance: "0", raw: 0 };
    } catch (e: any) {
      console.error("❌ getUSDCBalance error:", e);
      return { success: false, error: e?.message || "Failed to get USDC balance" };
    }
  }

  // ---------------------------
  // Debug helpers
  // ---------------------------
  async getAllResources(address: string) {
    const acct = normalizeAptos(address);
    try {
      const resources = await this.aptos.getAccountResources({ accountAddress: acct });
      return { success: true, resources } as { success: boolean; resources: any[] };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to get resources" } as { success: boolean; error: string };
    }
  }

  async debugAccountState(address: string): Promise<void> {
    const acct = normalizeAptos(address);
    console.log(`\n--- 🕵️‍♂️ DEBUG APTOS ACCOUNT ${acct} ---`);
    try {
      const info = await this.aptos.getAccountInfo({ accountAddress: acct });
      console.log("getAccountInfo:", info);
    } catch (e: any) {
      console.log("getAccountInfo error:", e?.message);
    }

    try {
      const res = await this.getAllResources(acct);
      if (res.success) {
        console.log(`resources: ${res.resources.length}`);
      } else {
        console.log("resources error:", res.error);
      }
    } catch (e: any) {
      console.log("resources error:", e?.message);
    }
    console.log("--- end debug ---\n");
  }

  // ---------------------------
  // Misc
  // ---------------------------
  formatAddress(address: string): string {
    if (!address) return "";
    const a = normalizeAptos(address);
    return `${a.slice(0, 10)}…${a.slice(-6)}`;
  }

  getNetworkInfo(): { name: string; rpc: string } {
    return { name: "Aptos Testnet", rpc: "https://api.testnet.aptoslabs.com/v1" };
  }
}

// Singleton export
export const aptosService = new AptosService();
export default aptosService;

/* -------------------------------------------------------------
USAGE EXAMPLES (call from your app code):

import "react-native-get-random-values"; // at app entry

// 1) Create & pre-fund a wallet
await aptosService.generateWallet(200_000_000); // 2 APT

// 2) Load wallet
const w = await aptosService.getWallet();
console.log(w.address);

// 3) Aggregate balances (APT + all FA)
const bal = await aptosService.getAllBalances(w.address!);
console.log("All balances:", bal.balances);

// 4) Get USDC balance specifically
const usdcBal = await aptosService.getUSDCBalance(w.address!);
console.log("USDC balance:", usdcBal.balance);

// 5) Read a specific FA balance (if you know metadata address)
const fa = await aptosService.getFaBalanceByMetadata(w.address!, "0x<METADATA_ADDR>");
console.log("FA balance:", fa.normalized);

// 6) Legacy Coin fallback (if your token is a Coin type)
const coin = await aptosService.getCoinBalanceByType(w.address!, "0x<PKG>::usdc::USDC");
console.log("Coin balance:", coin.normalized);

// 7) Debug account state
await aptosService.debugAccountState(w.address!);
------------------------------------------------------------- */
