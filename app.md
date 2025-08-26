The idea of the app is to create an invoicing app with AI features embedded to make it easier to create/share invoices for one or more of businesses/employees/contractors of the user

Look at database.design.md for more info on database schema (local storage expo)

And here's all the tab info:

# Invoices (tab)

- Header: **Invoices**. Right: **Settings**.
- Filters: chips — **All / Unpaid / Paid**. (Totals reflect current filter.)
- Summary: `total: {sum of visible invoices}`.
- Search + Sort: inline search; sort by **Date / Amount / Client** (ASC/DESC).
- List (card per invoice):
    - Left: **Client name**
    - Subline: `#number, issue date`
    - Right: **Amount**
    - Subline right: **due in Xd** / **overdue Xd** (color-coded)
    - Tap → **Invoice** screen.
- Row actions:
    - Swipe left: **Mark Paid/Unpaid**
    - Swipe right: **Share / Preview**
    - Long-press → multi-select (Mark paid, Share, Delete)
- Empty state: “No invoices yet.” CTA: **Create invoice**.
- Pagination: infinite scroll; pull to refresh.
- Primary CTA (sticky): **Create invoice**.

# Invoice (screen)

- Title:
    - **Create Invoice** (new)
    - **Invoice #XXX** (edit)
    - Left: Back / Close. Right: **••** (Duplicate, Delete).

Sections

**Invoice Info**

- Issuer (by default the default one, but user can create another issuer (company or self-employed)) → opens a new screen with issuer if user picks, one is default from onboarding, but user can add more if needed
- **Number** (auto-increment based on last invoice for each issuer, editable)
- **Issued** (date picker)
- **Due** (None, On receipt, 7/14/30 days, Custom)
- **Currency** (defaults from Settings, from onboarding, based on user location; can be overwritten (as default) per-invoice override)

**Client**

- Row: **Client** → selector
    - Search existing; **Add new client** (quick create: name, email/phone)
    - From client: view basics, balance, recent invoices

**Items**

- Button: **Add new Item (+)**
    - Opens item picker (search saved items)
    - **Create new item** inline (name, price/rate, unit, tax) → saved to Items
- Line item cell: name, qty, rate, line total
    - Tap → edit; drag to reorder; swipe → delete

**Summary**

- **Subtotal**
- **Discount** (None / % / fixed)
- **Tax** (None / pick saved / add new)
- **Total** (live)

**Notes & Terms** (optional collapsible)

- Public notes, terms, PO number
- Bottom bar (sticky):
    - Primary: **Create / Save**
    - Secondary actions: **Preview PDF**, **Share/Send**, **Mark Paid/Unpaid**
- States
    - **Unpaid / Paid** (set via Mark Paid)
    - Validation: require at least one item before Share
- Data model notes
    - Items saved inside **Invoicing** (no separate tab). Reusable across invoices.
    - Taxes/discounts apply as configured; totals update in real time.

### Clients tab

- Header: **Clients**. Right: **Settings**.
- Filters (chips): **All / Has balance / No balance / Archived**.
- Search + Sort: search by name/email; sort **Name / Last invoice / Outstanding / Total billed**.
- List (card per client):
    - Left: **Client name**
    - Subline: email or phone • `last invoice: {date or –}`
    - Right: **Outstanding** (0 if none)
    - Badge: **overdue n** (if any)
    - Tap → **Client** screen.
- Row actions:
    - Swipe left: **Create invoice**
    - Swipe right: **Email** / **Call**
    - Long-press → multi-select (Archive/Unarchive, Delete, Export CSV)
- Empty state: “No clients yet.” CTA: **Add client**.
- Primary CTA (sticky): **Add client (+)**.
- Pagination: infinite scroll; pull to refresh.

# Client (screen)

- Title: **Client** (client name). Left: Back. Right: **•••** (Edit, Duplicate, Archive/Unarchive, Delete).
- Header card:
    - Name
    - **Outstanding** (with overdue count)
    - Quick actions: **Create invoice**, **Email**, **Call**
- Sections

**Info**

- Company / Contact person
- Email, phone
- Address (billing/shipping)
- Defaults (optional): currency, payment terms, tax/discount
- Tags
- Edit button (inline)

**Related invoices**

- Chips: **All / Unpaid / Paid**
- List of this client’s invoices (number, date, total, status, due/overdue)
- Footer: **Create invoice for this client**

**Notes**

- Add note (time-stamped)
- List of notes (edit/delete)


### Tools Tab

A list of tools that app has:

1 - Estimates

2 - Expenses

3 - P&L statement

4 - AI Agent (Ask About Anything! Upload photo, record audio, Create estimates, invoices, expenses, clients from voice)


### Dashboard Tab

- Header: **Dashboard**. Right: **Settings**.
- Time: chips — **This week / Month / Quarter / Year / Custom**.
- KPI row (tap → filters Invoices list):
    - **Paid** — sum in range
    - **Unpaid** — open balance in range
    - **Total** — issued in range
- Chart (full-width, simple line/area):
    - Segmented toggle: **Invoices / Expenses / Balance**
    - X: time buckets from the selected range. Y: amount.
    - Long-press → value tooltip; tap a point → jump to filtered list.
- Sales by client (top 5):
    - Compact list: **Client**, amount, tiny progress bar.
    - “View all” → Clients list pre-filtered/sorted by sales.
- Recent invoices:
    - 5 rows: `#no • client • date • total • status (paid/unpaid/overdue)`
    - “See all” → Invoices tab with matching filter.
- Primary CTA (sticky bottom): **Create invoice**.

## States

- **Empty (new account):**
    - KPIs show 0; chart placeholder.
    - Card: “No activity yet.” Buttons: **Create invoice**, **Add client**.
- **Loading:** shimmer for KPI cards, chart, lists.
- **Errors:** inline banner (“Couldn’t load data. Retry”).

## Notes

- All numbers respect the selected time range.
- Currency from Settings; override shows a small currency pill.
- Pull to refresh; infinite scroll inside “See all” views.
- No Agent elements here (Agent is a separate tab).

