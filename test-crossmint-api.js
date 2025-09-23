/**
 * Test CrossMint API for address 0x678bCC985D12C5fF769A2F4A5ff323A2029284Bb
 * Should show 20 USDC using CrossMint staging API
 */

const testAddress = "0x678bCC985D12C5fF769A2F4A5ff323A2029284Bb";
const apiKey = "ck_staging_5zjWiW7TV26xSe1p117tHktSNAQmTwSLu51cB326brCKVc3DW8j5JDGx6yki39kDpAGjWd7fgrK7g17d9cCJeciWAG4ugruJABAMPS2PUxR2ECAwKnNju4pTKaSS1GkHZvvobJdPsJSHQxKnfBDHSZM9yKhsVHh8v9P6BiueSVF1aB3W5YN4kGY6mz3m85McCUTwre9rBCjTMbdy3kEkeCoP";

async function testCrossmintAPI() {
  try {
    console.log('🔍 Testing CrossMint API for address:', testAddress);
    console.log('🌐 Environment: staging');
    console.log('🔑 API Key:', apiKey.slice(0, 20) + '...');
    
    // Test 1: Check wallet balance using CrossMint API with tokens parameter
    console.log('\n📊 Test 1: Checking wallet balances with tokens parameter...');
    
    const balanceUrl = `https://staging.crossmint.com/api/v1-alpha2/wallets/${testAddress}/balances?tokens=usdc,eth`;
    
    const balanceResponse = await fetch(balanceUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Balance API Response Status:', balanceResponse.status);
    console.log('📡 Balance API Response Headers:', Object.fromEntries(balanceResponse.headers.entries()));
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log('✅ Balance API Success:', JSON.stringify(balanceData, null, 2));
      
      // Look for USDC in the response
      if (balanceData.balances) {
        const usdcBalance = balanceData.balances.find(balance => 
          balance.currency?.toLowerCase().includes('usdc') || 
          balance.symbol?.toLowerCase().includes('usdc')
        );
        
        if (usdcBalance) {
          console.log(`💰 Found USDC: ${usdcBalance.amount} ${usdcBalance.symbol || usdcBalance.currency}`);
        } else {
          console.log('⚪ No USDC found in balances');
        }
      }
    } else {
      const errorData = await balanceResponse.text();
      console.log('❌ Balance API Error:', balanceResponse.status, errorData);
    }
    
    // Test 2: Check wallet info
    console.log('\n📊 Test 2: Checking wallet info...');
    
    const walletUrl = `https://staging.crossmint.com/api/v1-alpha2/wallets/${testAddress}`;
    
    const walletResponse = await fetch(walletUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Wallet API Response Status:', walletResponse.status);
    
    if (walletResponse.ok) {
      const walletData = await walletResponse.json();
      console.log('✅ Wallet API Success:', JSON.stringify(walletData, null, 2));
    } else {
      const errorData = await walletResponse.text();
      console.log('❌ Wallet API Error:', walletResponse.status, errorData);
    }
    
    // Test 3: Try different endpoints
    console.log('\n📊 Test 3: Trying alternative endpoints...');
    
    const altUrls = [
      `https://staging.crossmint.com/api/v1/wallets/${testAddress}/balances`,
      `https://staging.crossmint.com/api/v2/wallets/${testAddress}/balances`,
      `https://staging.crossmint.com/api/wallets/${testAddress}/balances`
    ];
    
    for (const url of altUrls) {
      try {
        console.log(`\n🔍 Trying: ${url}`);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📡 Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Success:', JSON.stringify(data, null, 2));
        } else {
          const errorText = await response.text();
          console.log('❌ Error:', errorText.slice(0, 200));
        }
      } catch (error) {
        console.log('❌ Request failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCrossmintAPI();