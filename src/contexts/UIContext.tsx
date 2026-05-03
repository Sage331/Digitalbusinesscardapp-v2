import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Dimensions 
} from 'react-native';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface UIContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Toast Auto-hide logic
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirm({ title, message, onConfirm });
  };

  return (
    <UIContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* 🍞 BRANDED NATIVE TOAST */}
      {toast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastPill}>
            {toast.type === 'success' ? (
              <CheckCircle size={20} color="#4ade80" />
            ) : (
              <AlertCircle size={20} color="#f87171" />
            )}
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </View>
      )}

      {/* ⚠️ BRANDED NATIVE CONFIRMATION MODAL */}
      <Modal
        visible={!!confirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirm(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* ✅ FIX: Replaced <h3> with <Text style={styles.modalTitle}> */}
            <Text style={styles.modalTitle}>{confirm?.title}</Text>
            <Text style={styles.modalMessage}>{confirm?.message}</Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                onPress={() => setConfirm(null)} 
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => { confirm?.onConfirm(); setConfirm(null); }} 
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmBtnText}>{t('common.confirm', 'Confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </UIContext.Provider>
  );
};

const styles = StyleSheet.create({
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  toastText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ef4444',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};