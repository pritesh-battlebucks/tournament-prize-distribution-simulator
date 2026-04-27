/**
 * Formula 2 – Discrete integer prize allocation via percentile-to-rank mapping.
 *
 * Key difference from Formula 1:
 *   Formula 1 divides a bracket's prize evenly among its members (floating point, then floor).
 *   Formula 2 converts every bracket into per-rank integer weights first, then calls
 *   allocateDiscreteUnits() so the FULL prize pool is always distributed without remainder loss.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helper 1 – allocateDiscreteUnits
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Splits `totalUnits` (integer) across buckets proportional to `weights`.
 * Remainders are handed out one-by-one to the buckets with the largest
 * fractional parts; ties are broken by index (earlier or later).
 *
 * @param {number}   totalUnits  - Integer pool to distribute.
 * @param {number[]} weights     - Relative weight for each bucket.
 * @param {{ tieBreak?: 'earlier'|'later' }} [options]
 * @returns {number[]} Integer allocations whose sum === totalUnits.
 */
function allocateDiscreteUnits(totalUnits, weights, options = {}) {
  if (totalUnits <= 0 || weights.length === 0) return weights.map(() => 0);

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) return weights.map(() => 0);

  // ── FIX: snap values within floating-point noise of an integer ──────────
  const EPSILON = 1e-9;
  const exactAllocations = weights.map((w) => {
    const raw = (totalUnits * w) / totalWeight;
    const nearest = Math.round(raw);
    return Math.abs(raw - nearest) < EPSILON ? nearest : raw;
  });
  // ────────────────────────────────────────────────────────────────────────

  const allocations = exactAllocations.map((a) => Math.floor(a));
  let remainingUnits =
    totalUnits - allocations.reduce((sum, a) => sum + a, 0);

  if (remainingUnits <= 0) return allocations;

  // ── NEW: resolve eligible indexes once (used by sequential path) ──────────
  const weightedIndexes = weights
    .map((w, idx) => ({ idx, hasWeight: w > 0 }))
    .filter((b) => b.hasWeight)
    .map((b) => b.idx);

  if (weightedIndexes.length === 0) return allocations;

  // ── NEW: sequential strategy ──────────────────────────────────────────────
  if (options.remainderStrategy === 'sequential') {
    let cursor = 0;
    while (remainingUnits > 0) {
      allocations[weightedIndexes[cursor % weightedIndexes.length]] += 1;
      remainingUnits -= 1;
      cursor += 1;
    }
    return allocations;
  }

  // ── Default: largest-remainder (LRM) ─────────────────────────────────────
  const rankedBuckets = exactAllocations
    .map((a, idx) => ({
      index: idx,
      remainder: a - Math.floor(a),
      hasWeight: weights[idx] > 0,
    }))
    .filter((b) => b.hasWeight)
    .sort((l, r) => {
      if (r.remainder !== l.remainder) return r.remainder - l.remainder;
      return options.tieBreak === 'later' ? r.index - l.index : l.index - r.index;
    });

  let cursor = 0;
  while (remainingUnits > 0) {
    allocations[rankedBuckets[cursor % rankedBuckets.length].index] += 1;
    remainingUnits -= 1;
    cursor += 1;
  }

  return allocations;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper 2 – getPercentileRecipientCounts
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Converts percentile brackets into concrete participant counts for this tournament.
 *
 * Business rules:
 *  - Every active bracket receives at least 1 recipient.
 *  - Active brackets form a contiguous prefix from the top rank.
 *  - The full participant count is always accounted for.
 *
 * @param {number}   totalParticipants
 * @param {Array<{rankStartPercent:number, rankEndPercent:number}>} rules
 * @returns {number[]} recipient count per rule, same order as `rules`.
 */
