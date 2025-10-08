

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
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

interface AptosTransactionResponse {
  success: boolean;
  hash?: string;
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
      console.log("🔑 Private key format stored:", privateKey.substring(0, 30) + "...");

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
      // First try to get from database (if Service is available)
      try {
        // Check if we can import Service dynamically
        const Service = await import('../services/Service');
        const backendWallet = await Service.default.getWalletFromBackend('aptos-testnet', 'aptos');
        
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
        const Service = await import('../services/Service');
        const backendWallet = await Service.default.getWalletFromBackend('aptos-testnet', 'aptos');
        
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
      
      // USDC metadata address on Aptos testnet (from Circle's documentation)
      const USDC_METADATA_ADDRESS = "0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832";
      
      try {
        // Try to get USDC balance using the specific metadata address
        console.log(`🔍 Checking USDC balance using metadata address: ${USDC_METADATA_ADDRESS}`);
        const amount = await this.aptos.getAccountCoinAmount({
          accountAddress: acct,
          faMetadataAddress: USDC_METADATA_ADDRESS,
        });
        
        // Convert from micro-USDC to USDC (6 decimals)
        const balance = amount / 1_000_000;
        console.log(`💵 USDC balance: ${balance} (${amount} micro-USDC)`);
        return { success: true, balance: balance.toString(), raw: balance };
        
      } catch (directError: any) {
        console.log(`ℹ️ Direct metadata lookup failed: ${directError?.message}, trying general balance lookup...`);
        
        // Fallback to general balance lookup
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
            console.log(`💵 Found USDC balance from general lookup: ${usdcBalance}`);
            return { success: true, balance: usdcBalance, raw: parseFloat(usdcBalance) };
          }
        }
      }
      
      // If no USDC found in either method, return 0
      console.log("💵 No USDC balance found");
      return { success: true, balance: "0", raw: 0 };
    } catch (e: any) {
      console.error("❌ getUSDCBalance error:", e);
      return { success: false, error: e?.message || "Failed to get USDC balance" };
    }
  }

  // ---------------------------
  // Transaction sending
  // ---------------------------
  
  /**
   * Send APT (native Aptos token) to another address
   */
  async sendAPT(toAddress: string, amount: number): Promise<AptosTransactionResponse> {
    try {
      console.log(`💸 Sending ${amount} APT to ${toAddress}`);
      
      // Get wallet
      const walletResult = await this.getWallet();
      if (!walletResult.success || !walletResult.address || !walletResult.privateKey) {
        return { success: false, error: 'No wallet found or missing private key' };
      }
      
      // Create account from private key
      console.log(`🔑 Raw private key from storage: ${walletResult.privateKey.substring(0, 20)}...`);
      
      // Handle different private key formats
      let privateKeyString: string;
      if (walletResult.privateKey.startsWith('ed25519-priv-')) {
        // Already in correct format
        privateKeyString = walletResult.privateKey;
      } else if (walletResult.privateKey.startsWith('0x')) {
        // Hex format, add ed25519-priv prefix
        privateKeyString = `ed25519-priv-${walletResult.privateKey}`;
      } else {
        // Raw hex without 0x, add both prefix and 0x
        privateKeyString = `ed25519-priv-0x${walletResult.privateKey}`;
      }
      
      console.log(`🔑 Formatted private key: ${privateKeyString.substring(0, 30)}...`);
      const account = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKeyString) });
      const recipientAddress = AccountAddress.fromString(normalizeAptos(toAddress));
      
      // Convert amount to octas (1 APT = 100,000,000 octas)
      const amountInOctas = Math.floor(amount * 100_000_000);
      
      console.log(`📊 Sending ${amountInOctas} octas to ${recipientAddress.toString()}`);
      
      // Build transaction
      const transaction = await this.aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [recipientAddress, amountInOctas],
        },
      });
      
      // Sign and submit transaction
      const committedTxn = await this.aptos.signAndSubmitTransaction({ 
        signer: account, 
        transaction 
      });
      
      // Wait for confirmation
      await this.aptos.waitForTransaction({ transactionHash: committedTxn.hash });
      
      console.log(`✅ APT transfer completed: ${committedTxn.hash}`);
      return { success: true, hash: committedTxn.hash };
      
    } catch (e: any) {
      console.error('❌ APT send error:', e);
      return { success: false, error: e?.message || 'Failed to send APT' };
    }
  }
  
  /**
   * Send Fungible Asset (e.g., USDC) to another address
   */
  async sendFungibleAsset(toAddress: string, amount: number, metadataAddress: string): Promise<AptosTransactionResponse> {
    try {
      console.log(`💸 Sending ${amount} FA (${metadataAddress}) to ${toAddress}`);
      
      // Get wallet
      const walletResult = await this.getWallet();
      if (!walletResult.success || !walletResult.address || !walletResult.privateKey) {
        return { success: false, error: 'No wallet found or missing private key' };
      }
      
      // Create account from private key
      console.log(`🔑 Raw private key from storage: ${walletResult.privateKey.substring(0, 20)}...`);
      
      // Handle different private key formats
      let privateKeyString: string;
      if (walletResult.privateKey.startsWith('ed25519-priv-')) {
        // Already in correct format
        privateKeyString = walletResult.privateKey;
      } else if (walletResult.privateKey.startsWith('0x')) {
        // Hex format, add ed25519-priv prefix
        privateKeyString = `ed25519-priv-${walletResult.privateKey}`;
      } else {
        // Raw hex without 0x, add both prefix and 0x
        privateKeyString = `ed25519-priv-0x${walletResult.privateKey}`;
      }
      
      console.log(`🔑 Formatted private key: ${privateKeyString.substring(0, 30)}...`);
      const account = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKeyString) });
      const recipientAddress = AccountAddress.fromString(normalizeAptos(toAddress));
      const faMetadataAddress = AccountAddress.fromString(normalizeAptos(metadataAddress));
      
      console.log(`📊 Transferring ${amount} units of FA to ${recipientAddress.toString()}`);
      
      // Use the built-in transferFungibleAsset method
      const transaction = await this.aptos.transferFungibleAsset({
        sender: account,
        fungibleAssetMetadataAddress: faMetadataAddress,
        recipient: recipientAddress,
        amount: amount,
      });
      
      // Sign and submit transaction
      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: account,
        transaction,
      });
      
      // Wait for confirmation
      await this.aptos.waitForTransaction({ transactionHash: committedTxn.hash });
      
      console.log(`✅ FA transfer completed: ${committedTxn.hash}`);
      return { success: true, hash: committedTxn.hash };
      
    } catch (e: any) {
      console.error('❌ FA send error:', e);
      return { success: false, error: e?.message || 'Failed to send Fungible Asset' };
    }
  }
  
  /**
   * Send USDC specifically (convenience method)
   * Uses the testnet USDC metadata address
   */
  async sendUSDC(toAddress: string, amount: number): Promise<AptosTransactionResponse> {
    try {
      console.log(`💵 Sending ${amount} USDC to ${toAddress}`);
      
      // USDC metadata address on Aptos testnet (from Circle's documentation)
      const USDC_METADATA_ADDRESS = "0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832";
      
      // Get wallet
      const walletResult = await this.getWallet();
      if (!walletResult.success || !walletResult.address || !walletResult.privateKey) {
        return { success: false, error: 'No wallet found or missing private key' };
      }
      
      // Check USDC balance first
      const usdcBalance = await this.getUSDCBalance(walletResult.address);
      if (!usdcBalance.success || !usdcBalance.balance) {
        return { success: false, error: 'Failed to get USDC balance' };
      }
      
      const balance = parseFloat(usdcBalance.balance);
      if (balance < amount) {
        return { 
          success: false, 
          error: `Insufficient USDC balance. You have ${balance} USDC, but trying to send ${amount} USDC` 
        };
      }
      
      // Check APT balance for gas fees
      console.log(`🔍 Checking APT balance for gas fees...`);
      try {
        const aptAmount = await this.aptos.getAccountAPTAmount({ accountAddress: walletResult.address });
        const aptBalance = aptAmount / 100_000_000; // Convert from octas to APT
        console.log(`⛽ APT balance: ${aptBalance} APT (${aptAmount} octas)`);
        
        // Need at least 0.001 APT for transaction fees (conservative estimate)
        const minAptForGas = 0.001;
        if (aptBalance < minAptForGas) {
          console.log(`⛽ Insufficient APT for gas fees: ${aptBalance} APT (need ${minAptForGas} APT)`);
          
          return {
            success: false,
            error: `Insufficient APT for transaction fees. You have ${aptBalance} APT but need at least ${minAptForGas} APT.\n\nTo get testnet APT:\n1. Visit https://aptos.dev/network/faucet\n2. Enter your wallet address: ${walletResult.address}\n3. Click "Fund Account"\n4. Try the transaction again`
          };
        }
      } catch (aptError: any) {
        console.warn(`⚠️ Could not check APT balance: ${aptError.message}`);
        // Continue anyway, let the transaction fail with a proper error if needed
      }
      
      console.log(`💰 Current USDC balance: ${balance}, attempting to send: ${amount}`);
      
      // Create account from private key
      console.log(`🔑 Raw private key from storage (first 20 chars): ${walletResult.privateKey.substring(0, 20)}...`);
      console.log(`🔑 Private key length: ${walletResult.privateKey.length}`);
      console.log(`🔑 Private key starts with: ${walletResult.privateKey.substring(0, 15)}`);
      
      // Handle different private key formats, including base64 encoded ones
      let privateKeyString: string;
      
      if (walletResult.privateKey.startsWith('ed25519-priv-')) {
        // Already in correct format
        privateKeyString = walletResult.privateKey;
        console.log(`🔑 ✅ Using existing ed25519-priv format`);
      } else if (walletResult.privateKey.startsWith('0x')) {
        // Hex format, add ed25519-priv prefix
        privateKeyString = `ed25519-priv-${walletResult.privateKey}`;
        console.log(`🔑 🔄 Converting from 0x hex format`);
      } else {
        // Check if it's base64 encoded by looking for non-hex characters
        const hasNonHexChars = /[^0-9a-fA-F]/.test(walletResult.privateKey);
        
        if (hasNonHexChars) {
          // Likely base64 encoded, try to decode it
          try {
            // Convert base64 to string
            const decoded = atob(walletResult.privateKey);
            console.log(`🔑 🔄 Decoded base64 private key: ${decoded.substring(0, 30)}...`);
            
            if (decoded.startsWith('ed25519-priv-')) {
              privateKeyString = decoded;
              console.log(`🔑 ✅ Using decoded ed25519-priv format`);
            } else {
              // If decoded doesn't have the prefix, add it
              const cleanDecoded = decoded.startsWith('0x') ? decoded : `0x${decoded}`;
              privateKeyString = `ed25519-priv-${cleanDecoded}`;
              console.log(`🔑 🔄 Adding prefix to decoded key`);
            }
          } catch (decodeError) {
            console.error(`❌ Failed to decode base64: ${decodeError}`);
            // Fall back to treating as raw hex
            privateKeyString = `ed25519-priv-0x${walletResult.privateKey}`;
            console.log(`🔑 🔄 Fallback: treating as raw hex`);
          }
        } else {
          // Raw hex without 0x, add both prefix and 0x
          privateKeyString = `ed25519-priv-0x${walletResult.privateKey}`;
          console.log(`🔑 🔄 Converting from raw hex format`);
        }
      }
      
      console.log(`🔑 Final private key format: ${privateKeyString.substring(0, 30)}...`);
      console.log(`🔑 Final private key length: ${privateKeyString.length}`);
      
      let account: Account;
      try {
        account = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKeyString) });
        console.log(`✅ Account created successfully from private key`);
      } catch (keyError: any) {
        console.error(`❌ Failed to create account from private key: ${keyError.message}`);
        console.error(`❌ Private key that failed: ${privateKeyString.substring(0, 50)}...`);
        throw new Error(`Invalid private key format: ${keyError.message}`);
      }
      
      const recipientAddress = AccountAddress.fromString(normalizeAptos(toAddress));
      const metadataAddress = AccountAddress.fromString(normalizeAptos(USDC_METADATA_ADDRESS));
      
      console.log(`📊 Transferring ${amount} USDC to ${recipientAddress.toString()}`);
      console.log(`🏷️ Using USDC metadata address: ${metadataAddress.toString()}`);
      
      // Convert amount to micro-USDC (6 decimals)
      const amountInMicroUsdc = Math.floor(amount * 1_000_000);
      console.log(`💰 Amount in micro-USDC: ${amountInMicroUsdc}`);
      
      // Build the transfer transaction using the SDK's transferFungibleAsset method
      const transaction = await this.aptos.transferFungibleAsset({
        sender: account,
        fungibleAssetMetadataAddress: metadataAddress,
        recipient: recipientAddress,
        amount: amountInMicroUsdc,
      });
      
      console.log(`📋 Transaction built successfully`);
      
      // Sign and submit transaction in one step (following official examples)
      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: account,
        transaction,
      });
      
      console.log(`📤 Transaction submitted: ${committedTxn.hash}`);
      
      // Wait for confirmation
      await this.aptos.waitForTransaction({ transactionHash: committedTxn.hash });
      
      console.log(`✅ USDC transfer completed: ${committedTxn.hash}`);
      return { success: true, hash: committedTxn.hash };
      
    } catch (e: any) {
      console.error('❌ USDC send error:', e);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send USDC';
      if (e?.message?.includes('INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE')) {
        errorMessage = 'Insufficient APT balance for transaction fees. Please fund your account with APT.';
      } else if (e?.message?.includes('INSUFFICIENT_BALANCE')) {
        errorMessage = 'Insufficient USDC balance for this transaction.';
      } else if (e?.message?.includes('INVALID_SIGNATURE')) {
        errorMessage = 'Invalid transaction signature. Please try again.';
      } else if (e?.message?.includes('SEQUENCE_NUMBER')) {
        errorMessage = 'Transaction sequence error. Please try again.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if wallet has sufficient APT for transaction fees
   */
  async checkAptBalance(address: string): Promise<{ success: boolean; aptBalance?: number; needsFunding?: boolean; error?: string }> {
    try {
      const aptAmount = await this.aptos.getAccountAPTAmount({ accountAddress: normalizeAptos(address) });
      const aptBalance = aptAmount / 100_000_000; // Convert from octas to APT
      const minAptForGas = 0.001; // Minimum APT needed for transactions
      
      return {
        success: true,
        aptBalance,
        needsFunding: aptBalance < minAptForGas
      };
    } catch (e: any) {
      console.error('❌ checkAptBalance error:', e);
      return { success: false, error: e?.message || 'Failed to check APT balance' };
    }
  }

  /**
   * Get current wallet address for funding purposes
   */
  async getWalletAddress(): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      const walletResult = await this.getWallet();
      if (!walletResult.success || !walletResult.address) {
        return { success: false, error: 'No wallet found' };
      }
      return { success: true, address: walletResult.address };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to get wallet address' };
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
