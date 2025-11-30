import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getContractClient } from '@/lib/contract-client';

/**
 * GET /api/contract/state
 *
 * Get current contract state (pot balance, limits, pause status).
 * Public endpoint - no authentication required.
 *
 * Response:
 * - potBalance: string (in wei)
 * - maxBet: string (in wei)
 * - maxPayout: string (in wei)
 * - isPaused: boolean
 * - tokenAddress: string
 * - contractAddress: string
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const contractClient = getContractClient();
    const state = await contractClient.getContractState();

    return apiSuccess({
      potBalance: state.potBalance.toString(),
      maxBet: state.maxBet.toString(),
      maxPayout: state.maxPayout.toString(),
      isPaused: state.isPaused,
      tokenAddress: state.tokenAddress,
      contractAddress: contractClient.contractAddress,
    });
  } catch (error) {
    console.error('Error getting contract state:', error);
    return apiError('INTERNAL_ERROR', 'Failed to get contract state', 500);
  }
}
