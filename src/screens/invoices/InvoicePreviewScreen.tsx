import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../styles/theme";
import { pdfService } from "../../services/PDFService";
import { PDFGenerationOptions } from "../../types/pdf";

type InvoiceStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: { invoiceId?: number };
  InvoicePreview: {
    invoiceData: PDFGenerationOptions;
    invoiceNumber: number;
  };
};

type NavigationProp = StackNavigationProp<
  InvoiceStackParamList,
  "InvoicePreview"
>;
type RoutePropType = RouteProp<InvoiceStackParamList, "InvoicePreview">;

export const InvoicePreviewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { invoiceData, invoiceNumber } = route.params;

  const [pdfUri, setPdfUri] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [viewMode, setViewMode] = useState<"html" | "pdf">("html"); // Start with HTML as it's more reliable

  useEffect(() => {
    // Start with HTML preview as it's more reliable
    const loadContent = async () => {
      try {
        await loadHTMLContent();
      } catch (error) {
        console.error("Failed to load content in useEffect:", error);
      }
    };

    loadContent();
  }, []);

  const loadHTMLContent = async () => {
    setIsLoadingPDF(true);
    try {
      console.log("Generating HTML preview...");
      const html = await pdfService.generateInvoiceHTML(invoiceData);
      console.log("HTML generated successfully, length:", html.length);
      setPdfUri(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      setViewMode("html");
    } catch (error) {
      console.error("HTML preview generation failed:", error);
      Alert.alert("Error", "Failed to generate invoice preview");
    } finally {
      setIsLoadingPDF(false);
    }
  };

  const loadPDFContent = async () => {
    setIsLoadingPDF(true);
    try {
      console.log("Generating PDF preview...");
      const pdfPreview = await pdfService.generateInvoicePDFPreview(
        invoiceData
      );
      console.log(
        "PDF preview generated successfully, length:",
        pdfPreview.length
      );
      setPdfUri(pdfPreview);
      setViewMode("pdf");
    } catch (error) {
      console.error("PDF preview generation failed:", error);
      console.error("Full error details:", error);

      // Fallback to HTML preview
      try {
        console.log("Falling back to HTML preview...");
        const html = await pdfService.generateInvoiceHTML(invoiceData);
        setPdfUri(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
        setViewMode("html");
        Alert.alert(
          "PDF Unavailable",
          "Showing HTML preview instead. PDF generation is not working on this device."
        );
      } catch (htmlError) {
        console.error("HTML fallback also failed:", htmlError);
        Alert.alert(
          "Error",
          `Preview failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    } finally {
      setIsLoadingPDF(false);
    }
  };

  const toggleViewMode = async () => {
    try {
      if (viewMode === "html") {
        console.log("User requested PDF view...");
        await loadPDFContent();
      } else {
        console.log("User requested HTML view...");
        await loadHTMLContent();
      }
    } catch (error) {
      console.error("Error in toggleViewMode:", error);
      Alert.alert("Error", "Failed to switch view mode");
    }
  };

  const handleShare = async () => {
    setIsGeneratingPDF(true);
    try {
      // Generate a file-based PDF for sharing (not base64)
      console.log("Generating PDF file for sharing...");
      const pdfFileUri = await pdfService.generateInvoicePDF(invoiceData);
      console.log("PDF file generated for sharing:", pdfFileUri);
      await pdfService.shareInvoicePDF(pdfFileUri, invoiceNumber);
    } catch (error) {
      console.error("Share failed:", error);
      Alert.alert("Error", "Failed to share PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleRefresh = () => {
    console.log("Refreshing preview...");
    setPdfUri("");
    if (viewMode === "pdf") {
      loadPDFContent();
    } else {
      loadHTMLContent();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header - Same pattern as InvoiceDetailScreen */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Invoice Preview</Text>
            <TouchableOpacity
              onPress={toggleViewMode}
              style={styles.viewModeButton}
            >
              <Text style={styles.subtitle}>
                {viewMode === "html" ? "Try PDF View" : "Switch to HTML"}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleShare} disabled={isGeneratingPDF}>
            <Ionicons
              name={isGeneratingPDF ? "hourglass-outline" : "share-outline"}
              size={24}
              color={isGeneratingPDF ? Colors.textLight : Colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoadingPDF ? (
            <View style={styles.loadingContainer}>
              <Ionicons
                name="document-text"
                size={60}
                color={Colors.primary || Colors.black}
              />
              <Text style={styles.loadingText}>Generating PDF preview...</Text>
              <Text style={styles.loadingSubtext}>
                Converting invoice to PDF format
              </Text>
            </View>
          ) : pdfUri ? (
            <WebView
              source={{ uri: pdfUri }}
              style={styles.webview}
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={false}
              startInLoadingState={true}
              scalesPageToFit={Platform.OS === "android"}
              onError={(error) => {
                console.error("PDF WebView error:", error);
                Alert.alert(
                  "PDF Preview Error",
                  "Failed to display PDF. The file may be corrupted or too large."
                );
              }}
              onLoadStart={() => console.log("PDF WebView loading started")}
              onLoadEnd={() => console.log("PDF WebView loading completed")}
              onMessage={(event) =>
                console.log("WebView message:", event.nativeEvent.data)
              }
            />
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={60} color={Colors.danger} />
              <Text style={styles.errorText}>Failed to generate PDF</Text>
              <Text style={styles.errorSubtext}>
                Please check your invoice data and try again
              </Text>
              <TouchableOpacity
                onPress={loadPDFContent}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.shareButton,
              isGeneratingPDF && styles.buttonDisabled,
            ]}
            onPress={handleShare}
            disabled={isGeneratingPDF}
          >
            <Ionicons
              name={isGeneratingPDF ? "hourglass-outline" : "share-outline"}
              size={20}
              color={Colors.white}
            />
            <Text style={styles.shareButtonText}>
              {isGeneratingPDF ? "Generating PDF..." : "Share Invoice PDF"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.xs,
  },
  viewModeButton: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    textAlign: "center",
    fontWeight: Typography.weights.medium,
  },
  loadingSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textLight,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.sizes.base,
    color: Colors.danger,
    marginTop: Spacing.lg,
    textAlign: "center",
    fontWeight: Typography.weights.medium,
  },
  errorSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.black,
    gap: Spacing.sm,
    width: "100%",
    maxWidth: 300,
    ...Shadow.md,
  },
  shareButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
