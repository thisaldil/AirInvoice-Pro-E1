import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const PdfInvoice = ({ invoiceData, templateData }) => {
  // Fallbacks for template fields
  const company = templateData?.company || {};
  const design = templateData?.design || {};
  const accentColor = design.accentColor || "#3B82F6";
  const showFooter = design.showFooter !== false;
  const footerText = design.footerText || "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logo && (
              <Image src={company.logo} style={styles.logo} />
            )}
            <Text style={{ ...styles.companyName, color: accentColor }}>
              {company.name || ""}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ ...styles.invoiceTitle, color: accentColor }}>
              INVOICE
            </Text>
            <Text style={styles.bookingRef}>
              Booking Ref: {invoiceData?.bookingReference || ""}
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("en-US", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>
        {/* Company & Client Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoText}>
              {company.address || "123 Business Street\nCity, State 12345\nPhone: (123) 456-7890\nEmail: info@yourcompany.com"}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            {Array.isArray(invoiceData?.passengerName) && invoiceData.passengerName.length > 0 ? (
              invoiceData.passengerName.map((name, idx) => (
                <View key={idx} style={styles.passengerBlock}>
                  <Text style={styles.passengerName}>{name}</Text>
                  <Text style={styles.passengerDetail}>Passport: {invoiceData.passengers?.[idx]?.passportNumber || "--"}</Text>
                  <Text style={styles.passengerDetail}>Nationality: {invoiceData.passengers?.[idx]?.nationality || "--"}</Text>
                  <Text style={styles.passengerDetail}>DOB: {invoiceData.passengers?.[idx]?.dob || "--"}</Text>
                  <Text style={styles.passengerDetail}>Gender: {invoiceData.passengers?.[idx]?.gender || "--"}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.infoText}>No passenger details available.</Text>
            )}
          </View>
        </View>
        {/* Flight Details */}
        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: accentColor }}>
            Flight Details
          </Text>
          {invoiceData?.flightDetails?.map((flight, i) => (
            <View key={i} style={styles.flightBlock}>
              <View style={styles.flightHeader}>
                <Text style={styles.flightNumber}>
                  {flight.flightNumber || `Flight #${i + 1}`}
                </Text>
                <Text style={{ ...styles.flightClass, color: accentColor }}>
                  {flight.class}
                </Text>
              </View>
              <View style={styles.flightInfoRow}>
                <View style={styles.flightInfoCol}>
                  <Text style={styles.flightLabel}>From</Text>
                  <Text style={styles.flightValue}>{flight.from}</Text>
                  <Text style={styles.flightDate}>
                    {flight.departureDate} at {flight.departureTime}
                  </Text>
                </View>
                <View style={styles.flightInfoCol}>
                  <Text style={styles.flightLabel}>To</Text>
                  <Text style={styles.flightValue}>{flight.to}</Text>
                  <Text style={styles.flightDate}>
                    {flight.arrivalDate} at {flight.arrivalTime}
                  </Text>
                </View>
              </View>
              <Text style={styles.flightFooter}>
                Airline: {flight.airline || "-"} | Terminal: {flight.departureTerminal || "-"}
              </Text>
            </View>
          ))}
        </View>
        {/* Pricing */}
        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: accentColor }}>
            Pricing Details
          </Text>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Total Amount</Text>
            <Text style={styles.pricingValue}>
              {invoiceData?.currency || "USD"} {invoiceData?.totalAmount || "--"}
            </Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Payment Method</Text>
            <Text style={styles.pricingValue}>
              {invoiceData?.paymentMethod || "--"}
            </Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Transaction ID</Text>
            <Text style={styles.pricingValue}>
              {invoiceData?.transactionId || "--"}
            </Text>
          </View>
        </View>
        {/* Footer */}
        {showFooter && (
          <View style={{ ...styles.footer, backgroundColor: accentColor + "20" }}>
            <Text style={styles.footerText}>{footerText}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1 solid #eee",
    paddingBottom: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
    width: "50%",
  },
  logo: {
    height: 40,
    width: 100,
    marginBottom: 8,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "medium",
  },
  headerRight: {
    alignItems: "flex-end",
    width: "50%",
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: "medium",
    marginBottom: 4,
  },
  bookingRef: {
    color: "#666",
    marginBottom: 2,
  },
  date: {
    color: "#666",
    fontSize: 10,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    borderBottom: "1 solid #eee",
    paddingBottom: 16,
  },
  infoBlock: {
    width: "48%",
  },
  infoLabel: {
    fontSize: 10,
    color: "#888",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: "#222",
    whiteSpace: "pre-line",
  },
  passengerBlock: {
    marginBottom: 6,
    borderBottom: "1 solid #eee",
    paddingBottom: 4,
  },
  passengerName: {
    fontWeight: "medium",
    fontSize: 11,
    marginBottom: 2,
  },
  passengerDetail: {
    fontSize: 10,
    color: "#444",
  },
  section: {
    marginBottom: 16,
    borderBottom: "1 solid #eee",
    paddingBottom: 12,
  },
  sectionTitle: {
    fontWeight: "medium",
    fontSize: 13,
    marginBottom: 8,
  },
  flightBlock: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  flightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  flightNumber: {
    fontWeight: "medium",
    fontSize: 12,
  },
  flightClass: {
    fontSize: 11,
    fontWeight: "medium",
  },
  flightInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  flightInfoCol: {
    width: "48%",
  },
  flightLabel: {
    fontSize: 10,
    color: "#888",
  },
  flightValue: {
    fontSize: 11,
    fontWeight: "medium",
  },
  flightDate: {
    fontSize: 10,
    color: "#444",
  },
  flightFooter: {
    fontSize: 10,
    color: "#555",
    marginTop: 2,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  pricingLabel: {
    color: "#666",
    fontSize: 11,
  },
  pricingValue: {
    fontWeight: "medium",
    fontSize: 11,
  },
  footer: {
    marginTop: 24,
    padding: 12,
    borderRadius: 4,
    textAlign: "center",
  },
  footerText: {
    color: "#333",
    fontSize: 11,
    textAlign: "center",
  },
});

export default PdfInvoice;