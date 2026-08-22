import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { BillItem } from '../db/schema';

import notoSansFont from '../assets/fonts/NotoSansDevanagari-Regular.ttf';

// Register the Hindi font
Font.register({
  family: 'NotoSansDevanagari',
  src: notoSansFont
});

const MAROON = '#761219';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'NotoSansDevanagari',
    fontSize: 10,
    padding: 15, // Page margin
  },
  pageBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: MAROON,
    flexDirection: 'column',
  },
  headerBanner: {
    backgroundColor: MAROON,
    color: '#FFFFFF',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  headerLogoArea: {
    width: '20%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoKJ: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  logoText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCenter: {
    width: '60%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topText: {
    fontSize: 8,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 26,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 9,
  },
  headerRight: {
    width: '20%',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  metaSection: {
    padding: 8,
    borderBottomWidth: 2,
    borderColor: MAROON,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  table: {
    flex: 1,
    flexDirection: 'column',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: MAROON,
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: MAROON,
  },
  tableHeaderCol: {
    borderRightWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: MAROON,
    height: 22,
    overflow: 'hidden',
  },
  tableCol: {
    borderRightWidth: 1,
    borderColor: MAROON,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  // Column definitions
  col1: { width: '25%' }, // जेवर का नाम
  col2: { width: '12%' }, // HSN Code
  col3: { width: '33%' }, // तौल (ग्राम / मि. ग्राम)
  col4: { width: '15%' }, // दर प्रति 10 ग्रा
  col5: { width: '15%', borderRightWidth: 0 }, // कीमत बनवाई सहित
  
  // Weight sub-columns
  weightHeaderTop: {
    borderBottomWidth: 1,
    borderColor: '#FFFFFF',
    width: '100%',
    textAlign: 'center',
    paddingVertical: 2,
  },
  weightHeaderBottom: {
    flexDirection: 'row',
    width: '100%',
  },
  weightSubColLeft: {
    width: '50%',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 2,
  },
  weightSubColRight: {
    width: '50%',
    textAlign: 'center',
    paddingVertical: 2,
  },
  
  // Weight data sub-columns
  weightDataLeft: {
    width: '50%',
    borderRightWidth: 1,
    borderColor: MAROON,
    justifyContent: 'center',
    textAlign: 'right',
    paddingRight: 4,
    height: '100%',
  },
  weightDataRight: {
    width: '50%',
    justifyContent: 'center',
    textAlign: 'right',
    paddingRight: 4,
    height: '100%',
  },

  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },
  
  totalsContainer: {
    flexDirection: 'row',
  },
  totalsSpacer: {
    width: '70%',
    borderRightWidth: 1,
    borderColor: MAROON,
  },
  totalsBox: {
    width: '30%',
    flexDirection: 'column',
  },
  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: MAROON,
  },
  totalLabel: {
    width: '50%',
    borderRightWidth: 1,
    borderColor: MAROON,
    padding: 4,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  totalValue: {
    width: '50%',
    padding: 4,
    textAlign: 'right',
  },
  bgYellow: { backgroundColor: '#FDE047' },
  bgLightYellow: { backgroundColor: '#FEF08A' },
  bgBlue: { backgroundColor: '#93C5FD' },

  footer: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 50,
  },
  gstinBox: {
    backgroundColor: MAROON,
    color: '#FFFFFF',
    padding: 4,
    fontWeight: 'bold',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  jurisdictionText: {
    fontSize: 9,
  },
  signatureBox: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#000',
    marginTop: 30,
    marginBottom: 5,
  }
});

