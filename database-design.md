# users

- id — INTEGER PRIMARY KEY
- name — TEXT
- business_name — TEXT

# settings

- id — INTEGER PRIMARY KEY
- default_currency_code — TEXT *(ISO 4217, e.g., "USD")*

# issuers

- id — INTEGER PRIMARY KEY
- company_name — TEXT
- contact_name — TEXT *(nullable; for solo traders this can be the same as company_name)*
- email — TEXT *(nullable)*
- phone — TEXT *(nullable)*
- address — TEXT *(nullable; single block is enough for invoice header)*
- is_default — INTEGER *(0/1)*

# clients

- id — INTEGER PRIMARY KEY
- name — TEXT
- company_name — TEXT
- contact_name — TEXT
- email — TEXT
- phone — TEXT
- billing_address — TEXT
- shipping_address — TEXT
- tags — TEXT *(comma-separated)*
- is_archived — INTEGER *(0/1)*
- default_currency_code — TEXT *(nullable)*
- default_due_option — TEXT *(nullable; one of: "none","on_receipt","net_7","net_14","net_30","custom")*
- default_tax_id — INTEGER *(nullable; FK → taxes.id)*
- default_discount_type — TEXT *(nullable; one of: "percent","fixed")*
- default_discount_value — REAL *(nullable)*

# client_notes

- id — INTEGER PRIMARY KEY
- client_id — INTEGER *(FK → clients.id)*
- content — TEXT
- created_at — TEXT *(ISO 8601 datetime)*

# taxes

- id — INTEGER PRIMARY KEY
- name — TEXT
- rate_percent — REAL

# items *(reusable catalog for invoices/estimates)*

- id — INTEGER PRIMARY KEY
- name — TEXT
- rate — REAL
- unit — TEXT
- tax_id — INTEGER *(nullable; FK → taxes.id)*

# invoices

- id — INTEGER PRIMARY KEY
- issuer_id — INTEGER *(FK → issuers.id)*
- client_id — INTEGER *(FK → clients.id)*
- number — INTEGER
- issued_date — TEXT *(YYYY-MM-DD)*
- due_option — TEXT *(one of: "none","on_receipt","net_7","net_14","net_30","custom")*
- due_date — TEXT *(YYYY-MM-DD; nullable, required when due_option="custom")*
- currency_code — TEXT *(ISO 4217)*
- status — TEXT *(one of: "unpaid","paid")*
- discount_type — TEXT *(nullable; "percent" or "fixed")*
- discount_value — REAL *(nullable)*
- tax_id — INTEGER *(nullable; FK → taxes.id)*
- public_notes — TEXT *(nullable)*
- terms — TEXT *(nullable)*
- po_number — TEXT *(nullable)*

# invoice_items

- id — INTEGER PRIMARY KEY
- invoice_id — INTEGER *(FK → invoices.id)*
- item_id — INTEGER *(nullable; FK → items.id)*
- name — TEXT *(snapshot at time of adding)*
- qty — REAL
- rate — REAL *(snapshot at time of adding)*
- position — INTEGER *(for drag-reorder)*

# expenses *(simple, single optional attachment)*

- id — INTEGER PRIMARY KEY
- title — TEXT
- description — TEXT *(nullable)*
- amount — REAL
- date — TEXT *(YYYY-MM-DD)*
- attachment_uri — TEXT *(nullable; file path / URL to local file)*
- attachment_mime — TEXT *(nullable; e.g., "image/jpeg","application/pdf")*

# estimates *(simple version of invoicing: pick client + items)*

- id — INTEGER PRIMARY KEY
- client_id — INTEGER *(FK → clients.id)*

# estimate_items

- id — INTEGER PRIMARY KEY
- estimate_id — INTEGER *(FK → estimates.id)*
- item_id — INTEGER *(nullable; FK → items.id)*
- name — TEXT *(snapshot at time of adding)*
- qty — REAL
- rate — REAL *(snapshot at time of adding)*
- position — INTEGER

# agent_chats *(chat sessions for AI Agent)*

- id — INTEGER PRIMARY KEY

# agent_messages

- id — INTEGER PRIMARY KEY
- chat_id — INTEGER *(FK → agent_chats.id)*
- role — TEXT *(e.g., "user","assistant")*
- content — TEXT

# agent_message_attachments

- id — INTEGER PRIMARY KEY
- message_id — INTEGER *(FK → agent_messages.id)*
- file_uri — TEXT
- mime_type — TEXT *(e.g., "image/png","audio/m4a")*