import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { InvoicesListScreen } from "../screens/invoices/InvoicesListScreen";
import { InvoiceDetailScreen } from "../screens/invoices/InvoiceDetailScreen";
import { InvoicePreviewScreen } from "../screens/invoices/InvoicePreviewScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { TaxSettingsScreen } from "../screens/settings/TaxSettingsScreen";
import { IssuerSettingsScreen } from "../screens/settings/IssuerSettingsScreen";
import { PDFGenerationOptions } from "../types/pdf";

export type InvoiceStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: { invoiceId?: number };
  InvoicePreview: {
    invoiceData: PDFGenerationOptions;
    invoiceNumber: number;
  };
  Settings: undefined;
  TaxSettings: undefined;
  IssuerSettings: undefined;
};

const Stack = createStackNavigator<InvoiceStackParamList>();

export const InvoiceStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="InvoicesList" component={InvoicesListScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="TaxSettings" component={TaxSettingsScreen} />
      <Stack.Screen name="IssuerSettings" component={IssuerSettingsScreen} />
    </Stack.Navigator>
  );
};
