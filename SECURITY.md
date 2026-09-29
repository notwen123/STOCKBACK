# Security

**Status: hackathon MVP. Not audited. Testnet / demo only.** Do not deploy with real assets or real user funds.

Report issues privately: open a GitHub security advisory on this repository (Security tab → *Report a vulnerability*). Please include a Foundry test that reproduces the issue.

## Security model in one paragraph

The **attester** is trusted for *authenticity*: it vouches that a purchase happened. The **verifier** only checks that an allowlisted attester signed exactly this claim, and returns yes or no. The **registry** enforces replay protection, claimant binding and domain separation, and it is the only contract allowed to consume reward caps or spend budget. **Policies** bound how much any claim, user or brand can earn per day. The **pool** can only pay out what sponsors deposited. **Brand vaults have no admin at all**, so once shares are minted, only their holder can redeem the assets. A compromise of the attester, the verifier or the owner is therefore bounded by the caps and the unallocated budget, and never reaches existing user holdings.

## Review checklist

Every item has a test. File names are under `test/`.

| Risk | Mitigation | Test(s) |
|---|---|---|
| Reentrancy | `nonReentrant` on `submitClaim` and `fundWithUSDG`; nullifier burned **before** external calls (CEI) | `Security.test_reentrancyThroughAssetHook_blocked` |
| Access control | OZ `Ownable` on all config; `consume` / `allocate` restricted to the registry | `*.test_onlyOwner*`, `RewardPolicy.test_consume_onlyRegistry`, `RewardPool.test_allocate_onlyRegistry` |
| Verifier authority | `IReceiptVerifier.verify` is a `view` bool; verifier address has no role anywhere | `Security.test_verifierAddress_cannotAllocateOrConsume`, `Security.test_compromisedVerifier_boundedByCapsAndBudget` |
| Signature replay (cross-chain / cross-deployment) | EIP-712 domain = name, version, `chainId`, registry address; OZ `EIP712` rebuilds the separator if the chain forks | `Security.test_crossChainReplay_rejected`, `Security.test_crossDeploymentReplay_rejected` |
| Signature malleability | OZ `ECDSA.tryRecover` rejects high-s; Stylus uses `verify_strict`; Solidity Ed25519 twin rejects S ≥ L | `Security.test_highS_malleableSignature_rejected`, Rust `rejects_tampered_digest_sig_and_length`, `benchmarks/.../test_solidityEd25519_rejectsTampering` |
| Claim replay / nullifier reuse | `nullifier = keccak(tag, merchantId, receiptHash)`, independent of claimant, amount, brand and deadline | `ReceiptCommitmentRegistry.test_duplicateClaim_rejected`, `test_reusedNullifier_withAlteredFields_rejected`, `testFuzz_nullifierIndependentOfClaimantAmountDeadline`, `Integration.test_sameReceiptCannotCrossBrands`, `Invariant.invariant_noReplay` |
| Front-running a claim | `claimant` is signed and must equal `msg.sender`, so a copied attestation is useless | `ReceiptCommitmentRegistry.test_wrongClaimant_rejected` |
| Field tampering | Signature covers every claim field | `test_tamperedAmount_rejected`, `test_malformedAttestation_rejected` |
| Expiry / deadline | `block.timestamp > deadline` rejects; `purchasedAt` must be in the past and within `maxPurchaseAge` | `test_expiredClaim_rejected`, `test_deadlineBoundary_accepted`, `EligibilityPolicy.test_purchaseAge` |
| Zero address / zero amount / empty fields | Constructor and setter guards; `Malformed` status | `test_emptyFields_rejected`, `test_zeroAddress_setters_revert`, `RewardPool.test_fund_rejectsZeroAndUnknownBrand` |
| Integer overflow / precision | Solidity 0.8 checked math; reward via 512-bit `Math.mulDiv`; config bounds on rate and multiplier; rounding down; zero rewards rejected | `RewardPolicy.testFuzz_rewardBoundedAndMonotonic`, `test_roundsDownToZero_rejected`, `test_formula_exact` |
| Max caps | Per-claim cap clips; daily user and brand caps **reject**, so the receipt is not burned | `test_perClaimCap_clips`, `test_dailyUserCap_enforced_andResetsNextDay`, `test_dailyBrandCap_enforced`, `Invariant.invariant_dailyCaps` |
| Reward budget exhaustion | Budget tracked in storage; registry pre-checks, pool re-checks; donation cannot inflate it | `RewardPool.test_budgetExhaustion_rejects_thenRecovers`, `test_donation_doesNotInflateBudget`, `Invariant.invariant_poolBalanceEqualsBudget`, `invariant_conservation` |
| ERC-4626 inflation / first depositor | `_decimalsOffset() = 6` (OZ v5 virtual shares) | `BrandVault.test_inflationAttack_unprofitable` |
| Vault share accounting | Plain OZ ERC-4626, no custom accounting | `BrandVault.testFuzz_depositRedeem_roundTrip`, `Invariant.invariant_vaultSolvent`, `invariant_conservation` |
| Oracle staleness / bad price | `answer > 0`, `block.timestamp - updatedAt ≤ oracleStaleAfter` (Wield pattern) | `USDGRewardAdapter.test_staleOracle_reverts`, `test_nonPositivePrice_reverts` |
| Slippage / MEV on USDG funding | `minOut` from oracle × (1 − `maxSlippageBps`), hard 10% ceiling (Wield pattern) | `USDGRewardAdapter.test_slippage_reverts`, `test_admin` |
| Wrong DEX ABI | SwapRouter02 struct (no `deadline`), verified against deployed router bytecode | `USDGRewardAdapter.test_routerSelector_isSwapRouter02` |
| Pause | Registry pause blocks new claims only; redemptions and budget withdrawal still work | `test_paused_blocksClaims_thenResumes`, `BrandVault.test_rewardedUser_redeemsWhileRegistryPaused` |
| Emergency | Owner can withdraw **unallocated** budget; vault assets are unreachable | `RewardPool.test_emergencyWithdrawBudget_leavesUserSharesIntact` |
| Mock assets reaching production | Every mock reverts on chain 4663 / 42161; demo deploy script allows only 31337 / 46630 / 421614 | `Security.test_mocks_refuseProductionChains` |
| Duplicate vaults | Factory mapping check + CREATE2 salt = brandId | `BrandVaultFactory.test_duplicate_reverts`, `test_address_isDeterministicCreate2` |
| Upgradeability | None. No proxies. Config changes are explicit owner calls with events. | n/a |
| PII on-chain | Only hashes, amount, currency and timestamps; salted receipt hash (see `docs/PRIVACY.md`) | `Security.test_onChainClaimRecord_isHashOnly` |
| DoS / griefing | No unbounded loops in the claim path; a failed claim leaves no state; view-only verifiers never revert on bad input | Rust tests, `test_malformedAttestation_rejected` |