interface InvoicePDFProps {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerVillage?: string;
  items: Partial<BillItem>[];
  totals: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    grandTotal: number;
  };
  cgstRate: number;
  sgstRate: number;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ 
  invoiceNumber, 
  date, 
  customerName,
  customerPhone = '',
  customerVillage = '',
  items, 
  totals,
  cgstRate,
  sgstRate
}) => {
  // Pad items to ensure table has enough rows, but only up to 4 instead of 5
  // This guarantees the footer perfectly fits on the exact same A5 page 
  // without needing to shrink the visual sizes of the invoice.
  const displayItems = [...items];
  while (displayItems.length < 4) {
    displayItems.push({});
  }

  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.pageBorder} wrap={false}>
          
          {/* HEADER */}
          <View style={styles.headerBanner}>
            <View style={styles.headerLogoArea}>
              <View style={styles.logoKJ}>
                <Text style={styles.logoText}>KJ</Text>
              </View>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.topText}>|| श्री गणेशाय नम: ||</Text>
              <Text style={styles.titleText}>खरया ज्वेलर्स</Text>
              <Text style={styles.subtitleText}>सराफा बाजार, मेन रोड गोटेगांव (श्रीधाम), जिला - नरसिंहपुर (म.प्र.)</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={{ fontSize: 9 }}>मो. 0267925123</Text>
            </View>
          </View>

          {/* META SECTION */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Text>क्रमांक - {invoiceNumber}</Text>
              <Text>दिनांक - {date}</Text>
            </View>
            <View style={[styles.metaRow, { marginBottom: 0 }]}>
              <Text style={{ width: '40%' }}>नाम श्री {customerName}</Text>
              <Text style={{ width: '30%', textAlign: 'center' }}>मो. {customerPhone}</Text>
              <Text style={{ width: '30%', textAlign: 'right' }}>ग्राम {customerVillage}</Text>
            </View>
          </View>

          {/* TABLE */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <View style={[styles.tableHeaderCol, styles.col1]}><Text style={{ padding: 4 }}>जेवर का नाम</Text></View>
              <View style={[styles.tableHeaderCol, styles.col2]}><Text style={{ padding: 4 }}>HSN Code</Text></View>
              <View style={[styles.tableHeaderCol, styles.col3, { padding: 0 }]}>
                <Text style={styles.weightHeaderTop}>तौल</Text>
                <View style={styles.weightHeaderBottom}>
                  <Text style={styles.weightSubColLeft}>ग्राम</Text>
                  <Text style={styles.weightSubColRight}>मि. ग्राम</Text>
                </View>
              </View>
              <View style={[styles.tableHeaderCol, styles.col4]}><Text style={{ padding: 4 }}>दर प्रति 10 ग्रा</Text></View>
              <View style={[styles.tableHeaderCol, styles.col5, { borderRightWidth: 0 }]}><Text style={{ padding: 4 }}>कीमत बनवाई सहित</Text></View>
            </View>

            {/* Table Rows */}
            {displayItems.map((item, index) => {
              const qtyStr = item.quantity?.toString() || '';
              const [gram, mg] = qtyStr.includes('.') ? qtyStr.split('.') : [qtyStr, ''];

              return (
                <View style={[styles.tableRow, { borderBottomWidth: index === displayItems.length - 1 ? 0 : 1 }]} key={index}>
                  <View style={[styles.tableCol, styles.col1]}>
                    <Text>{item.description || ' '}</Text>
                  </View>
                  <View style={[styles.tableCol, styles.col2, styles.textCenter]}><Text>{item.quantity ? '7113' : ' '}</Text></View>
                  <View style={[styles.tableCol, styles.col3, { paddingHorizontal: 0, flexDirection: 'row' }]}>
                    <View style={styles.weightDataLeft}><Text>{gram}</Text></View>
                    <View style={styles.weightDataRight}><Text>{mg ? mg.padEnd(3, '0') : (item.quantity ? '000' : ' ')}</Text></View>
                  </View>
                  <View style={[styles.tableCol, styles.col4, styles.textRight]}><Text>{item.rate ? item.rate.toFixed(2) : ' '}</Text></View>
                  <View style={[styles.tableCol, styles.col5, styles.textRight, { borderRightWidth: 0 }]}><Text>{(item.quantity && item.rate) ? (item.quantity * item.rate).toFixed(2) : ' '}</Text></View>
                </View>
              );
            })}
            
            {/* Fill space if needed */}
            <View style={{ flex: 1 }} />
            
            {/* BOTTOM BORDER BEFORE TOTALS */}
            <View style={{ borderTopWidth: 1, borderColor: MAROON }} />

            {/* TOTALS OVERLAY */}
            <View style={styles.totalsContainer}>
              <View style={styles.totalsSpacer} />
              
              <View style={styles.totalsBox}>
                <View style={[styles.totalRow, styles.bgYellow]}>
                  <Text style={styles.totalLabel}>CGST {cgstRate}% -</Text>
                  <Text style={styles.totalValue}>{totals.cgst.toFixed(2)}</Text>
                </View>
                <View style={[styles.totalRow, styles.bgYellow]}>
                  <Text style={styles.totalLabel}>SGST {sgstRate}% -</Text>
                  <Text style={styles.totalValue}>{totals.sgst.toFixed(2)}</Text>
                </View>
                <View style={[styles.totalRow, styles.bgYellow]}>
                  <Text style={styles.totalLabel}>Total -</Text>
                  <Text style={styles.totalValue}>{totals.grandTotal.toFixed(2)}</Text>
                </View>
                <View style={[styles.totalRow, { borderBottomWidth: 0 }]}>
                  <View style={[styles.totalLabel, styles.bgLightYellow]}><Text>C P -</Text></View>
                  <View style={[styles.totalValue, styles.bgBlue]}><Text>O P -</Text></View>
                </View>
              </View>
            </View>

          </View>

          {/* FOOTER */}
          <View style={{ borderTopWidth: 1, borderColor: MAROON }} />
          <View style={styles.footer}>
            <View>
              <View style={styles.gstinBox}>
                <Text>GSTIN - 23CKDPK3901K1ZE</Text>
              </View>
              <Text style={styles.jurisdictionText}>नरसिंहपुर न्याय क्षेत्र के अंतर्गत</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text>हस्ताक्षर खरीददार</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text>हस्ताक्षर दुकानदार</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
};
