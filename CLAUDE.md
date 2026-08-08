# CLAUDE.md — MAIN RULES (Aug 8 2026, Daya-approved)

## 🔴🔴🔴 CARDINAL RULE: NEVER COPY / SYNC UAT → LIVE

1. UAT and LIVE are DIFFERENT. UAT = mock/test. LIVE = real, all working.
2. **NEVER sync or copy files from UAT to LIVE** — no `cp`, no `rsync`, no branch merge, no folder copy, NO WAY.
3. **ALWAYS test only in UAT first.** After Daya approves → **READ the UAT changes** (diff) → **manually re-apply THOSE changes in LIVE** with direct edits. No copy.
4. **NEVER deploy without Daya explicitly saying ok/approve/deploy.**
5. WHY: UAT is a mock — copying UAT files to LIVE gave LIVE the same mock files and broke the real site.

## This is the UAT folder

- Everything here is TEST/MOCK. Deploy to UAT only: `npx wrangler pages deploy . --project-name saubhagyajewellery --branch uat`
- UAT_MODE=true guards real services (WhatsApp/email/ShipPrime blocked)
- After UAT verified + Daya approves → manual edit in LIVE folder, NEVER copy

## NEVER DO

- Copy UAT files to LIVE folder (`C:\Users\Daya\Documents\GitHub\saubhagyajewellery\`)
- `git push` to LIVE without Daya's explicit "ok"/"approve"/"deploy"
- `npm run build` (regenerates curated files — edit files directly)

## Communication

- Hinglish, aap/tumhara (never tu/tere)
- Report with evidence (facts, not assumptions)
- After UAT change: STOP, show, WAIT for approval
