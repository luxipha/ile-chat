// Gas Fee Calculator for Base USDC Transfers
const ethers = require('ethers');

// Base network gas prices (approximate)
const BASE_GAS_PRICES = {
  testnet: {
    gasPrice: '0.001', // ~0.001 gwei (very low on testnet)
    gasLimit: 65000 // typical for ERC-20 transfer
  },
  mainnet: {
    gasPrice: '0.001', // ~0.001 gwei (Base is very cheap)
    gasLimit: 65000
  }
};

function calculateGasFee(network = 'testnet') {
  const config = BASE_GAS_PRICES[network];
  
  // Convert gas price from gwei to wei
  const gasPriceWei = ethers.parseUnits(config.gasPrice, 'gwei');
  
  // Calculate total gas cost in wei
  const gasCostWei = gasPriceWei * BigInt(config.gasLimit);
  
  // Convert to ETH
  const gasCostEth = ethers.formatEther(gasCostWei);
  
  console.log(`\n=== Base ${network.toUpperCase()} Gas Fee Calculation ===`);
  console.log(`Gas Price: ${config.gasPrice} gwei`);
  console.log(`Gas Limit: ${config.gasLimit}`);
  console.log(`Total Gas Cost: ${gasCostEth} ETH`);
  console.log(`Total Gas Cost: ${gasCostWei.toString()} wei`);
  
  // Convert to USD (approximate ETH price)
  const ethPriceUSD = 3500; // approximate
  const gasCostUSD = parseFloat(gasCostEth) * ethPriceUSD;
  console.log(`Approximate USD Cost: $${gasCostUSD.toFixed(6)}`);
  
  return {
    gasPriceGwei: config.gasPrice,
    gasLimit: config.gasLimit,
    gasCostWei: gasCostWei.toString(),
    gasCostEth: gasCostEth,
    gasCostUSD: gasCostUSD
  };
}

// Calculate for both networks
console.log('Base Network Gas Fee Analysis');
console.log('============================');

const testnetFees = calculateGasFee('testnet');
const mainnetFees = calculateGasFee('mainnet');

console.log('\n=== Summary ===');
console.log('Base is designed to be extremely cheap for transactions.');
console.log('Typical USDC transfer costs less than $0.01 in gas fees.');
console.log('The main issue is users need ETH for gas, even if the amount is tiny.');

