# Leave engine (Mira take-home)

A small CLI that works out annual leave balances for one company as at a given date, and lists the leave records it had to reject. TypeScript, Node 20+, `strict` on, no frameworks.

## Running it

```
npm install
npm test
npm start -- --company 1 --as-of 2026-11-30
```

I ran exactly these from a fresh clone of the public repo and they work. `npx tsc --noEmit` is clean too. Everything runs through `tsx`, so there is no build step.

The three CSV files are in the repo root, exactly as given in the brief, and the program reads them from there.

For company 1 you should get:

| employee_id | name | accrued | taken | balance |
|---|---|---|---|---|
| E001 | Nimal Perera | 34.13 | 3.50 | 30.63 |
| E002 | Kamala Silva | 5.19 | 2.00 | 3.19 |
| E003 | Ruwan Fernando | 25.12 | 0.00 | 25.12 |
| E005 | Sunil Bandara | 0.58 | 0.50 | 0.08 |

and four invalid records: L003 and L011 (public holidays), L007 (would go below -2.0) and L008 (after Ruwan's last working day). Company 2 gives just Dilani (11.69 / 1.00 / 10.69) and no invalid records. Her L010 is fine: her probation hasn't ended in March, so she's at -1.0, which is inside the floor.

## How the code is laid out

- `src/accrual.ts` works out accrued days up to a date (rules 1, 2, 3, 7)
- `src/leave.ts` goes through one employee's records in date order and decides which are valid (rules 4, 5, 6, plus the last-working-day check)
- `src/scope.ts` keeps only one company's employees and their records (rule 8)
- `src/csv.ts` reads the files, `src/main.ts` parses arguments and prints the tables
- `src/leaveService.ts` and `src/db.ts` belong to Part A. `db.ts` is only a stub so the project type-checks, because the brief says to assume `db.query` exists. The CLI never touches either of them.

Part A notes are in `PART_A.md` and each fix is its own commit. Part C is in `PART_C.md`.

## Questions I sent, and what I assumed

On 22 November I emailed Madushan four questions about rules I found unclear. I haven't had a reply, so I went with my own reading in each case. If an answer comes back different, the change is small and lives in three places: the probation-end comparison and the `daysAfter` line in `accrual.ts`, and the last-working-day check in `leave.ts`.

1. **Leave after the last working day.** Rule 7 only talks about accrual stopping. I treat leave dated after the last working day as invalid. That is what catches Ruwan's L008 (10 Sept, his last day is 15 Aug).
2. **Last working day in the middle of a month.** Accrual is credited on the last day of the month, so if someone leaves on 15 August, the 31 August credit never happens. Ruwan's last accrual is 31 July. (Also note his resignation date, 30 Sept, is not the same thing and I don't use it for anything.)
3. **When probation ends.** I take `join_date + probation_months` as the last day of probation, so the pro-rata for that month counts the days strictly after it. For Nimal (joined 15 Jan, 3 months) probation ends on 15 April and April gets 15/30 of 1.75. If it were meant as the first day after probation, every pro-rata figure moves by one day's worth.
4. **`--as-of` is inclusive.** With `--as-of 2026-11-30`, the credit dated 30 November counts. Leave records dated after the as-of date are ignored entirely.

## Other things I had to decide

- **Same-day ordering.** If a leave record falls on the exact day an accrual is credited, I count that credit first. This only matters for the -2.0 check and nothing in the data hits it, but I wanted it to be a deliberate choice rather than an accident.
- **Sunil's L009 (25 Nov, half day).** His probation ended 20 Nov, so November is a pro-rata month, but the credit only lands on the 30th. At the time of the leave his balance is 0, the half day takes it to -0.5, which is inside the floor, so it's valid. By 30 Nov he has 0.58 accrued and 0.5 taken.
- **Exactly -2.0 is valid**, anything lower is not. Because pro-rata figures are fractions, I compare against the floor with a tiny epsilon so floating point noise can't reject a record that sits exactly on -2.0.
- **Ordering inside a day.** Records are processed by date, and by record id if two share a date.
- **Rounding** is for display only (two decimals, half-up). Nothing is rounded in between. Nimal's 34.125 prints as 34.13.
- **Leave type** is read but ignored. Every record in the data is ANNUAL.
- **CSV parsing** is a plain split on commas. There are no quoted fields in the data, so I didn't build for them. The header in the PDF wraps `last_working_day` across two lines, which I took as a formatting artefact.
- **Invalid records only show up for the company being run.** Dilani's L010 never appears in a company 1 run, not even as an invalid row.

## Tests

Four tests in `test/rules.test.ts`. I picked the first three because they are where I thought a wrong answer was most likely, or most expensive:

- **Rule 4, the floor.** Kamala has three full days of leave against almost no balance. The first two should land exactly on -2.0 and be accepted, the third should be rejected. Boundary conditions with fractional numbers are where this kind of code usually goes wrong.
- **Rule 7, last working day.** The brief points out that it isn't the resignation date, so it's easy to wire up the wrong field. The test checks that Ruwan's accrual is 7.0 days lower with his last working day than without, and that L008 is rejected.
- **Rule 8, company scoping.** A leak of another company's employees is the same class of bug as the worst one in Part A, so I wanted it pinned down. The test checks that neither the employees nor their records (L010) come through for the wrong company.
- **Rule 3, pro-rata** (bonus). Nimal's accrual up to 30 June 2025 should be 4.375. This is the off-by-one risk from question 3 above, written down as a number.

## What I didn't do

I didn't attempt the stretch rules, 9 (weekends) and 10 (carry-over). One thing worth knowing: L004 for Nimal is dated 14 March 2026, which is a Saturday, so with rule 9 it would become invalid and his taken days would drop from 3.5 to 2.5.

## Where I used AI

I used Claude through most of this, for talking through the rules, drafting code and checking my hand calculations. I've written up where it got things wrong in `PART_C.md` (question 3).
