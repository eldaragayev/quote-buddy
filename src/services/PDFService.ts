import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { PDFGenerationOptions, PDFError, PDFErrorType } from "../types/pdf";
import { InvoiceTemplate } from "../templates/invoice/InvoiceTemplate";

export class PDFService {
  private template: InvoiceTemplate;
  private static instance: PDFService;

  constructor() {
    this.template = new InvoiceTemplate();
  }

  static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  /**
   * Generate HTML for invoice preview
   */
  async generateInvoiceHTML(options: PDFGenerationOptions): Promise<string> {
    try {
      // Validate required data
      this.validateOptions(options);

      // Generate HTML from template
      return await this.template.generate(options);
    } catch (error) {
      console.error("HTML generation failed:", error);

      if (error instanceof PDFError) {
        throw error;
      }

      throw new PDFError(
        PDFErrorType.GENERATION_FAILED,
        `Failed to generate HTML invoice: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate PDF invoice from invoice data (for sharing)
   */
  async generateInvoicePDF(options: PDFGenerationOptions): Promise<string> {
    try {
      // Validate required data
      this.validateOptions(options);

      // Generate HTML from template
      const html = await this.template.generate(options);

      // Convert HTML to PDF - using basic call with defaults
      const { uri } = await Print.printToFileAsync({
        html,
      });

      // Move to a more permanent location with proper filename
      const filename = `invoice_${options.invoice.number}_${Date.now()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      return newUri;
    } catch (error) {
      console.error("PDF generation failed:", error);

      if (error instanceof PDFError) {
        throw error;
      }

      throw new PDFError(
        PDFErrorType.GENERATION_FAILED,
        `Failed to generate PDF invoice: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate PDF as base64 data URI for preview in WebView
   */
  async generateInvoicePDFPreview(
    options: PDFGenerationOptions
  ): Promise<string> {
    try {
      console.log("PDFService: Starting PDF preview generation");

      // Validate required data
      this.validateOptions(options);

      // Generate HTML from template
      const html = await this.template.generate(options);
      console.log("PDFService: HTML generated, length:", html.length);

      // Step 1: Generate PDF as FILE using basic call (no custom parameters)
      console.log("PDFService: Generating PDF file...");
      const { uri } = await Print.printToFileAsync({
        html,
      });

      console.log("PDFService: PDF file generated:", uri);

      // Step 2: Read the file and convert to base64 manually
      console.log("PDFService: Reading file and converting to base64...");
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log(
        "PDFService: Base64 conversion successful, length:",
        base64Data.length
      );

      // Step 3: Clean up the temporary file
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log("PDFService: Temporary file cleaned up");
      } catch (cleanupError) {
        console.warn(
          "PDFService: Failed to cleanup temporary file:",
          cleanupError
        );
      }

      // Return as data URI for WebView
      return `data:application/pdf;base64,${base64Data}`;
    } catch (error) {
      console.error("PDFService: PDF preview generation failed:", error);

      if (error instanceof PDFError) {
        throw error;
      }

      throw new PDFError(
        PDFErrorType.GENERATION_FAILED,
        `Failed to generate PDF preview: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Share PDF invoice via system share sheet
   */
  async shareInvoicePDF(uri: string, invoiceNumber: number): Promise<void> {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new PDFError(
          PDFErrorType.SHARING_UNAVAILABLE,
          "Sharing is not available on this device"
        );
      }

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Share Invoice #${invoiceNumber}`,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      throw new PDFError(
        PDFErrorType.SHARING_UNAVAILABLE,
        `Failed to share PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Save PDF to device storage
   */
  async saveInvoiceToDisk(uri: string, filename: string): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        return await this.saveToAndroid(uri, filename);
      } else {
        // On iOS, use share sheet as direct save is not available
        await this.shareInvoicePDF(
          uri,
          parseInt(filename.match(/\d+/)?.[0] || "0")
        );
        return true;
      }
    } catch (error) {
      console.error("Save to disk failed:", error);
      throw new PDFError(
        PDFErrorType.STORAGE_PERMISSION_DENIED,
        `Failed to save PDF to device: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get PDF file info
   */
  async getPDFInfo(uri: string): Promise<FileSystem.FileInfo> {
    return await FileSystem.getInfoAsync(uri);
  }

  /**
   * Clean up temporary PDF files
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) return;

      const files = await FileSystem.readDirectoryAsync(documentDir);
      const pdfFiles = files.filter(
        (file) => file.startsWith("invoice_") && file.endsWith(".pdf")
      );

      // Keep only the last 10 PDF files
      if (pdfFiles.length > 10) {
        const filesToDelete = pdfFiles.slice(0, pdfFiles.length - 10);

        for (const file of filesToDelete) {
          await FileSystem.deleteAsync(`${documentDir}${file}`, {
            idempotent: true,
          });
        }
      }
    } catch (error) {
      console.warn("Cleanup failed:", error);
      // Don't throw error for cleanup failures
    }
  }

  private validateOptions(options: PDFGenerationOptions): void {
    const { invoice, client, issuer, items } = options;

    if (!invoice) {
      throw new PDFError(PDFErrorType.INVALID_DATA, "Invoice data is required");
    }

    if (!client) {
      throw new PDFError(
        PDFErrorType.INVALID_DATA,
        "Client information is required"
      );
    }

    if (!issuer) {
      throw new PDFError(
        PDFErrorType.INVALID_DATA,
        "Issuer information is required"
      );
    }

    if (!items || items.length === 0) {
      throw new PDFError(
        PDFErrorType.INVALID_DATA,
        "Invoice must have at least one item"
      );
    }

    if (!invoice.number) {
      throw new PDFError(
        PDFErrorType.INVALID_DATA,
        "Invoice number is required"
      );
    }
  }

  private async saveToAndroid(uri: string, filename: string): Promise<boolean> {
    try {
      // Use StorageAccessFramework for Android
      const { StorageAccessFramework } = FileSystem;

      const permissions =
        await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          "application/pdf"
        );

        await FileSystem.copyAsync({
          from: uri,
          to: fileUri,
        });

        return true;
      } else {
        throw new PDFError(
          PDFErrorType.STORAGE_PERMISSION_DENIED,
          "Storage permission denied"
        );
      }
    } catch (error) {
      console.error("Android save failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const pdfService = PDFService.getInstance();
