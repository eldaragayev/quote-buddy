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
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    // Generate PDF preview on load
    const loadContent = async () => {
      try {
        await loadPDFPreview();
      } catch (error) {
        console.error("Failed to load PDF preview in useEffect:", error);
      }
    };

    loadContent();
  }, []);

  const loadPDFPreview = async () => {
    setIsLoadingPreview(true);
    try {
      console.log("Generating PDF preview...");
      const pdfDataUri = await pdfService.generateInvoicePDFPreview(
        invoiceData
      );
      console.log("PDF preview generated successfully");
      setPdfUri(pdfDataUri);
    } catch (error) {
      console.error("PDF preview generation failed:", error);
      Alert.alert(
        "PDF Preview Failed",
        `Unable to generate PDF preview: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoadingPreview(false);
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header - Same pattern as InvoiceDetailScreen */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Invoice PDF</Text>
          </View>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isGeneratingPDF || !pdfUri}
          >
            <Ionicons
              name={isGeneratingPDF ? "hourglass-outline" : "share-outline"}
              size={24}
              color={
                isGeneratingPDF || isLoadingPreview
                  ? Colors.textLight
                  : Colors.text
              }
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoadingPreview ? (
            <View style={styles.loadingContainer}>
              <Ionicons
                name="document-text"
                size={80}
                color={Colors.primary || Colors.black}
              />
              <Text style={styles.loadingText}>Generating PDF preview...</Text>
              <Text style={styles.loadingSubtext}>
                Please wait while we create your preview
              </Text>
            </View>
          ) : pdfUri ? (
            <View style={styles.pdfContainer}>
              <WebView
                source={{
                  html: `
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                          * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                          }
                          html, body {
                            width: 100%;
                            height: 100%;
                            overflow: hidden;
                            background: #f8f9fa;
                          }
                          embed {
                            width: 100%;
                            height: 100%;
                            border: none;
                            object-fit: contain;
                          }
                        </style>
                      </head>
                      <body>
                        <embed src="${pdfUri}" type="application/pdf" />
                      </body>
                    </html>
                  `,
                }}
                style={styles.webview}
                showsVerticalScrollIndicator={true}
                showsHorizontalScrollIndicator={false}
                startInLoadingState={true}
                scalesPageToFit={Platform.OS === "android"}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                mixedContentMode="compatibility"
                onError={(error) => {
                  console.error("PDF WebView error:", error);
                  Alert.alert(
                    "PDF Preview Error",
                    "Failed to display PDF preview. The content may be too large."
                  );
                }}
                onLoadStart={() => console.log("PDF WebView loading started")}
                onLoadEnd={() => console.log("PDF WebView loading completed")}
                onMessage={(event) =>
                  console.log("WebView message:", event.nativeEvent.data)
                }
              />
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={60} color={Colors.danger} />
              <Text style={styles.errorText}>
                Failed to generate PDF preview
              </Text>
              <Text style={styles.errorSubtext}>
                Please check your invoice data and try again
              </Text>
              <TouchableOpacity
                onPress={loadPDFPreview}
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
              (isGeneratingPDF || isLoadingPreview) && styles.buttonDisabled,
            ]}
            onPress={handleShare}
            disabled={isGeneratingPDF || isLoadingPreview}
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
    backgroundColor: Colors.backgroundSecondary || "#f8f9fa",
    padding: Spacing.lg,
  },
  pdfContainer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.white,
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: Colors.border || "#e0e6ed",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
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
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  successText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  successSubtext: {
    fontSize: Typography.sizes.base,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  invoiceNumber: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  regenerateText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.weights.medium,
  },
});
