## Problem Statement

Dentshift is used as if it belongs to one dentist, but the next dentist must be able to log in without seeing Parinda’s money, banks, schedules, or works. Today banks, works, and most list/dashboard queries are global. Places should stay a shared hospital catalog. A second dentist must get an empty private world plus that catalog. A buggy API must not be able to read another dentist’s private rows. There is no invite product yet — new dentists are inserted in the database by hand.

## Solution

Every dentist login is an isolated owner of banks, schedules, and works. Places remain one shared catalog: any dentist can see and edit every Place (including hours, tax, and remark); delete is blocked if any dentist still has a schedule or work on that Place. Existing data is Parinda’s (`daparindada@gmail.com`). The home screen and all private lists show only the logged-in dentist. Isolation is enforced in the application **and** with Postgres RLS. Cross-dentist inspection is SQL (or another bypass role), not an in-app god view.

## User Stories

1. As Parinda, I want all of today’s banks, works, schedules, and dashboard numbers to stay mine after the split, so that I do not lose my live history.
2. As Parinda, I want to keep using my existing login (`daparindada@gmail.com`), so that I do not have to re-register.
3. As a newly inserted dentist, I want to log in and see none of Parinda’s banks, works, schedules, or money, so that her practice stays private.
4. As a newly inserted dentist, I want to see the full Place catalog (including hospitals Parinda already entered), so that I can book the same clinics without retyping them.
5. As a dentist, I want my bank list to show only my payout accounts, so that I never pick or see someone else’s bank.
6. As a dentist, I want to save an account number another dentist already uses, so that two people can be paid into the same real-world account without colliding.
7. As a dentist, I want the same account number to be unique **inside my own list**, so that I do not accidentally duplicate my own bank row.
8. As a dentist, I want my schedule list to show only my bookings, so that I cannot see another dentist at the same Place on the same date.
9. As a dentist, I want to book the same Place on the same date as another dentist, so that clinic days are not globally exclusive.
10. As a dentist, I want my works list to show only my works, so that deposits and amounts stay private.
11. As a dentist, I want a work to attach only to **my** schedule and **my** bank, so that I cannot hang money off someone else’s rows.
12. As a dentist, I want the home dashboard (counts, DF guarantee, waiting deposits, places worked, charts) to use only my rows, so that I do not see another dentist’s income.
13. As a dentist, I want Place pickers (list and master) to show every Place, so that the catalog is truly shared.
14. As a dentist, I want creating a Place to add it to everyone’s catalog, so that the next dentist can pick it.
15. As a dentist, I want editing a Place (name, branch, location, tag, hours, tax, remark) to change it for everyone, so that there is one clinic truth.
16. As a dentist, I want renaming a Place to show the new name on everyone’s old schedules, so that history follows the shared catalog.
17. As a dentist, I want deleting a Place to fail while any schedule or work (any dentist) still points at it, so that history cannot be destroyed.
18. As a dentist, I want deleting a Place with no remaining schedules or works to succeed, so that unused catalog rows can be cleaned up.
19. As a dentist, I want two Places with the same name and branch to be allowed, so that messy real-world duplicates can exist and I pick by id.
20. As a dentist, I want unauthenticated requests to private data to be rejected, so that banks, works, schedules, and dashboard numbers are not public.
21. As a dentist, I want opening another dentist’s bank, schedule, or work by id to fail as not found / forbidden, so that guessing ids does not leak data.
22. As Oakko, I want to insert a `users` row in the database and have that person log in as a dentist, so that I do not need an invite UI.
23. As Oakko, I want no in-app admin that lists every dentist’s private data, so that the product stays dentist-scoped.
24. As Oakko, I want a database bypass (SQL / privileged role) that can read all tenants, so that I can debug without a hidden admin screen.
25. As Oakko, I want a missed `WHERE dentist = me` in the API to still return only the current dentist’s private rows, so that RLS is the last wall.
26. As a dentist, I want push subscriptions to stay tied to my user, so that I am not notified about another dentist’s schedules.
27. As a dentist, I want creating a schedule to stamp it as mine, so that it never appears as an orphan in the shared pile.
28. As a dentist, I want creating a bank to stamp it as mine, so that the next dentist does not inherit it.
29. As a dentist, I want creating a work to stamp it as mine (or inherit my schedule’s owner), so that money rows cannot float unowned.
30. As Parinda, I want existing schedules that have a null owner to become mine during migration, so that nothing is left globally visible.
31. As a dentist, I want bank master dropdowns used on work forms to list only my banks, so that I cannot attach someone else’s payout account.
32. As a dentist, I want schedule master dropdowns used on work forms to list only my unused/available schedules, so that I cannot attach to someone else’s day.
33. As a dentist, I want pagination totals on private lists to count only my rows, so that page counts do not leak how much work another dentist has.
34. As a dentist, I want deleting my bank to be blocked or fail cleanly if my works still reference it, so that my own money history stays consistent (other dentists’ banks are irrelevant to me).
35. As a dentist, I want deleting my schedule to fail or cascade only within my data, so that I cannot delete another dentist’s day.
36. As Oakko, I want Places to have no owner column, so that the catalog is not accidentally filtered per dentist.
37. As a dentist, I want logging in to be the only way to become “me” for the data wall — no dentist-id query parameter I can spoof.
38. As Oakko, I want healthcheck and auth tables to keep working without becoming dentist-owned business data, so that login and ops are not broken by RLS.

