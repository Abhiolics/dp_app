import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  Image as ImageIcon,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CredIcon,
  GooglePayIcon,
  PaytmIcon,
  PhonePeIcon,
} from '../components/UpiAppIcons';
import { useAuth } from '../context/AuthContext';
import {
  DepositItem,
  detectInstalledUpiApps,
  getDeposits,
  getFullImageUrl,
  getPaymentMethods,
  getPlans,
  launchUpiPayment,
  MembershipPlan,
  PaymentMethods,
  submitDeposit,
  SupportedUpiApp,
} from '../services';

export default function DepositScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { planId: initialPlanId, planAmount: initialPlanAmount } = useLocalSearchParams<{
    planId?: string;
    planAmount?: string;
  }>();

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 8;
  const bottomPadding = Math.max(insets.bottom, 16);
  const { refreshUserData } = useAuth();

  const [activeTab, setActiveTab] = useState<'deposit' | 'history'>('deposit');

  // API data
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [depositHistory, setDepositHistory] = useState<DepositItem[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form State
  const [amount, setAmount] = useState(initialPlanAmount || '500');
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(initialPlanId);
  const [utr, setUtr] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEditAmountModal, setShowEditAmountModal] = useState(false);
  const [tempAmount, setTempAmount] = useState(amount);
  const [showPickerSheet, setShowPickerSheet] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // QR Blur State (matches Image 1)
  const [isQrBlurred, setIsQrBlurred] = useState(true);

  // Downloaded UPI Apps State (matches Image 2)
  const [installedApps, setInstalledApps] = useState<SupportedUpiApp[]>([]);
  const [isDetectingApps, setIsDetectingApps] = useState(true);
  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);

  // Check which UPI apps are downloaded on device
  useEffect(() => {
    let isMounted = true;
    const checkApps = async () => {
      setIsDetectingApps(true);
      try {
        const apps = await detectInstalledUpiApps();
        if (isMounted) {
          setInstalledApps(apps);
        }
      } catch (err) {
        console.warn('Failed detecting installed UPI apps:', err);
      } finally {
        if (isMounted) {
          setIsDetectingApps(false);
        }
      }
    };

    checkApps();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load payment methods and plans
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingMethods(true);
        const [methods, plansList] = await Promise.all([
          getPaymentMethods().catch(() => null),
          getPlans().catch(() => []),
        ]);
        if (methods) setPaymentMethods(methods);
        setPlans(plansList);

        // If planAmount wasn't passed, check if plans exist and set default
        if (!initialPlanAmount && plansList && plansList.length > 0) {
          setAmount(String(plansList[0].amount));
          setSelectedPlanId(plansList[0]._id);
          setTempAmount(String(plansList[0].amount));
        }
      } catch (err) {
        console.warn('Failed loading deposit options:', err);
      } finally {
        setIsLoadingMethods(false);
      }
    };

    loadInitialData();
  }, [initialPlanAmount]);

  // Load history when tab is clicked
  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await getDeposits();
      setDepositHistory(history);
    } catch (err) {
      console.warn('Failed loading deposits history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const bank = paymentMethods?.bankAccount;
  const qr = paymentMethods?.qrCode;
  const upiId = qr?.upiId || bank?.upiId || 'pal3424@fam';
  const customQrImage = qr?.imageUrl ? getFullImageUrl(qr.imageUrl) : '';

  // Generate dynamic QR code URL based on current amount and UPI ID
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=DreamPay&am=${amount || '1000'}&cu=INR`
  )}`;
  const displayQrUrl = customQrImage || dynamicQrUrl;

  const handleLaunchUpiApp = async (app?: SupportedUpiApp) => {
    setLaunchingAppId(app ? app.id : 'generic');
    try {
      await launchUpiPayment({
        app,
        upiId,
        amount: amount || '1000',
        name: 'DreamPay Deposit',
      });
    } finally {
      setTimeout(() => {
        setLaunchingAppId(null);
      }, 1500);
    }
  };

  const handleCopyUpi = async () => {
    await Clipboard.setStringAsync(upiId);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  const handlePickFromGallery = async () => {
    setShowPickerSheet(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to attach your payment receipt screenshot.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setScreenshotUri(result.assets[0].uri);
      setSubmitError(null);
    }
  };

  const handleTakePhoto = async () => {
    setShowPickerSheet(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take a photo of the receipt.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setScreenshotUri(result.assets[0].uri);
      setSubmitError(null);
    }
  };

  const handleSaveAmount = () => {
    const clean = tempAmount.replace(/[^0-9]/g, '');
    if (clean && Number(clean) > 0) {
      setAmount(clean);
    }
    setShowEditAmountModal(false);
  };

  const handleSelectPlan = (plan: MembershipPlan) => {
    setSelectedPlanId(plan._id);
    setAmount(String(plan.amount));
    setTempAmount(String(plan.amount));
    setShowEditAmountModal(false);
  };

  const isFormValid =
    Boolean(amount) && Number(amount) > 0 && utr.trim().length >= 6 && Boolean(screenshotUri);

  const handleSubmit = async () => {
    if (!utr.trim()) {
      setSubmitError('Please enter the 12-digit UTR / Reference number from your payment receipt.');
      return;
    }
    if (utr.trim().length < 6) {
      setSubmitError('Please enter a valid 12-digit UTR number.');
      return;
    }
    if (!screenshotUri) {
      setSubmitError('Please attach a screenshot of your payment receipt.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitDeposit(Number(amount), utr.trim(), screenshotUri, selectedPlanId);
      setIsSubmitting(false);
      setShowSuccessModal(true);
      await refreshUserData();
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'Deposit submission failed. Please try again.');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setUtr('');
    setScreenshotUri(null);
    setActiveTab('history');
  };

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => {
            if (activeTab === 'history') {
              setActiveTab('deposit');
            } else {
              router.back();
            }
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Deposit</Text>

        <TouchableOpacity
          style={[styles.circleButton, activeTab === 'history' && styles.circleButtonActive]}
          onPress={() => setActiveTab(activeTab === 'deposit' ? 'history' : 'deposit')}
          activeOpacity={0.7}
        >
          <Clock size={19} color={activeTab === 'history' ? '#0A0B10' : '#F59E0B'} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {activeTab === 'deposit' ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 88 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION 1: UPI PAYMENT */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <QrCode size={18} color="#F59E0B" strokeWidth={2.4} />
            </View>
            <Text style={styles.sectionTitle}>UPI Payment</Text>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrCard}>
            {isLoadingMethods ? (
              <View style={styles.qrLoaderBox}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.qrLoaderText}>Generating secure UPI QR code...</Text>
              </View>
            ) : (
              <View style={styles.qrFrameWrapper}>
                {/* Gold glowing corner brackets */}
                <View style={styles.cornerBracketTL} />
                <View style={styles.cornerBracketBR} />

                <View style={styles.qrInnerContainer}>
                  <Image
                    source={{ uri: displayQrUrl }}
                    style={styles.qrImage}
                    blurRadius={isQrBlurred ? (Platform.OS === 'ios' ? 24 : 16) : 0}
                    resizeMode="contain"
                  />

                  {/* Centered Zoom button when blurred */}
                  {isQrBlurred && (
                    <TouchableOpacity
                      style={styles.qrCenterZoomBtn}
                      onPress={() => setIsQrBlurred(false)}
                      activeOpacity={0.82}
                    >
                      <ZoomIn size={32} color="#F59E0B" strokeWidth={2.4} />
                    </TouchableOpacity>
                  )}

                  {/* Hide QR Pill when unblurred */}
                  {!isQrBlurred && (
                    <TouchableOpacity
                      style={styles.hideQrPill}
                      onPress={() => setIsQrBlurred(true)}
                      activeOpacity={0.78}
                    >
                      <ZoomOut size={13} color="#F59E0B" strokeWidth={2.2} />
                      <Text style={styles.hideQrPillText}>Hide QR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* CTA: View QR (when blurred) or scan instruction */}
          {isQrBlurred ? (
            <View style={styles.viewQrCtaContainer}>
              <TouchableOpacity
                style={styles.viewQrCtaBtn}
                onPress={() => setIsQrBlurred(false)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FDE047', '#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.viewQrGradient}
                >
                  <ZoomIn size={16} color="#0A0B10" strokeWidth={2.5} />
                  <Text style={styles.viewQrCtaText}>View QR Code</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.scanSubtitle}>Tap above or center icon to unblur</Text>
            </View>
          ) : (
            <Text style={styles.scanSubtitle}>Scan with any UPI app to pay</Text>
          )}

          {/* UPI ID Row */}
          <View style={styles.upiRow}>
            <Text style={styles.upiLabel}>UPI ID: </Text>
            <Text style={styles.upiValue}>{upiId}</Text>
            <TouchableOpacity
              onPress={handleCopyUpi}
              style={styles.copyBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {copiedFeedback ? (
                <Check size={16} color="#10B981" strokeWidth={2.5} />
              ) : (
                <Copy size={16} color="#F59E0B" strokeWidth={2} />
              )}
            </TouchableOpacity>
            {copiedFeedback && (
              <View style={styles.copiedTag}>
                <Text style={styles.copiedTagText}>Copied</Text>
              </View>
            )}
          </View>

          {/* Amount Row */}
          <TouchableOpacity
            style={styles.amountRow}
            onPress={() => {
              setTempAmount(amount);
              setShowEditAmountModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.amountLabel}>Amount</Text>
            <View style={styles.amountValueBox}>
              <Text style={styles.amountValue}>₹{Number(amount || 0).toLocaleString()}</Text>
              <View style={styles.amountEditPill}>
                <Edit2 size={12} color="#F59E0B" />
              </View>
            </View>
          </TouchableOpacity>

          {/* SECTION: PAY WITH UPI APPS (PG STYLE) */}
          <View style={styles.pgSectionCard}>
            <View style={styles.pgSectionHeader}>
              <View style={styles.pgHeaderIconBadge}>
                <Smartphone size={18} color="#F59E0B" strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.pgSectionTitle}>Pay with UPI Apps</Text>
                <Text style={styles.pgSectionSubtitle}>
                  {installedApps.length > 0
                    ? `${installedApps.length} installed app${installedApps.length > 1 ? 's' : ''} detected on device`
                    : 'Instant 1-tap direct checkout'}
                </Text>
              </View>

              {/* Overlapping circular brand logos preview */}
              <View style={styles.pgOverlapLogosRow}>
                <View style={[styles.pgMiniLogo, { zIndex: 4, marginLeft: 0 }]}>
                  <GooglePayIcon size={26} />
                </View>
                <View style={[styles.pgMiniLogo, { zIndex: 3, marginLeft: -8 }]}>
                  <PhonePeIcon size={26} />
                </View>
                <View style={[styles.pgMiniLogo, { zIndex: 2, marginLeft: -8 }]}>
                  <PaytmIcon size={26} />
                </View>
                <View style={[styles.pgMiniLogo, { zIndex: 1, marginLeft: -8 }]}>
                  <CredIcon size={26} />
                </View>
              </View>
            </View>

            {isDetectingApps ? (
              <View style={styles.pgLoadingRow}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={styles.pgLoadingText}>Checking available UPI apps on your phone...</Text>
              </View>
            ) : installedApps.length > 0 ? (
              /* User has installed apps on phone -> show ONLY those installed apps! */
              <View style={styles.pgAppsList}>
                {installedApps.map((app) => {
                  const isLaunching = launchingAppId === app.id;
                  return (
                    <TouchableOpacity
                      key={app.id}
                      style={styles.pgAppOption}
                      onPress={() => handleLaunchUpiApp(app)}
                      activeOpacity={0.78}
                      disabled={Boolean(launchingAppId)}
                    >
                      <View style={styles.pgAppOptionLeft}>
                        <View style={styles.pgAppLogoWrapper}>
                          {app.renderLogo(44)}
                        </View>
                        <View style={styles.pgAppMeta}>
                          <View style={styles.pgAppNameRow}>
                            <Text style={styles.pgAppName}>{app.name}</Text>
                            <View style={styles.pgInstalledTag}>
                              <Check size={9} color="#15803D" strokeWidth={3} />
                              <Text style={styles.pgInstalledTagText}>INSTALLED</Text>
                            </View>
                          </View>
                          <Text style={styles.pgAppDesc}>
                            Pay ₹{Number(amount || 0).toLocaleString()} directly via {app.name}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.pgPayNowBtn, { backgroundColor: app.primaryColor }]}>
                        {isLaunching ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.pgPayNowBtnText}>PAY NOW</Text>
                            <ChevronRight size={13} color="#FFFFFF" strokeWidth={2.6} />
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* If no apps detected (e.g. simulator/web) */
              <View style={styles.pgFallbackBox}>
                <View style={styles.pgFallbackTop}>
                  <Text style={styles.pgFallbackTitle}>Pay via Any UPI App</Text>
                  <Text style={styles.pgFallbackSub}>
                    Launch your device's UPI payment sheet (PhonePe, Paytm, GPay, etc.)
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.pgOpenChooserBtn}
                  onPress={() => handleLaunchUpiApp()}
                  activeOpacity={0.85}
                  disabled={Boolean(launchingAppId)}
                >
                  <LinearGradient
                    colors={['#FDE047', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pgChooserGradient}
                  >
                    {launchingAppId ? (
                      <ActivityIndicator size="small" color="#0A0B10" />
                    ) : (
                      <>
                        <ExternalLink size={16} color="#0A0B10" strokeWidth={2.4} />
                        <Text style={styles.pgChooserBtnText}>
                          Pay ₹{Number(amount || 0).toLocaleString()} via UPI App
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Note banner */}
            <View style={styles.pgTipBanner}>
              <Sparkles size={13} color="#F59E0B" strokeWidth={2.2} />
              <Text style={styles.pgTipText}>
                After payment in your UPI app, enter the 12-digit UTR and upload your screenshot below.
              </Text>
            </View>
          </View>

          {/* SECTION 2: PAYMENT VERIFICATION */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <View style={styles.sectionIconBadge}>
              <ShieldCheck size={18} color="#F59E0B" strokeWidth={2.4} />
            </View>
            <Text style={styles.sectionTitle}>Payment Verification</Text>
          </View>
          <Text style={styles.verificationSubtitle}>
            Enter the UTR number and upload a screenshot of your payment
          </Text>

          {/* Field: UTR Number */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>UTR Number</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={utr}
                onChangeText={(val) => {
                  setUtr(val);
                  if (submitError) setSubmitError(null);
                }}
                placeholder="e.g. 3452XXXXXX21"
                placeholderTextColor="#64748B"
                autoCapitalize="characters"
              />
              {utr.length > 0 && (
                <TouchableOpacity onPress={() => setUtr('')} style={styles.clearBtn}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Field: Payment Screenshot */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Payment Screenshot</Text>

            {screenshotUri ? (
              <View style={styles.screenshotPreviewCard}>
                <Image source={{ uri: screenshotUri }} style={styles.screenshotThumb} />
                <View style={styles.screenshotInfo}>
                  <View style={styles.screenshotStatusRow}>
                    <CheckCircle2 size={15} color="#10B981" strokeWidth={2.5} />
                    <Text style={styles.screenshotStatusText}>Receipt attached</Text>
                  </View>
                  <Text style={styles.screenshotSubText}>Ready for verification</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeScreenshotBtn}
                  onPress={() => setScreenshotUri(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={17} color="#EF4444" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadPlaceholderCard}
                onPress={() => setShowPickerSheet(true)}
                activeOpacity={0.8}
              >
                <View style={styles.uploadIconBox}>
                  <Upload size={18} color="#F59E0B" strokeWidth={2.4} />
                </View>
                <Text style={styles.uploadPromptText}>Tap to upload screenshot</Text>
                <ChevronRight size={19} color="#94A3B8" strokeWidth={2.2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Error Banner */}
          {submitError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* DEPOSIT HISTORY TAB */
        <ScrollView
          contentContainerStyle={[styles.historyContent, { paddingBottom: bottomPadding + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.historyHeaderRow}>
            <Text style={styles.historySectionTitle}>Your Deposit History</Text>
            <TouchableOpacity onPress={loadHistory} activeOpacity={0.7} style={styles.refreshBtn}>
              <RefreshCw size={15} color="#F59E0B" />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {isLoadingHistory ? (
            <ActivityIndicator color="#F59E0B" style={{ marginVertical: 36 }} />
          ) : depositHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Clock size={36} color="#64748B" />
              </View>
              <Text style={styles.emptyTitle}>No Deposits Yet</Text>
              <Text style={styles.emptySubtitle}>
                Complete a UPI payment and upload your receipt to add funds to your wallet.
              </Text>
            </View>
          ) : (
            depositHistory.map((item) => {
              const statusColor =
                item.status === 'approved'
                  ? '#10B981'
                  : item.status === 'rejected'
                    ? '#EF4444'
                    : '#F59E0B';

              return (
                <View key={item._id} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <View>
                      <Text style={styles.historyAmount}>₹ {item.amount.toLocaleString()}</Text>
                      <Text style={styles.historyRef}>Ref: {item.transactionRef}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${statusColor}14`, borderColor: statusColor },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyCardDivider} />

                  <View style={styles.historyCardBottom}>
                    <Text style={styles.historyDate}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    {item.plan?.name && (
                      <View style={styles.historyPlanPill}>
                        <Text style={styles.historyPlanText}>{item.plan.name}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* BOTTOM CONFIRM BUTTON (Deposit Tab) */}
      {activeTab === 'deposit' && (
        <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
          <TouchableOpacity
            style={[styles.confirmBtnWrapper, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#FDE047', '#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0A0B10" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Payment</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Picker Sheet Modal */}
      <Modal
        visible={showPickerSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPickerSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowPickerSheet(false)}
        >
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Upload Payment Screenshot</Text>
            <Text style={styles.sheetSubtitle}>Attach proof of your successful UPI transaction</Text>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <View style={styles.sheetOptionIconBox}>
                <ImageIcon size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.sheetOptionDesc}>Select screenshot from your photo library</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleTakePhoto}
              activeOpacity={0.7}
            >
              <View style={styles.sheetOptionIconBox}>
                <Camera size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetOptionTitle}>Take Photo</Text>
                <Text style={styles.sheetOptionDesc}>Capture screenshot with camera</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setShowPickerSheet(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Amount Modal */}
      <Modal
        visible={showEditAmountModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditAmountModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.amountModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Set Deposit Amount</Text>
              <TouchableOpacity onPress={() => setShowEditAmountModal(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter custom deposit amount or pick a membership package:
            </Text>

            {/* Custom Input */}
            <View style={styles.modalAmountInputRow}>
              <Text style={styles.modalCurrencySymbol}>₹</Text>
              <TextInput
                style={styles.modalAmountInput}
                value={tempAmount}
                onChangeText={(val) => setTempAmount(val.replace(/[^0-9]/g, ''))}
                placeholder="1000"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                autoFocus
              />
            </View>

            {/* Plans List Chips */}
            {plans.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.quickSelectLabel}>Popular Packages</Text>
                <View style={styles.planChipsGrid}>
                  {plans.map((p) => {
                    const isSelected = tempAmount === String(p.amount);
                    return (
                      <TouchableOpacity
                        key={p._id}
                        style={[styles.planChip, isSelected && styles.planChipActive]}
                        onPress={() => handleSelectPlan(p)}
                        activeOpacity={0.75}
                      >
                        <Sparkles size={12} color={isSelected ? '#F59E0B' : '#64748B'} />
                        <Text style={[styles.planChipText, isSelected && styles.planChipTextActive]}>
                          ₹{p.amount} • {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.saveAmountBtn}
              onPress={handleSaveAmount}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveAmountGradient}
              >
                <Text style={styles.saveAmountText}>Update Amount</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={44} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>Payment Submitted!</Text>
            <Text style={styles.modalDesc}>
              Your deposit request with UTR <Text style={{ fontWeight: '700', color: '#FBBF24' }}>{utr}</Text> has
              been submitted. It will be verified and credited to your wallet balance shortly.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.85}
              onPress={handleSuccessClose}
            >
              <LinearGradient
                colors={['#FDE047', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>View in Deposit History</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0B10',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  circleButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },

  // Main Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },

  // QR Code Card
  qrCard: {
    alignSelf: 'center',
    width: 270,
    height: 270,
    backgroundColor: '#13151F',
    borderRadius: 28,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 4,
    position: 'relative',
  },
  qrFrameWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBracketTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 42,
    height: 42,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 18,
    borderColor: '#F59E0B',
    zIndex: 10,
  },
  cornerBracketBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 42,
    height: 42,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 18,
    borderColor: '#F59E0B',
    zIndex: 10,
  },
  qrInnerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrCenterZoomBtn: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#1E2235',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  hideQrPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1C2A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  hideQrPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F59E0B',
  },
  qrLoaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrLoaderText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
    fontWeight: '500',
  },
  viewQrCtaContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  viewQrCtaBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  viewQrGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
    gap: 7,
    borderRadius: 22,
  },
  viewQrCtaText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A0B10',
    letterSpacing: -0.2,
  },

  // Below QR text & rows
  scanSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 4,
  },
  upiLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  upiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  copyBtn: {
    padding: 4,
    marginLeft: 2,
  },
  copiedTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  copiedTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10B981',
  },

  // Amount Row
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
  },
  amountValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountValue: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: -0.5,
  },
  amountEditPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },

  // PG-Style Pay with UPI Apps Section
  pgSectionCard: {
    marginTop: 24,
    marginBottom: 8,
    backgroundColor: '#13151F',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  pgSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pgHeaderIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pgSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  pgSectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  pgOverlapLogosRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pgMiniLogo: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#13151F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  pgLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  pgLoadingText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  pgAppsList: {
    gap: 10,
  },
  pgAppOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pgAppOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  pgAppLogoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  pgAppMeta: {
    marginLeft: 12,
    flex: 1,
  },
  pgAppNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pgAppName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  pgInstalledTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 3,
  },
  pgInstalledTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.2,
  },
  pgAppDesc: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  pgPayNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  pgPayNowBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pgFallbackBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pgFallbackTop: {
    marginBottom: 10,
  },
  pgFallbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  pgFallbackSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  pgOpenChooserBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  pgChooserGradient: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
  },
  pgChooserBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A0B10',
  },
  pgTipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    padding: 9,
    marginTop: 14,
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  pgTipText: {
    flex: 1,
    fontSize: 11,
    color: '#FCD34D',
    fontWeight: '500',
    lineHeight: 15,
  },

  // Verification Section Subtitle
  verificationSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },

  // Field Inputs
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 7,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    height: '100%',
  },
  clearBtn: {
    padding: 6,
  },

  // Screenshot Upload Box
  uploadPlaceholderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 58,
  },
  uploadIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPromptText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#CBD5E1',
    marginLeft: 12,
  },

  // Preview Card
  screenshotPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2235',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 14,
    padding: 10,
  },
  screenshotThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0A0B10',
  },
  screenshotInfo: {
    flex: 1,
    marginLeft: 12,
  },
  screenshotStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  screenshotStatusText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  screenshotSubText: {
    fontSize: 11.5,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
  removeScreenshotBtn: {
    padding: 8,
  },

  // Error Banner
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#F87171',
    textAlign: 'center',
  },

  // Bottom Fixed Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0B10',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  confirmBtnWrapper: {
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
  confirmGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
  },
  confirmBtnText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0A0B10',
    letterSpacing: -0.2,
  },

  // Modals & Sheets
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#13151F',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 18,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  sheetOptionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sheetOptionDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  sheetCancelBtn: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetCancelText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // Amount Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  amountModalCard: {
    backgroundColor: '#13151F',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  modalAmountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
  },
  modalCurrencySymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F59E0B',
    marginRight: 6,
  },
  modalAmountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  quickSelectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  planChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  planChipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  planChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  planChipTextActive: {
    color: '#FBBF24',
    fontWeight: '700',
  },
  saveAmountBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
  },
  saveAmountGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0B10',
  },

  // Success Modal Card
  modalCard: {
    backgroundColor: '#13151F',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalDesc: {
    fontSize: 13.5,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 12,
  },
  modalButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    marginTop: 10,
  },
  modalButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0B10',
  },

  // History Tab Styles
  historyContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  historySectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: '#13151F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  historyRef: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  historyCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginVertical: 12,
  },
  historyCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  historyPlanPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyPlanText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
  },
});
