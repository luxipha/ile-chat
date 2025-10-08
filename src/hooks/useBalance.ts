import { useQuery } from "@tanstack/react-query";

export function useBalance() {
  const {
    data: balances = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["aptos-balances"],
    queryFn: async () => {
      // Aptos balance logic would go here
      return null;
    },
    enabled: false, // Disabled until Aptos balance logic is implemented
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    balances,
    displayableBalance: "0.00",
    nativeBalance: "0",
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    isLoading,
    refetch,
  };
}