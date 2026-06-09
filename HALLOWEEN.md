# Halloween Night — Canonical Plan

> Locked. Do not re-litigate without an explicit call from LaVar.

## The arena is laser tag.

Real-world rental: laser tag gear + inflatable cover. Final 4 of the night play
the round in person at a chosen venue. Last team / individual standing wins
the Arena Victor cash prize. Top Capitol Bettor wins the second cash prize.

## Order of events on the night

| # | Phase | Who acts | What happens | App page |
|---|---|---|---|---|
| 1 | Doors | Everyone | All ~20 arrive. Final 6 from end-of-W5 are present. | n/a |
| 2 | **Meter phase** | Capitol + Slums | Fill credit meters on Final 6 by spending credits. This is both a vote (who advances) and a bet (largest spend on actual winner = Top Capitol Bettor). | `/meter/{slug}` *(not yet built)* |
| 3 | TV-clock cutoff | — | Meters lock. Bottom 2 meters cut → spectators. **Top 4 advance.** | `/meter` shows final standings |
| 4 | **🔒 CREDIT FREEZE** | — | All credit transactions halt. Tribute balances locked. | Admin flips `event_state` flag |
| 5 | Arena reveal | Announcer | "It's laser tag." Big-screen drama. | Optional: `/arena` reveal slide |
| 6 | **Loadout phase** (~15-20 min) | The 4 finalists | Each spends their **own remaining credits** in the Loadout Shop. | `/loadout/{slug}` |
| 7 | Loadout cutoff | Announcer | Final 4 inventories locked. | Admin flips `event_state` flag |
| 8 | Arena | Final 4 | Play with their bought equipment. Last team/person standing wins. | Real world |
| 9 | Prize ceremony | LaVar | Arena Victor cash. Top Capitol Bettor cash. | n/a |

## Loadout items

Final 4 finalists spend their accumulated credits (5 weeks of earnings) on
arena gear. All purchases recorded; balances deducted per buy.

| Item | Cost | Effect | Max per tribute |
|---|---|---|---|
| Inflatable Cover | 75 cr | One extra blow-up obstacle at starting position | 4 |
| Stealth Hood | 100 cr | Dark hood/cloak during the round | 1 |
| Smoke Grenade | 50 cr | One-time throwable that creates visual disruption | 3 |
| Extra Life | 200 cr | One respawn — back in 30 sec after elimination | 2 |
| **Capitol Ally** | **300 cr** | A citizen joins your team for the round | 2 |
| Power Vest | 100 cr | Reduces your hit-zone (if rental gear supports it) | 1 |

### Capitol Ally rules

- The ally can be **anyone** present at the party — Capitol, Slums, or even a non-playing guest
- Ally must agree to play. The finalist asks them in person. If refused, refund.
- Ally is **pure loyalty** — they get nothing material if their finalist wins.
  They get to play laser tag and be on the winning team. That's the whole reward.
- A finalist can buy up to 2 Capitol Allies (8-person max arena round).

## Credit accounting

- `hg_tributes.credits` = the tribute's current spendable balance
- During Halloween night, ONLY the 4 finalists can spend credits (after the
  freeze + reveal). Their `credits` column is decremented on each loadout buy.
- `hg_loadout_purchases` records every buy with `cost_at_purchase` so we can
  reconstruct the loadout for the admin / arena briefing screen.
- Capitol's spending on meters during step 2 uses `hg_meter_bets` and also
  decrements `hg_tributes.credits` for the bettor.

## Top Capitol Bettor

The Capitol/Slums citizen who spent the most credits during the **meter phase**
on the tribute who actually wins the arena = Top Capitol Bettor. Cash prize.

## What's intentionally NOT in this plan

- **No live betting during the arena round.** Once the round starts, the
  Capitol economy is over. Spectators just watch.
- **No bracket / multi-round arena.** One round. One winner.
- **No Halloween-night earn-credits opportunities.** Whatever you arrive with
  is your pot.

## Schema touched

- New table `hg_loadout_items` — item catalog (seeded with the 6 items above)
- New table `hg_loadout_purchases` — per-tribute purchase log
- New table `hg_event_state` — gamemaker controlled flags (`credit_freeze`, `loadout_locked`)
- Existing `hg_tributes.credits` — mutated on loadout buys
