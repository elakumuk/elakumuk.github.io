# The Check-In Effect — protocol notes

## Status

Research-design and interface prototype only. No participants have been recruited and no human-subject data have been collected. The browser demo uses an archived historical return sequence but stores no answers. It must not be described as evidence about investor behavior.

## Question

Does performance-feedback frequency change investors' terminal risky-asset allocation, and does this depend on how often they can revise that allocation?

## Design to develop

- Target population to lock before recruitment: U.S. adults who have personally held a stock or equity fund in the prior 12 months. If the pilot uses a student/convenience sample instead, label it as feasibility-only and make no retail-investor generalization.
- Between-subject randomized 2 × 2 factorial design.
- Factor A: monthly versus quarterly performance feedback.
- Factor B: monthly versus quarterly allocation-change opportunity.
- Identical underlying dated market-return sequence across all four cells; portfolio returns reflect each participant's selected risky-asset weight and a disclosed cash assumption.
- Stimulus: January–December 2020 monthly U.S. market factors from the 202608-vintage Ken French file. The exact 12 observations are frozen in `market-returns-2020.json`; percent units are converted in the return formula, not edited in the source values.
- For monthly excess market return `Mkt-RF`, one-month bill rate `RF`, and chosen risky weight `w ∈ [0,1]`, portfolio return is `RF + w × (Mkt-RF)`. This represents a market portfolio plus Treasury-bill allocation, with a monthly rebalance whenever a decision is allowed. It is a hypothetical simplification: no fees, taxes, spread, or behavioral execution frictions.
- Source definition: market factor is the value-weighted return of eligible U.S.-incorporated CRSP firms listed on NYSE, AMEX, or NASDAQ, less the one-month Treasury-bill rate. The library notes RF source changes after May 2024; the 2020 history predates that switch. Cite the dataset vintage because historical values may be revised.
- Avoid event-name priming in a confirmatory study: present neutral month labels and no COVID headlines, then ask about recognition/familiarity after the primary choices and debrief participants. The public portfolio demo discloses the year for transparency and is not itself a controlled experiment.
- Hypothetical allocation choices only; no real funds or brokerage accounts.

## Outcomes and hypotheses

- Primary endpoint: risky-asset allocation at the common 12-month endpoint.
- H1: More frequent feedback reduces terminal risky allocation, averaged across decision-frequency assignments.
- Secondary: state perceived risk and unease after the allocation decision at shared quarter-end checkpoints (same number and timing of measurement prompts in all cells); allocation at shared quarter-end checkpoints; feedback-by-decision-frequency interaction.
- Baseline context: investment experience and prior market-checking frequency. Candidate trait measure: the published DOSPERT Financial Investment domain, keeping risk-taking likelihood distinct from perceived risk and expected benefit. This baseline is not a substitute for observed choice.
- Candidate state measures: a direct perceived-risk item plus a brief valence/arousal measure informed by the Self-Assessment Manikin (SAM). The prototype's current “uneasy” slider is provisional, not the validated SAM; finalize exact instruments and use after checking applicability, rights, and pilot comprehension.
- DOSPERT source: Weber, Blais, & Betz (2002), https://doi.org/10.1002/bdm.414. SAM source: Bradley & Lang (1994), https://doi.org/10.1016/0005-7916(94)90063-9. Confirm scale fit and permissions before the study; do not silently shorten or relabel validated items.
- Do not create a composite “psychology score” or apply hand-selected weights. Any scale/composite needs a defined construct, item rationale, pilot evidence, and appropriate reliability/validity analysis.
- Emotional response is not randomized. Mediation analyses, if any, remain exploratory and do not establish a causal mechanism by themselves.

## Statistical plan to preregister

Estimate the intention-to-treat feedback-frequency effect on terminal risky allocation using a factorial model with feedback assignment, decision-opportunity assignment, and their interaction. Report the marginal feedback contrast, interaction, uncertainty intervals, allocation distributions, attrition, and manipulation/comprehension checks. Specify coding, missing outcomes, exclusions, covariates, and multiplicity handling before observing study outcomes. Use a pilot to estimate feasibility and variance; set the final sample size via a power analysis for the primary contrast and separately assess power for the interaction. Do not choose sample size after looking for significance.

## Before recruitment

1. Re-download the official source archive and verify its SHA-256 against `market-returns-2020.json`; independently recompute all 12 portfolio values from the documented formula.
2. Finalize exact feedback/decision timing and ensure no-feedback periods do not leak market information through charts, labels, or notifications.
3. Draft participant consent, eligibility criteria, and debrief; obtain determination/review under applicable Brandeis IRB requirements.
4. Cognitive-interview survey wording, pilot randomization and all four cells, test accessibility and mobile behavior, then preregister hypotheses and analysis.
5. Implement research data capture only after approval, with explicit consent, data minimization, retention/deletion plan, and no sensitive financial-account data.

## Current prototype

`index.html` / `app.js` demonstrate one randomly assigned condition per run using the frozen 2020 data. Answers remain in memory and are neither stored nor transmitted. It is not a survey instrument or participant study. The market series and cash assumption are not a recommendation or a forecast.
