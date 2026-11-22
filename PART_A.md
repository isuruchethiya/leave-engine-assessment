# Part A: Defects

I found six problems. They're in order of how much they matter, worst first. Each fix is its own commit, so you can read them one at a time.

## 1. Query with no company_id (HIGH)

**What's wrong:** When no status is passed, the `else` query doesn't filter by `company_id`. It returns leave rows for every company in the database.

**What a user sees:** An HR person at one company opens the leave report and sees names and leave dates of another company's employees.

**Severity:** High. Private data leaks to people who shouldn't see it, and you can't undo that. It hurts the employees whose data leaked, and the company (legal trouble, clients leaving). I put this first because the other bugs give wrong numbers or slow pages, but this one exposes real people's data.

**Prevention:** A test with two companies' data that checks only the requested company comes back, for both the status and no-status paths. In review, check every query on a multi-tenant table for `company_id`. Even better, build the query once so the `company_id` condition can't be forgotten in one branch.

## 2. totalDaysTaken skips the first row (HIGH)

**What's wrong:** The loop starts at `i = 1`, but arrays start at 0, so the first row is never added.

**What a user sees:** Every total is too low by the first leave's days. No error shows up, and the number looks believable, so nobody notices.

**Severity:** High. Wrong numbers that look right are dangerous. Anyone who trusts the totals is affected (employees and HR).

**Prevention:** A unit test with a known list (3, 1, 2 should give 6). Using `for...of` or `reduce` avoids this kind of mistake completely.

## 3. Rejected and pending leave counted as taken (MEDIUM)

**What's wrong:** `totalDaysTaken` adds up every row, whatever its status.

**What a user sees:** A rejected request still counts as taken, so the employee's remaining balance looks lower than it should be.

**Severity:** Medium. Wrong numbers, but it only affects rows that aren't approved, so it's less widespread than bug 2.

**Assumption:** I treated "taken" as approved only. On a real ticket I'd check this with whoever owns the feature.

**Prevention:** A test with one row of each status. A clearer function name (like `totalApprovedDays`) would also make the intent obvious.

## 4. Leave ending on the last day is dropped (MEDIUM)

**What's wrong:** The query uses `end_date < to`. If a leave ends exactly on the `to` date, it's excluded. I changed it to `<=`.

**What a user sees:** A March report (to = 2026-03-31) is missing any leave that ends on 31 March. No warning, it just isn't there.

**Severity:** Medium. Incomplete reports for HR.

**Assumption:** I assumed `to` is inclusive. I would confirm this on a real ticket.

**Prevention:** Boundary tests (leave ending exactly on `from` and on `to`), and a comment on the function saying whether the range is inclusive.

## 5. A database query inside a loop (MEDIUM)

**What's wrong:** The department name was fetched one row at a time inside a loop. 500 leave rows meant 501 queries (the classic N+1).

**What a user sees:** The report loads slowly, and gets slower as the company grows. Since the database is shared, it can slow down other companies too.

**Severity:** Medium. The data is correct, it's just slow, and it gets worse with scale.

**Fix:** I get the department in the main query with a `LEFT JOIN`. I used LEFT (not a plain JOIN) so a leave row isn't dropped when the employee has no department. It shows "Unknown" like before.

**Prevention:** Don't call the database inside a loop (easy to catch in review). Counting queries per request in a test would also catch it.

## 6. `as any` and missing type (LOW)

**What's wrong:** `(row as any).department` switches off TypeScript's checking, and `LeaveRow` had no `department` field.

**What a user sees:** Nothing directly. But it hides future mistakes (typos, wrong types) until they break in production.

**Severity:** Low. It only affects developers and maintenance.

**Fix:** Added `department: string` to `LeaveRow`. The `as any` disappeared when I removed the loop.

**Prevention:** A lint rule that bans `any` (`no-explicit-any`).

## Things I noticed but did not fix

- **Overlapping leave is missed.** The filter `start_date >= from AND end_date <= to` only returns leave fully inside the range. A leave from 30 March to 2 April won't show in a March report. The right condition would be `start_date <= to AND end_date >= from`. I left it because it changes what the function means, so it needs a decision from the product side.
- **`SELECT lr.*`** pulls every column. Picking only the ones needed would be cleaner. Low priority.