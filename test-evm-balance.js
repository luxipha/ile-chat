/**
 * Test EVM Balance for address 0x678bCC985D12C5fF769A2F4A5ff323A2029284Bb
 * Should show 20 USDC on Ethereum Sepolia testnet
 */

const testAddress = "0x678bCC985D12C5fF769A2F4A5ff323A2029284Bb";

async function testEVMBalance() {
  try {
    console.log('🔍 Testing EVM balance for address:', testAddress);
    
    const networks = [
      {
        name: "Ethereum Sepolia",
        rpc: "https://ethereum-sepolia-rpc.publicnode.com",
        symbol: "ETH",
        usdcContracts: [
          { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", name: "USDC" },
          { address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", name: "USDC.e" }
        ]
      },
      {
        name: "Polygon Amoy",
        rpc: "https://rpc-amoy.polygon.technology", 
        symbol: "MATIC",
        usdcContracts: [
          { address: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", name: "USDC" },
          { address: "0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97", name: "USDC.e" }
        ]
      }
    ];

    const balances = {};

    for (const network of networks) {
      try {
        console.log(`\n🔍 Checking ${network.name}...`);
        
        // 1. Check native balance (ETH/MATIC)
        const response = await fetch(network.rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [testAddress, "latest"],
            id: 1
          })
        });
        
        const result = await response.json();
        if (result.result) {
          const balanceWei = BigInt(result.result);
          const balanceEth = Number(balanceWei) / 1e18;
          if (balanceEth > 0) {
            balances[network.symbol] = balanceEth.toString();
            console.log(`✅ ${network.name}: ${balanceEth} ${network.symbol}`);
          } else {
            console.log(`⚪ ${network.name}: 0 ${network.symbol}`);
          }
        }

        // 2. Check USDC balances
        if (network.usdcContracts) {
          for (const usdc of network.usdcContracts) {
            try {
              const usdcResponse = await fetch(network.rpc, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  method: "eth_call",
                  params: [{
                    to: usdc.address,
                    data: `0x70a08231000000000000000000000000${testAddress.slice(2).toLowerCase()}`
                  }, "latest"],
                  id: 2
                })
              });
              
              const usdcResult = await usdcResponse.json();
              if (usdcResult.result && usdcResult.result !== "0x" && usdcResult.result !== "0x0") {
                const usdcBalanceWei = BigInt(usdcResult.result);
                const usdcBalance = Number(usdcBalanceWei) / 1e6; // USDC has 6 decimals
                if (usdcBalance > 0) {
                  balances[`USDC_${network.name.replace(' ', '_')}`] = usdcBalance.toString();
                  console.log(`✅ ${network.name}: ${usdcBalance} ${usdc.name}`);
                } else {
                  console.log(`⚪ ${network.name}: 0 ${usdc.name}`);
                }
              } else {
                console.log(`⚪ ${network.name}: 0 ${usdc.name} (no balance)`);
              }
            } catch (usdcError) {
              console.log(`❌ ${network.name} ${usdc.name} error:`, usdcError.message);
            }
          }
        }
      } catch (networkError) {
        console.log(`❌ ${network.name} error:`, networkError.message);
      }
    }
    
    console.log('\n📊 FINAL BALANCES:');
    console.log(JSON.stringify(balances, null, 2));
    
    // Check if we found the expected 20 USDC
    const usdcKeys = Object.keys(balances).filter(key => key.includes('USDC'));
    const totalUSDC = usdcKeys.reduce((total, key) => total + parseFloat(balances[key]), 0);
    
    console.log(`\n💰 Total USDC found: ${totalUSDC}`);
    
    if (totalUSDC >= 20) {
      console.log('✅ SUCCESS: Found the expected 20+ USDC!');
    } else if (totalUSDC > 0) {
      console.log(`⚠️ Found ${totalUSDC} USDC, but expected 20+`);
    } else {
      console.log('❌ No USDC found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEVMBalance();