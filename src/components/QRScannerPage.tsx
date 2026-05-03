import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Vibration 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { ArrowLeft } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../contexts/ThemeContext'; // ✅ Global Theme Sync

interface QRScannerPageProps {
  onScan: (data: string, reset: () => void) => void;
  onBack: () => void;
}

export function QRScannerPage({ onScan, onBack }: QRScannerPageProps) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  
  // ✅ Hooked into Central Theme
  const { theme } = useTheme();

  useEffect(() => {
    if (permission?.status === 'undetermined') {
      requestPermission();
    }
  }, [permission?.status]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centered} edges={['bottom']}>
        <Text style={styles.errorText}>{t('qr.scanner.error', 'Camera access needed.')}</Text>
        <TouchableOpacity 
          onPress={requestPermission} 
          style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.permissionBtnText}>Enable Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = (result: any) => {
    if (scanned) return;

    const fullData = result.raw || result.data;
    console.log("📸 RAW QR DATA SCANNED:", fullData);

    if (fullData) {
      Vibration.vibrate(100);
      setScanned(true); 

      onScan(fullData, () => setScanned(false));
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        responsiveOrientationWhenOrientationLocked={false}
      />

      <SafeAreaView style={styles.headerOverlay} edges={['bottom']}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.overlayFrame}>
        <View style={styles.scanBox}>
          {/* ✅ Connect scanner frame to theme.primary */}
          <View style={[styles.corner, styles.topLeft, { borderColor: theme.primary }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: theme.primary }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.primary }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: theme.primary }]} />
        </View>
      </View>

      <View style={styles.footerOverlay}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {scanned ? "⌛ " + t('common.processing', 'Processing...') : t('qr.scanner.align', 'Align QR inside the frame')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', padding: 20 },
  errorText: { color: 'white', fontSize: 16, marginBottom: 20 },
  permissionBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permissionBtnText: { color: 'white', fontWeight: 'bold' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 6, paddingBottom: 12 },
  backButton: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  overlayFrame: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 280, height: 280, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  footerOverlay: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
  pill: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  pillText: { color: 'white', fontWeight: 'bold' }
});