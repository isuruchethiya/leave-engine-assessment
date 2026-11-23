# Part C

## 1. Which rules were ambiguous or underspecified?

I emailed Mr. Madushan on 22 Nov, got no reply, and used my own reading each time.

- **Leave after the last working day.** E003 has leave on 10 Sep, but their last day is 15 Aug. I treat it as invalid. Real ticket: can leave be approved after the last working day at all?
- **Last working day mid-month.** Credit lands on the month's last calendar day, so a month ending after the last working day gets nothing. Real ticket: should that partial month be pro-rated like probation?
- **Probation end.** I took `join_date + probation_months` as the last probation day. Real ticket: is that day inside probation or outside it?
- **Same-day ordering.** `--as-of` is inclusive, and leave on a month-end gets that day's credit. Real ticket: does the credit land before or after that day's leave?

## 2. Where does it break at 50,000 employees and 2 million records?

The first thing to give way is `processLeave`. It filters the whole records list once per employee: 50,000 x 2,000,000, about 100 billion comparisons. I have not measured it, but it would be unusable long before that size.

Second, both CSVs are read fully into memory and parsed with a hand-written `split(",")`. That is fine for 12 rows, not for millions.

Third, accrual is recalculated for every record, looping over every month since the join date.

Fix for the first: group records by employee id once in a Map and sort each group once. In a real system the database would do this.

## 3. Where did I use AI, and where did it get it wrong?

I used AI to explain the spec, draft the accrual and leave code, check my hand calculations, and draft the README and this document.

It got three things wrong:

- It said Sunil's balance was -0.5. November pro-rata gives 0.58, so it is 0.08. My program's output did not match, so I recalculated by hand.
- It gave me `cd %TEMP%`, which fails in PowerShell, so my clean clone landed inside my project folder.
- For a compile error it guessed a missing semicolon. The real cause was typos from my paste.

I kept `EPSILON` and the sort comparator without understanding them at first. I now understand them (floating-point error at the -2.0 boundary; order by date, then record id), but I did not write them. I am also less sure of rules 4 to 6 than of accrual.

## 4. Two more days: what first?

I would fix the performance problem from question 2 first: group the records by employee once. It is the only thing here that fails outright at scale. The other items only give a wrong answer in edge cases, and Mr. Madushan's reply could settle most of those anyway. After that I would add tests for same-day ordering and for leave on the last working day itself, since those are the assumptions I am least sure about.

## 5. Which piece of my code am I least happy with?

`processLeave`. It recalculates accrual from scratch for every record just to get the balance at that moment. It works and the output matches my hand calculations, but it is wasteful, and I find it hard to explain line by line. The `EPSILON` guard sits in the same function. With more time I would keep a running balance and apply accrual as I walk through the dates.