Suites: 83 Solidity tests, including 3 fuzz tests at 1,000 runs and 5 invariants at 128 runs × 64 calls; 5 Rust tests (incl. all 100 shared benchmark vectors); 4 benchmark correctness and gas tests.

## Known, accepted risks

1. **Admin key.** A single owner configures the verifier, policies and caps, and can withdraw unallocated budget. There is no timelock or multisig in the MVP. In production, use a multisig plus a timelock on `setVerifier`, `setRewardPolicy` and `setEligibilityPolicy`.
2. **Attester trust.** Authenticity is exactly as good as the attester. The demo attester (`tools/attester.mjs`) trusts its input. A real attester must verify the purchase with a merchant or payment API before signing.
3. **Sybil resistance is partial.** Nullifiers stop the *same receipt* being claimed twice. They do **not** prove one human per wallet. MVP controls are per-wallet daily caps, per-claim caps, brand caps, budgets, and the optional `IJurisdictionPolicy` KYC adapter. Someone with many wallets **and** many genuinely attested receipts can still earn many capped rewards. That is bounded by the attester's own identity checks.
4. **Cross-deployment nullifiers.** Nullifiers are per registry. The attester must not sign the same receipt for two deployments. Signatures are domain-bound, so this is the attester's responsibility.
5. **`rateWad` is a sponsor-set conversion, not a market price.** Brand vault value is whatever the underlying asset is worth.
6. **Oracle assumption.** The USDG adapter treats 1 USDG as 1 USD, as Wield did.
7. **Stylus verifier** is unaudited Rust built on `ed25519-dalek` 2.x. Its correctness is tested against 100 signatures produced by Node's RFC 8032 implementation, the same vectors the Solidity twin accepts.

## Finding in the upstream Wield code (informational)

Wield's `ISwapRouter` uses the original Uniswap V3 `SwapRouter` struct, which includes `deadline` (selector `0x414bf389`). The router configured for Robinhood Chain mainnet, `0xCaf681a66D020601342297493863E78C959E5cb2`, does not contain that selector in its bytecode. It contains the SwapRouter02 selector `0x04e45aaf`. We checked this against deployed bytecode on 2026-09-28. Wield `Vault` stock buys and sells through that router would therefore revert. STOCKBACK's adapter uses the SwapRouter02 layout. Report this to the Wield maintainers if their vaults are live.

## Security patterns adapted from Wield (MIT)

Oracle freshness and positivity checks, oracle-derived `minOut` with a hard slippage ceiling, pause-new-actions with exits always available, chain-id deployment guards, and OZ ERC-4626 virtual-share inflation protection. See `docs/MIGRATION_AUDIT.md`.
