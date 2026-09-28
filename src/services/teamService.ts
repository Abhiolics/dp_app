import apiClient from './api';
import { getTransactions } from './walletService';

export interface TeamStats {
  totalCommissions: number;
  commissionsYesterday: number;
  commissionsToday: number;
  totalTeamMembers: number;
  totalTeamDeposit: number;
  newMembersToday: number;
  newMembersYesterday: number;
  currentCommissionVolume: number;
  targetCommissionVolume: number;
  currentLevel: string;
  inviteCode: string;
  inviteLink: string;
}

export const getTeamStats = async (user?: { _id?: string; id?: string } | null): Promise<TeamStats> => {
  const userId = user?._id || user?.id || 'MEMBER';
  const inviteCode = userId.slice(-6).toUpperCase();
  const inviteLink = `https://dreampay.vip/invite?code=${inviteCode}`;

  try {
    // Attempt backend API if available
    const response = await apiClient.get<{ success: boolean; data: Partial<TeamStats> }>('/teams');
    if (response.data && response.data.data) {
      return {
        totalCommissions: response.data.data.totalCommissions ?? 0,
        commissionsYesterday: response.data.data.commissionsYesterday ?? 0,
        commissionsToday: response.data.data.commissionsToday ?? 0,
        totalTeamMembers: response.data.data.totalTeamMembers ?? 0,
        totalTeamDeposit: response.data.data.totalTeamDeposit ?? 0,
        newMembersToday: response.data.data.newMembersToday ?? 0,
        newMembersYesterday: response.data.data.newMembersYesterday ?? 0,
        currentCommissionVolume: response.data.data.currentCommissionVolume ?? 0,
        targetCommissionVolume: response.data.data.targetCommissionVolume ?? 50000,
        currentLevel: response.data.data.currentLevel ?? 'Level A',
        inviteCode,
        inviteLink,
      };
    }
  } catch {
    // Fallback: check live wallet referral transactions or calculate
    try {
      const txRes = await getTransactions({ category: 'referral_bonus' as any });
      const referralTxs = txRes.data || [];
      const totalFromTxs = referralTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      return {
        totalCommissions: totalFromTxs,
        commissionsYesterday: 0,
        commissionsToday: 0,
        totalTeamMembers: referralTxs.length,
        totalTeamDeposit: 0,
        newMembersToday: 0,
        newMembersYesterday: 0,
        currentCommissionVolume: totalFromTxs,
        targetCommissionVolume: 50000,
        currentLevel: 'Level A',
        inviteCode,
        inviteLink,
      };
    } catch {
      // Graceful default
    }
  }

  return {
    totalCommissions: 0,
    commissionsYesterday: 0,
    commissionsToday: 0,
    totalTeamMembers: 0,
    totalTeamDeposit: 0,
    newMembersToday: 0,
    newMembersYesterday: 0,
    currentCommissionVolume: 0,
    targetCommissionVolume: 50000,
    currentLevel: 'Level A',
    inviteCode,
    inviteLink,
  };
};
