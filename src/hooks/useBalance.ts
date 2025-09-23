import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@crossmint/client-sdk-react-native-ui";

export function useBalance() {
  const { wallet } = useWallet();
  
  const {
    data: balances = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["crossmint-balances", wallet?.address],
    queryFn: async () => {
      if (!wallet) return null;
      
      try {
        // Get USDC and native token balances
        const balanceData = await wallet.balances(["usdc"]);
        console.log('✅ CrossMint wallet balances:', balanceData);
        return balanceData;
      } catch (error) {
        console.error('❌ CrossMint balance fetch error:', error);
        throw error;
      }
    },
    enabled: !!wallet,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    balances,
    displayableBalance: parseFloat(balances?.usdc?.amount ?? "0").toFixed(2),
    nativeBalance: balances?.nativeToken?.amount || "0",
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    isLoading,
    refetch,
  };
}