## Implementation Decisions

- **Owner model.** A dentist is a Better Auth `users` row. Private tables carry a required owner foreign key to that user: `banks.user_id`, `schedules.user_id` (no longer optional), and `works.user_id` (denormalized on the work so list/dashboard/RLS do not depend only on a join).
- **Places stay ownerless.** No `user_id` on places. All fields remain shared. Duplicate name+branch allowed. No global unique constraint on Place identity.
- **Bank uniqueness.** Unique on `(user_id, account_number)` only. Not unique across dentists.
- **Migration.** One-time: resolve Parinda by email `daparindada@gmail.com`. Set every existing bank, schedule, and work `user_id` to that user. There are no other dentist logins to preserve.
- **Request identity.** Every private read/write and every Place mutation requires a session. Owner is always `session.user.id`. Clients must not pass owner id.
- **API behavior.** Banks, works, schedules, bank/schedule masters, and dashboard/chart queries add an owner filter. Place list/master stay unfiltered (authenticated). GET/PATCH/DELETE by id on a private row belonging to someone else returns 404 or 403 (pick one and use it everywhere; prefer 404).
- **Cross-owner writes.** Creating/updating a work must reject a `schedule_id` or `bank_id` that is not owned by the current dentist.
- **Place delete.** Before delete, if any schedule exists for that place (any owner), reject. Works are reached through schedules; blocking on schedules is enough if works cannot exist without a schedule. Return a clear error, do not orphan rows.
- **RLS.** Enable RLS on `banks`, `schedules`, and `works`. Policy: authenticated app role may SELECT/INSERT/UPDATE/DELETE only where `user_id` equals the current dentist id set on the connection for that request. Enable RLS on `places` with policies that allow any authenticated dentist to SELECT/INSERT/UPDATE, and DELETE only when no schedules reference the row (policy or the same check the API already performs — both must agree).
- **RLS must apply to the app.** The Postgres role used by the application Prisma client must **not** bypass RLS. Each request sets the current dentist id (session setting / `SET LOCAL`) before queries. Migrations and Oakko’s SQL use a separate bypass/superuser role. If the app keeps using a bypass `DATABASE_URL`, RLS does **not** meet the “buggy API” story and the work is incomplete.
- **Auth tables.** Do not apply dentist-owner RLS in a way that breaks Better Auth sessions, accounts, or verification. Push `subscriptions` stay per user as they already are.
- **No god-mode API.** No admin list-all-dentists-data endpoint in v1.
- **Invite.** Out of product. Document that a dentist is created by inserting a user (and credential) in the database.
- **UI.** Existing list/home screens stay; they consume already-scoped APIs. No new dentist switcher.

## Testing Decisions

- **Seam (one):** HTTP API routes, as two dentists with real sessions. Prefer this over Prisma-unit tests or UI tests. There is no existing automated test suite; add the smallest API tests that prove the wall.
- **Good tests** assert observable HTTP behavior only: status, which ids appear, totals, dashboard numbers, and Place catalog visibility. Do not assert policy names, Prisma `where` shapes, or RLS SQL text.
- **Minimum cases:**
  - Dentist B’s GET banks/works/schedules/dashboard never includes Parinda’s ids or sums.
  - Dentist B can GET the Place Parinda created and PATCH it; Parinda then sees the edit.
  - Dentist B DELETE of a Place that Parinda still has a schedule on fails; Place remains.
  - Dentist B can create a bank with the same `account_number` as Parinda; creating a second copy under B fails.
  - Dentist B GET/PATCH/DELETE of Parinda’s bank/schedule/work id fails.
  - Dentist B POST work using Parinda’s `schedule_id` or `bank_id` fails.
  - Both dentists can create a schedule on the same Place and date; each list shows only their own.
  - Unauthenticated GET of private lists fails.
  - After a deliberately unscoped query on the **app** DB role (or equivalent), private rows of the other dentist still do not return — this is the RLS acceptance test.
- **Migration check (manual or one script):** after backfill, Parinda’s login sees prior counts; no private row has a null owner.
- **Prior art:** none. Do not invent a large framework; keep tests next to the API seam.

## Out of Scope

- Invite UI, email invites, approval workflows.
- In-app hidden admin / god view.
- Assistants, clinic orgs, roles beyond dentist.
- Per-dentist Place copies, place approval, hiding unused places.
- Globally unique bank account numbers.
- Unique Place name+branch.
- Seeing another dentist’s booking at the same Place/date.
- Changing Better Auth provider or adding a second auth system.
- Rewriting the home UI beyond consuming scoped APIs.

## Further Notes

Grilled decisions: mixed isolation (C) with Places fully shared; dentist-only logins; one shared Place object including hours/tax/remark; anyone’s Place edit is global; invite is hardcoded DB insert; Place delete blocked if any schedule/work exists; bookings fully private even on the same Place/date; bank numbers unique per dentist only; duplicate Places allowed; v1 is data wall + RLS; all existing banks/works/schedules belong to Parinda; new dentist sees all Places and zero private data; back-door is SQL, not an admin UI.

Vocabulary: **dentist** = login user who owns private rows. **Place** = shared clinic catalog row. **Bank / schedule / work** = dentist-owned. Do not say “tenant” or “clinic admin” in this feature — those were rejected.
