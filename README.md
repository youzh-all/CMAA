# CMAA — Cultivation Master–Apprentice Agent

English-first research interaction workspace for eliciting, reviewing, and preserving Master-grounded Composite Crop-State Indicator knowledge.

## Current scope

- English interface by default, with a persistent top-right Korean toggle
- Master-first dialogue before candidate display
- Clickable CMAA prompts and free-text Master responses
- Candidate review decisions: retain, revise, split, merge, reject, defer
- Browser-local saved review outputs for prototype evaluation
- No raw CEA data, credentials, automatic crop-status scoring, or action recommendations are deployed

## Planned secure integration

```text
Vercel UI → authenticated review service → 2222 CMAA runner
```

The 2222 runner will provide CaseEpisode packets, source-linked claims, evidence mapping, versioned Composite Crop-State Indicator Specifications, calculation QC, and append-only provenance.
