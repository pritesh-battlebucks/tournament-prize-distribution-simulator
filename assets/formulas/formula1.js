/**
 * Formula 1: Percentile-based prize distribution
 * Distributes pooled entry fees across rank brackets,
 * then adds extra rank-wise and trophy rewards on top.
 */

const Formula1 = {
  name: "Formula 1 – Percentile Distribution",
  id: "formula1",

  /**
   * @param {object} config
   * @param {number} config.totalPlayers
   * @param {number} config.totalEntries
   * @param {number} config.registrationFeeCoins
   * @param {number} config.registrationFeeGems
   * @param {number} config.registrationFeeGG
   * @param {Array}  config.prizeDistributionRules  – entryFeeCollectionPercentileDistributionRules
   * @param {Array}  config.trophyDistributionRules – extraRewardsDistribution.trophiesDistribution.rules
   * @param {Array}  config.extraRankWiseRewards     – extraRankWiseReward
   * @returns {Array<{rank, coins, gems, trophies, gg, physicalRewards}>}
   */
  compute(config) {
    const {
      totalPlayers,
      totalEntries,
      registrationFeeCoins,
      registrationFeeGems,
      registrationFeeGG,
      prizeDistributionRules,
      trophyDistributionRules,
      extraRankWiseRewards,
    } = config;

    if (totalPlayers === 0) return [];
    if (!prizeDistributionRules || prizeDistributionRules.length === 0) {
      throw new Error("No prize distribution rules defined.");
    }

    // Total prize pools
    const totalCoinsPrize = registrationFeeCoins * totalEntries;
    const totalGemsPrize  = registrationFeeGems  * totalEntries;
    const totalGGPrize    = registrationFeeGG    * totalEntries;
    const totalTrophiesPrize = 0; // trophies from entry fees not used here

    // Build per-rank prize accumulator (index 0 = rank 1)
    const playerPrizes = Array.from({ length: totalPlayers }, () => ({
      coins: 0, gems: 0, trophies: 0, gg: 0,
    }));

    // Track which indices have been awarded already
    const awardedIndices = new Set();

    // Distribute entry-fee prizes across brackets
    prizeDistributionRules.forEach((rule) => {
      const startRank = Math.floor((totalPlayers * rule.rankStartPercent) / 100);
      const endRank   = Math.ceil((totalPlayers * rule.rankEndPercent)   / 100);

      const bracketIndices = [];
      for (let i = startRank; i < endRank; i++) {
        if (i < totalPlayers && !awardedIndices.has(i)) {
          bracketIndices.push(i);
        }
      }

      if (bracketIndices.length === 0) return;

      const coinsForBracket    = (totalCoinsPrize    * rule.sharePercent) / 100;
      const gemsForBracket     = (totalGemsPrize     * rule.sharePercent) / 100;
      const ggForBracket       = (totalGGPrize       * rule.sharePercent) / 100;
      const trophiesForBracket = (totalTrophiesPrize * rule.sharePercent) / 100;

      const coinsPerPlayer    = coinsForBracket    / bracketIndices.length;
      const gemsPerPlayer     = gemsForBracket     / bracketIndices.length;
      const ggPerPlayer       = ggForBracket       / bracketIndices.length;
      const trophiesPerPlayer = trophiesForBracket / bracketIndices.length;

      bracketIndices.forEach((idx) => {
        playerPrizes[idx].coins    += coinsPerPlayer;
        playerPrizes[idx].gems     += gemsPerPlayer;
        playerPrizes[idx].gg       += ggPerPlayer;
        playerPrizes[idx].trophies += trophiesPerPlayer;
        awardedIndices.add(idx);
      });
    });

    // Build final results with extra rewards
    return playerPrizes.map((prizes, index) => {
      const rank        = index + 1;
      const rankPercent = (index / totalPlayers) * 100;

      // Extra rank-wise reward (only for explicitly defined top ranks)
      const extraRankWiseReward = extraRankWiseRewards[index] || null;

      // Trophy distribution based on percentile bracket
      let distributedTrophies = 0;
      for (const rule of trophyDistributionRules) {
        if (
          rankPercent >= rule.rankStartPercent &&
          rankPercent < rule.rankEndPercent
        ) {
          distributedTrophies = rule.trophiesPerParticipant;
          break;
        }
      }

      const totalCoins    = Math.floor(prizes.coins    + (extraRankWiseReward?.coins    ?? 0));
      const totalGems     = Math.floor(prizes.gems     + (extraRankWiseReward?.gems     ?? 0));
      const totalTrophies = Math.floor(prizes.trophies + (extraRankWiseReward?.trophies ?? 0) + distributedTrophies);
      const totalGG       = Math.floor(prizes.gg       + (extraRankWiseReward?.GG       ?? 0));
      const physicalRewards = extraRankWiseReward?.physicalRewards || [];

      return { rank, coins: totalCoins, gems: totalGems, trophies: totalTrophies, gg: totalGG, physicalRewards };
    });
  },
};