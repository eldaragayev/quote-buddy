import { PDFGenerationOptions, PDFError, PDFErrorType } from "../../types/pdf";
import { formatCurrency, formatDate, getDueDateFromOption } from "../../utils/formatters";
import { calculateInvoiceTotal } from "../../utils/calculations";

export class InvoiceTemplate {
  async generate(options: PDFGenerationOptions): Promise<string> {
    try {
      console.log(
        "Template generation started with options:",
        JSON.stringify(options, null, 2)
      );
      const { invoice, client, issuer, items, tax, currency } = options;

      // Calculate totals using existing utility
      const calculation = calculateInvoiceTotal(
        items,
        invoice.discount_type || null,
        invoice.discount_value || 0,
        tax?.rate_percent
      );

      // Format dates
      const issuedDate = formatDate(invoice.issued_date);
      const calculatedDueDateObj = getDueDateFromOption(invoice.due_option, new Date(invoice.issued_date));
      const dueDate = invoice.due_date 
        ? formatDate(invoice.due_date)
        : calculatedDueDateObj 
        ? formatDate(calculatedDueDateObj)
        : "Upon receipt";

      // Generate the complete HTML
      return this.buildHTML({
        invoice,
        client,
        issuer,
        items,
        tax,
        currency,
        calculation,
        issuedDate,
        dueDate,
      });
    } catch (error) {
      throw new PDFError(
        PDFErrorType.TEMPLATE_ERROR,
        `Template generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private buildHTML(data: any): string {
    const {
      invoice,
      client,
      issuer,
      items,
      tax,
      currency,
      calculation,
      issuedDate,
      dueDate,
    } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${invoice.number}</title>
        <style>
          ${this.getStyles()}
        </style>
      </head>
      <body>
        <div class="invoice">
          <!-- Header with Company Name and Invoice Number -->
          <div class="top-header">
            <div class="company-title">
              <h1>${this.escapeHtml(issuer.company_name || "Your Company")}</h1>
              <div class="invoice-number">Invoice #${this.escapeHtml(
                String(invoice.number || "")
              )}</div>
            </div>
            <div class="invoice-dates">
              <div class="invoice-date">
                <div class="date-label">Date Issued</div>
                <div class="date-value">${issuedDate}</div>
              </div>
              <div class="due-date">
                <div class="date-label">Due Date</div>
                <div class="date-value">${dueDate}</div>
              </div>
            </div>
          </div>

          <!-- BILL TO and FROM Section -->
          <div class="from-to-section">
            <div class="bill-to-column">
              <h3 class="section-title">BILL TO</h3>
              <div class="contact-details">
                <div class="contact-name">${this.escapeHtml(
                  client.name || ""
                )}</div>
                ${
                  client.company_name
                    ? `<div class="company-name">${this.escapeHtml(
                        client.company_name
                      )}</div>`
                    : ""
                }
                ${
                  client.contact_name
                    ? `<div class="person-name">${this.escapeHtml(
                        client.contact_name
                      )}</div>`
                    : ""
                }
                ${
                  client.billing_address
                    ? `<div class="address">${this.escapeHtml(
                        client.billing_address
                      ).replace(/\n/g, "<br>")}</div>`
                    : ""
                }
                ${
                  client.email
                    ? `<div class="email">${this.escapeHtml(
                        client.email
                      )}</div>`
                    : ""
                }
                ${
                  client.phone
                    ? `<div class="phone">${this.escapeHtml(
                        client.phone
                      )}</div>`
                    : ""
                }
              </div>
            </div>
            
            <div class="from-column">
              <h3 class="section-title">FROM</h3>
              <div class="contact-details">
                <div class="company-name">${this.escapeHtml(
                  issuer.company_name || "Your Company Name"
                )}</div>
                ${
                  issuer.contact_name
                    ? `<div class="person-name">${this.escapeHtml(
                        issuer.contact_name
                      )}</div>`
                    : ""
                }
                ${
                  issuer.address
                    ? `<div class="address">${this.escapeHtml(
                        issuer.address
                      ).replace(/\n/g, "<br>")}</div>`
                    : ""
                }
                ${
                  issuer.email
                    ? `<div class="email">${this.escapeHtml(
                        issuer.email
                      )}</div>`
                    : ""
                }
                ${
                  issuer.phone
                    ? `<div class="phone">${this.escapeHtml(
                        issuer.phone
                      )}</div>`
                    : ""
                }
              </div>
            </div>
          </div>
          
          <!-- Line Items Table -->
          <div class="items-section">
            <table class="items-table">
              <thead>
                <tr>
                  <th class="desc">Description</th>
                  <th class="qty">Qty</th>
                  <th class="rate">Rate</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item: any, index: number) => `
                  <tr class="${index % 2 === 0 ? "even" : "odd"}">
                    <td class="desc">${this.escapeHtml(item.name || "")}</td>
                    <td class="qty">${item.qty}</td>
                    <td class="rate">${formatCurrency(item.rate, currency)}</td>
                    <td class="amount">${formatCurrency(
                      item.qty * item.rate,
                      currency
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <!-- Summary Section -->
          <div class="summary-section">
            <div class="summary-table">
              <div class="summary-row">
                <span class="label">Subtotal:</span>
                <span class="value">${formatCurrency(
                  calculation.subtotal,
                  currency
                )}</span>
              </div>
              
              ${
                calculation.discountAmount > 0
                  ? `
                <div class="summary-row">
                  <span class="label">Discount:</span>
                  <span class="value discount">-${formatCurrency(
                    calculation.discountAmount,
                    currency
                  )}</span>
                </div>
              `
                  : ""
              }
              
              ${
                calculation.taxAmount > 0 && tax
                  ? `
                <div class="summary-row">
                  <span class="label">${this.escapeHtml(tax.name)} (${
                      tax.rate_percent
                    }%):</span>
                  <span class="value">${formatCurrency(
                    calculation.taxAmount,
                    currency
                  )}</span>
                </div>
              `
                  : ""
              }
              
              <div class="summary-row total-row">
                <span class="label">Total:</span>
                <span class="value total">${formatCurrency(
                  calculation.total,
                  currency
                )}</span>
              </div>
            </div>
          </div>
          
          <!-- Notes and Terms -->
          ${
            invoice.public_notes || invoice.terms
              ? `
            <div class="notes-section">
                            ${
                              invoice.public_notes
                                ? `
                <div class="notes">
                  <h4>Notes:</h4>
                  <p>${this.escapeHtml(invoice.public_notes).replace(
                    /\n/g,
                    "<br>"
                  )}</p>
                </div>
                `
                                : ""
                            }
              
                            ${
                              invoice.terms
                                ? `
                <div class="terms">
                  <h4>Terms & Conditions:</h4>
                  <p>${this.escapeHtml(invoice.terms).replace(
                    /\n/g,
                    "<br>"
                  )}</p>
                </div>
                `
                                : ""
                            }
            </div>
          `
              : ""
          }
        </div>
      </body>
      </html>
    `;
  }

  private getStyles(): string {
    return `
      @page { 
        size: A4; 
        margin: 0;
      }
      
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
        margin: 0;
        padding: 0;
        color: #1d1d1f;
        font-size: 13px;
        line-height: 1.4;
        background: #f5f5f7;
        font-weight: 400;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 20px;
        box-sizing: border-box;
      }
      
      .invoice {
        width: 210mm;
        max-width: 210mm;
        margin: 0 auto;
        background: white;
        position: relative;
        box-sizing: border-box;
        padding: 20mm;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
      }
      
      /* Top Header */
      .top-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 40px;
        padding-bottom: 0;
        border-bottom: none;
      }
      
      .company h1 {
        margin: 0 0 12px 0;
        font-size: 28px;
        font-weight: 600;
        color: #1d1d1f;
        letter-spacing: -0.022em;
        line-height: 1.125;
      }
      
      .company-title h1 {
        margin: 0 0 8px 0;
        font-size: 32px;
        font-weight: 600;
        color: #1d1d1f;
        letter-spacing: -0.022em;
        line-height: 1.1;
      }
      
      .invoice-number {
        font-size: 18px;
        color: #666666;
        font-weight: 400;
      }
      
      .invoice-dates {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .invoice-date, .due-date {
        display: flex;
        flex-direction: column;
      }
      
      .date-label {
        font-size: 14px;
        color: #666666;
        margin-bottom: 4px;
        font-weight: 500;
      }
      
      .date-value {
        font-size: 18px;
        color: #1d1d1f;
        font-weight: 600;
      }
      
      .due-date .date-value {
        color: #007AFF;
      }
      
      /* FROM and TO Section */
      .from-to-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 48px;
        gap: 60px;
      }
      
      .bill-to-column,
      .from-column {
        flex: 1;
        max-width: 45%;
      }
      
      .section-title {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        color: #1d1d1f;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .contact-details .contact-name,
      .contact-details .company-name {
        font-weight: 600;
        color: #1d1d1f;
        margin: 0 0 6px 0;
        font-size: 16px;
        line-height: 1.3;
      }
      
      .contact-details .person-name {
        font-weight: 500;
        color: #333333;
        margin: 0 0 6px 0;
        font-size: 14px;
      }
      
      .contact-details .address {
        margin: 8px 0;
        color: #333333;
        line-height: 1.4;
        font-size: 14px;
      }
      
      .contact-details .email,
      .contact-details .phone {
        margin: 2px 0;
        color: #333333;
        font-size: 14px;
        font-weight: 400;
      }
      
      .company .contact {
        margin: 2px 0;
        font-weight: 500;
        color: #333333;
        font-size: 14px;
      }
      
      .company .address {
        margin: 10px 0 8px 0;
        color: #333333;
        line-height: 1.4;
        font-size: 13px;
      }
      
      .company .contact-info p {
        margin: 1px 0;
        color: #333333;
        font-size: 13px;
        font-weight: 400;
      }
      
      .invoice-details {
        text-align: right;
        min-width: 220px;
      }
      
      .invoice-details h2 {
        margin: 0 0 16px 0;
        font-size: 40px;
        font-weight: 600;
        color: #1d1d1f;
        letter-spacing: -0.03em;
        line-height: 1.083;
      }
      
      .invoice-meta p {
        margin: 4px 0;
        font-size: 13px;
        line-height: 1.4;
      }
      
      .invoice-meta .label {
        color: #666666;
        font-weight: 500;
        margin-right: 8px;
      }
      
      
      /* Client Section - Clean and minimal */
      .client-section {
        margin-bottom: 32px;
      }
      
      .client-section h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1d1d1f;
        letter-spacing: -0.022em;
        text-transform: none;
      }
      
      .client-info .client-name {
        font-size: 17px;
        font-weight: 600;
        color: #1d1d1f;
        margin: 0 0 4px 0;
        letter-spacing: -0.022em;
      }
      
      .client-info .company {
        font-weight: 500;
        color: #1d1d1f;
        margin: 0 0 3px 0;
        font-size: 13px;
      }
      
      .client-info p {
        margin: 1px 0;
        color: #333333;
        font-size: 13px;
        font-weight: 400;
      }
      
      .client-info .address {
        margin: 8px 0;
        line-height: 1.4;
        color: #333333;
      }
      
      /* Items Table - Apple-style clean table */
      .items-section {
        margin-bottom: 28px;
        page-break-inside: auto;
      }
      
      .items-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: 0;
        background: white;
        border: 1px solid #d2d2d7;
        border-radius: 12px;
        overflow: hidden;
      }
      
      .items-table thead th {
        background: #f5f5f7;
        padding: 12px 12px;
        text-align: left;
        font-weight: 600;
        color: #1d1d1f;
        border-bottom: 1px solid #d2d2d7;
        font-size: 12px;
        letter-spacing: -0.01em;
        text-transform: none;
      }
      
      .items-table th.qty,
      .items-table th.rate,
      .items-table th.amount {
        text-align: right;
        width: 100px;
      }
      
      .items-table th.desc {
        width: auto;
      }
      
      .items-table tbody td {
        padding: 12px;
        border-bottom: 1px solid #f5f5f7;
        vertical-align: top;
        font-size: 13px;
      }
      
      .items-table tbody tr:last-child td {
        border-bottom: none;
      }
      
      .items-table tbody tr.even {
        background: #fbfbfd;
      }
      
      .items-table td.desc {
        font-weight: 500;
        color: #1d1d1f;
      }
      
      .items-table td.qty,
      .items-table td.rate,
      .items-table td.amount {
        text-align: right;
        font-weight: 500;
        color: #1d1d1f;
        font-variant-numeric: tabular-nums;
      }
      
      /* Summary Section - Clean Apple-style totals */
      .summary-section {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 24px;
        page-break-inside: avoid;
      }
      
      .summary-table {
        min-width: 280px;
        background: #f5f5f7;
        border-radius: 12px;
        padding: 18px;
      }
      
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 13px;
        align-items: baseline;
      }
      
      .summary-row .label {
        font-weight: 500;
        color: #666666;
      }
      
      .summary-row .value {
        font-weight: 600;
        color: #1d1d1f;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      
      .summary-row .discount {
        color: #ff3b30;
      }
      
      .summary-row.total-row {
        border-top: 1px solid #d2d2d7;
        margin-top: 8px;
        padding-top: 12px;
        font-size: 16px;
      }
      
      .summary-row.total-row .label {
        font-weight: 600;
        color: #1d1d1f;
        font-size: 16px;
      }
      
      .summary-row.total-row .value {
        font-weight: 600;
        color: #1d1d1f;
        font-size: 18px;
        letter-spacing: -0.022em;
      }
      
      /* Notes Section - Minimal and clean */
      .notes-section {
        margin-bottom: 0;
        page-break-inside: avoid;
        page-break-before: auto;
      }
      
      .notes, .terms {
        margin-bottom: 20px;
        background: #f5f5f7;
        padding: 16px;
        border-radius: 12px;
      }
      
      .notes h4, .terms h4 {
        margin: 0 0 8px 0;
        font-size: 15px;
        font-weight: 600;
        color: #1d1d1f;
        letter-spacing: -0.022em;
        text-transform: none;
      }
      
      .notes p, .terms p {
        margin: 0;
        color: #333333;
        line-height: 1.4;
        font-size: 13px;
      }
      


      
      /* Print Optimization */
      @media print {
        body {
          background: white;
          padding: 0;
          margin: 0;
          font-size: 12px;
          display: block;
        }
        
        .invoice {
          box-shadow: none;
          border-radius: 0;
          margin: 0;
          padding: 15mm;
          width: 100%;
          max-width: none;
        }

        
        .top-header {
          page-break-after: avoid;
        }
        
        .from-to-section {
          page-break-after: avoid;
        }
        
        .items-table {
          page-break-inside: auto;
          border: 1px solid #d2d2d7;
        }
        
        .items-table thead {
          display: table-header-group;
        }
        
        .items-table tbody tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        
        .items-section {
          page-break-inside: auto;
        }
        
        .items-table thead th {
          background: #f5f5f7 !important;
          -webkit-print-color-adjust: exact;
        }
        
        .summary-section {
          page-break-inside: avoid;
        }
        
        .summary-table {
          background: #f5f5f7 !important;
          -webkit-print-color-adjust: exact;
        }
        
        .notes, .terms {
          background: #f5f5f7 !important;
          -webkit-print-color-adjust: exact;
          page-break-inside: avoid;
        }
        
        .notes-section {
          page-break-inside: avoid;
        }
      }
      
      /* Mobile adjustments - Scale down A4 to fit screen */
      @media (max-width: 600px) {
        body {
          padding: 10px;
          font-size: 12px;
        }
        
        .invoice {
          width: 100%;
          max-width: 100%;
          min-height: auto;
          padding: 15mm;
          transform: scale(1);
          box-shadow: none;
          border-radius: 0;
        }
        
        .top-header {
          flex-direction: column;
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .invoice-dates {
          text-align: left;
          flex-direction: row;
          gap: 20px;
          justify-content: space-between;
        }
        
        .invoice-date, .due-date {
          flex: 1;
        }
        
        .from-to-section {
          flex-direction: column;
          gap: 32px;
        }
        
        .bill-to-column,
        .from-column {
          max-width: 100%;
        }
        
        .items-table th.qty,
        .items-table th.rate,
        .items-table th.amount {
          width: 70px;
        }
        
        .summary-table {
          min-width: 240px;
        }
        
        .client-section {
          margin-bottom: 24px;
        }
        
        .items-section {
          margin-bottom: 20px;
        }
      }
    `;
  }

  private escapeHtml(text: string | undefined | null): string {
    console.log("escapeHtml called with:", typeof text, text);
    if (!text) {
      console.log("escapeHtml returning empty string for:", text);
      return "";
    }

    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    try {
      const result = text.replace(/[&<>"']/g, (m) => map[m]);
      console.log("escapeHtml successful for:", text, "->", result);
      return result;
    } catch (error) {
      console.error(
        "escapeHtml error for text:",
        text,
        "type:",
        typeof text,
        "error:",
        error
      );
      return "";
    }
  }
}