function getPercentileRecipientCounts(totalParticipants, rules) {
  if (totalParticipants <= 0 || rules.length === 0) {
    return new Array(rules.length).fill(0);
  }

  // Every active bracket starts with 1 guaranteed recipient
  const occupiedBracketCount = Math.min(totalParticipants, rules.length);
  const recipientCounts = rules.map((_, idx) =>
    idx < occupiedBracketCount ? 1 : 0
  );

  const remainingParticipants = totalParticipants - occupiedBracketCount;
  if (remainingParticipants <= 0) return recipientCounts;

  // Spread the remaining participants proportionally by percentile width
  const percentileWidths = rules
    .slice(0, occupiedBracketCount)
    .map((r) => r.rankEndPercent - r.rankStartPercent);

  const extraCounts = allocateDiscreteUnits(remainingParticipants, percentileWidths, {
  remainderStrategy: 'largestRemainder',
  tieBreak: 'later',
});

  extraCounts.forEach((extra, idx) => {
    recipientCounts[idx] += extra;
  });

  return recipientCounts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper 3 – computePercentilePrizeAllocations
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns per-rank integer payouts for one currency whose sum === totalPrize.
 *
 * @param {number} totalParticipants
 * @param {number} totalPrize
 * @param {Array<{rankStartPercent:number, rankEndPercent:number, sharePercent:number}>} rules
 * @returns {number[]}
 */
function computePercentilePrizeAllocations(totalParticipants, totalPrize, rules) {
  if (totalParticipants <= 0) return [];

  const recipientCounts = getPercentileRecipientCounts(totalParticipants, rules);
  const rankWeights = [];

  rules.forEach((rule, idx) => {
    const count = recipientCounts[idx];
    if (count <= 0) return;

    const perRankWeight = rule.sharePercent / count;
    for (let offset = 0; offset < count; offset++) {
      rankWeights.push(perRankWeight);
    }
  });

  return allocateDiscreteUnits(totalPrize, rankWeights, { remainderStrategy: 'sequential' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper 4 – computeFixedRewardAllocations
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Assigns a fixed per-bracket reward to every rank inside that bracket.
 *
 * @param {number}   totalParticipants
 * @param {Array}    rules              - Percentile bracket definitions.
 * @param {function} rewardSelector     - (rule) => fixedRewardValue
 * @returns {number[]} per-rank fixed reward, length === totalParticipants.
 */
function computeFixedRewardAllocations(totalParticipants, rules, rewardSelector) {
  if (totalParticipants <= 0 || rules.length === 0) {
    return new Array(totalParticipants).fill(0);
  }

  const recipientCounts = getPercentileRecipientCounts(totalParticipants, rules);
  const rewardsByRank = [];

  recipientCounts.forEach((count, ruleIdx) => {
    for (let offset = 0; offset < count; offset++) {
      rewardsByRank.push(rewardSelector(rules[ruleIdx]));
    }
  });

  return rewardsByRank;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formula 2 – exported object consumed by app.js
// ─────────────────────────────────────────────────────────────────────────────
const Formula2 = {
  name: "Formula 2 – Discrete Integer Allocation",
  id: "formula2",

  /**
   * @param {object}   config
   * @param {number}   config.totalPlayers
   * @param {number}   config.totalEntries
   * @param {number}   config.registrationFeeCoins
   * @param {number}   config.registrationFeeGems
   * @param {number}   config.registrationFeeGG
   * @param {Array}    config.prizeDistributionRules   – entryFeeCollectionPercentileDistributionRules
   * @param {Array}    config.trophyDistributionRules  – extraRewardsDistribution.trophiesDistribution.rules
   * @param {Array}    config.extraRankWiseRewards      – extraRankWiseReward
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

    // ── STEP 2: Integer prize pools ──────────────────────────────────────────
    const totalCoinsPrize    = registrationFeeCoins * totalEntries;
    const totalGemsPrize     = registrationFeeGems  * totalEntries;
    const totalGGPrize       = registrationFeeGG    * totalEntries;
    const totalTrophiesPrize = 0; // entry-fee trophies not implemented

    // ── STEP 3: Per-rank base allocations for each currency ──────────────────
    const baseCoinsAllocations    = computePercentilePrizeAllocations(
      totalPlayers, totalCoinsPrize,    prizeDistributionRules
    );
    const baseGemsAllocations     = computePercentilePrizeAllocations(
      totalPlayers, totalGemsPrize,     prizeDistributionRules
    );
    const baseGGAllocations       = computePercentilePrizeAllocations(
      totalPlayers, totalGGPrize,       prizeDistributionRules
    );
    const baseTrophiesAllocations = computePercentilePrizeAllocations(
      totalPlayers, totalTrophiesPrize, prizeDistributionRules
    );

    // ── STEP 4: Fixed trophies from extraRewardsDistribution ─────────────────
    const distributedTrophiesByRank = computeFixedRewardAllocations(
      totalPlayers,
      trophyDistributionRules,
      (rule) => rule.trophiesPerParticipant
    );

    // ── STEP 5: Merge everything into the final result rows ───────────────────
    return Array.from({ length: totalPlayers }, (_, index) => {
      const rank               = index + 1;
      const extraRankWiseReward = extraRankWiseRewards[index] || null;

      const coins = baseCoinsAllocations[index]
        + (extraRankWiseReward?.coins ?? 0);

      const gems = baseGemsAllocations[index]
        + (extraRankWiseReward?.gems ?? 0);

      const trophies =
        baseTrophiesAllocations[index]
        + (extraRankWiseReward?.trophies ?? 0)
        + (distributedTrophiesByRank[index] ?? 0);

      const gg = baseGGAllocations[index]
        + (extraRankWiseReward?.gg ?? extraRankWiseReward?.GG ?? 0);

      const physicalRewards = extraRankWiseReward?.physicalRewards || [];

      return { rank, coins, gems, trophies, gg, physicalRewards };
    });
  },
};