# Behavioral Finance Lab — project record

## Agreed direction

Build one portfolio project under the umbrella **Behavioral Finance Lab**. Avoid “Alpha” in the name: this project studies investor behavior and does not claim to generate investment alpha. Do not split related experiments into separate portfolio projects. Keep studies modular so each has its own question, operational definitions, intervention, outcomes, analysis plan, and limits.

### First study

**Study 01 — The Check-In Effect** remains the first working module. It is a proposed conceptual replication and extension of Bellemare et al. (2005), testing whether performance-feedback frequency affects investment choices, separately from how often a participant may change an allocation. The extension uses a fixed historical market path, continuous risky allocation, an equity-investor target population, and repeated state-response measures; novelty is not claimed for separating feedback and flexibility.

- Historical stimulus: the frozen January–December 2020 U.S. market-factor path in `../check-in-effect/market-returns-2020.json`.
- Design: proposed between-subject 2 × 2 random assignment (monthly/quarterly performance feedback × monthly/quarterly allocation opportunity).
- Primary outcome: risky-asset allocation at the common endpoint.
- Secondary outcomes: quarter-end allocations and state response ratings at identical checkpoints after the allocation decision.
- Status: proposed protocol and browser prototype only. No participants recruited; no human-subject data collected; no results or causal findings.
- Model: all arms use a constant target allocation with monthly rebalancing; decision frequency controls when the participant may revise that target. The demo shows interval return as primary feedback and cumulative index secondarily.

## Research process — follow in order

1. **Frame the question.** Write one primary research question and identify the decision or behavior it concerns. Do not start with a dashboard or a list of biases.
2. **Define constructs.** Distinguish latent psychological traits, momentary states, observed choices, beliefs, and outcomes. State exactly what each measure can and cannot establish.
3. **Operationalize before coding.** Specify treatment arms, unit of randomization, timing, primary/secondary outcomes, exclusions, manipulation/comprehension checks, and the estimand.
4. **Use evidence-based measures.** Prefer validated instruments where they fit; keep constructs separate. Pilot any new/adapted questions with cognitive interviews. Never create arbitrary weights or a composite “investor psychology score.”
5. **Isolate causal effects.** Randomize the intervention and hold other information constant. Avoid treatment combinations that create an unpowered factorial design. The public browser demo's client-side randomization is illustrative only; a real study needs balanced allocation and an approved data system.
6. **Validate stimuli and calculations.** Archive source, vintage, units, transformations, and hashes. Independently recompute key outputs. Keep the public demo's provenance transparent; for a confirmatory participant study, consider neutral labels and assess event recognition after primary decisions to limit priming.
7. **Plan the analysis before collection.** Define the primary estimand, model, missing-data/exclusion rules, uncertainty reporting, multiplicity, and power analysis. Do not select sample size, measures, or outcomes after seeing significance.
8. **Protect participants.** No financial advice, brokerage credentials, or claims to diagnose an individual. Obtain applicable Brandeis IRB review/determination before recruitment or identifiable data collection. Make consent, retention, deletion, and data-minimization plans explicit.
9. **Report honestly.** Separate prototype behavior, simulated outputs, pilot feasibility, and human-subject findings. State the sample and limits; do not generalize a small convenience sample to investors broadly.
10. **Only then expand.** Add one module at a time, with its own preregisterable protocol and powered outcome. Do not combine all behaviors and interventions in Study 01.

## Measurement guardrails

- **Overconfidence:** confidence alone is not enough. Elicit repeated probabilistic forecasts with resolved outcomes and compare confidence with accuracy/calibration; keep knowledge/ability separate from confidence.
- **Disposition effect:** use repeated sell/hold choices on gain and loss positions; measure realization propensity on winners versus losers. A single drawdown reaction is not this construct.
- **Herding:** randomize the presence/content of social-consensus information and measure the change from an independent-information/control condition.
- **Loss aversion:** distinguish loss aversion from general risk aversion and from the disposition effect. A single historical market loss cannot identify a loss-aversion parameter.
- **Risk calibration/decision quality:** do not call a higher return on one historical path “better decision quality.” Use objective calibration only for forecasts with resolvable outcomes; define any choice-consistency or goal-alignment measure separately.
- **Free-text rationale:** keep optional and secondary. Do not present LLM-coded explanations as validated psychological measurement without a coding rubric, human reliability checks, and validation.

## Later modules — ideas, not implemented or validated

- Information-presentation experiment: graph-only control versus loss scenarios, base-rate information, or a brief counterargument. Test as a separate study from the Study 01 feedback/decision-frequency factors unless power analysis supports the combined design.
- Confidence-calibration tasks with repeated forecasts and resolved outcomes.
- Gain/loss sell-or-hold tasks for a disposition-effect operationalization.
- Social-signal manipulation for herding.

## Current project files

- Portfolio entry: `../../index.html`
- Study 01 case: `../../cases/check-in-effect.html`
- Study 01 browser prototype: `../check-in-effect/index.html`
- Study 01 protocol/data notes: `../check-in-effect/README.md`

## Next work

1. Keep the portfolio entry and case page under **Behavioral Finance Lab**, retaining **Study 01 — The Check-In Effect** as its first module.
2. Finalize the study's participant population and measure choices; DOSPERT investment-domain items are a baseline candidate, while the prototype's “uneasy” slider is provisional. Evaluate a direct perceived-risk item and SAM-style valence/arousal measure without claiming validation before piloting.
3. Verify the frozen data file against its stated archive hash and independently validate all monthly portfolio calculations.
4. Refine the actual-study flow (balanced randomization, neutral stimulus labels, shared measurement checkpoints), then draft the preregistration and power-analysis inputs.
5. Do not deploy research data collection until the applicable ethics review is complete.
