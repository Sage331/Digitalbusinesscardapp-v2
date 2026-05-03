import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { useTranslation } from 'react-i18next';

interface TourGuideProps {
    isVisible: boolean;
    currentStep: number;
    targetY: number;
    targetX: number;
    targetWidth: number;
    onNext: () => void;
    onFinish: () => void;
}

export function TourGuide({ 
    isVisible, 
    currentStep, 
    targetY, 
    targetX, 
    targetWidth, 
    onNext, 
    onFinish 
}: TourGuideProps) {
    const { t } = useTranslation();

    if (!isVisible || targetY === 0) return null;

    const steps = [
        { title: t('guide.edit.title'), desc: t('guide.edit.desc') },
        { title: t('guide.share.title'), desc: t('guide.share.desc') },
        { title: t('guide.scan.title'), desc: t('guide.scan.desc') },
        { title: t('guide.contacts.title'), desc: t('guide.contacts.desc') },
    ];

    // 🚀 THE CALCULATION LOGIC
    // We position the bubble exactly 200 pixels above the target's absolute Y position
    const bubbleTop = targetY - 200; 

    // Center the arrow on the target button's center
    const arrowLeft = targetX + (targetWidth / 2) - 12;

    return (
        <View style={StyleSheet.absoluteFill}>
            <View style={styles.overlay} />
            <View style={[styles.bubble, { top: bubbleTop }]}>
                {/* 🔺 DYNAMIC ARROW */}
                <View style={[styles.arrow, { left: arrowLeft }]} />

                <Text style={styles.title}>{steps[currentStep].title}</Text>
                <Text style={styles.desc}>{steps[currentStep].desc}</Text>
                
                <TouchableOpacity 
                    style={styles.btn}
                    onPress={currentStep === steps.length - 1 ? onFinish : onNext}
                >
                    <Text style={styles.btnText}>
                        {currentStep === steps.length - 1 ? t('common.gotIt') : t('common.next')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 100 },
    bubble: { position: 'absolute', width: '90%', alignSelf: 'center', backgroundColor: 'white', borderRadius: 24, padding: 24, zIndex: 101, elevation: 20 },
    arrow: { position: 'absolute', bottom: -8, width: 24, height: 24, backgroundColor: 'white', transform: [{ rotate: '45deg' }], zIndex: -1 },
    title: { fontSize: 20, fontWeight: '900', color: '#2563eb', marginBottom: 8 },
    desc: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 24 },
    btn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});