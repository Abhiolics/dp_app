import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  ChevronRight,
  Gift,
  Camera,
  Image as ImageIcon,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import {
  getTasks,
  submitTaskProof,
  getMySubmissions,
  TaskItem,
  TaskSubmissionItem,
  getFullImageUrl,
} from '../services';

type TabView = 'available' | 'submissions';

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 20) + 10;
  const { refreshUserData } = useAuth();

  const [activeTab, setActiveTab] = useState<TabView>('available');

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Submit Proof Modal State
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const loadData = async () => {
    try {
      if (activeTab === 'available') {
        const list = await getTasks();
        setTasks(list);
      } else {
        const subs = await getMySubmissions();
        setSubmissions(subs);
      }
    } catch (err) {
      console.warn('Failed loading tasks data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [activeTab]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleOpenSubmitModal = (task: TaskItem) => {
    setSelectedTask(task);
    setProofUri(null);
    setSubmitError(null);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to attach your task proof.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setProofUri(result.assets[0].uri);
      setSubmitError(null);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to capture proof.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setProofUri(result.assets[0].uri);
      setSubmitError(null);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedTask) return;
    if (!proofUri) {
      setSubmitError('Please attach a screenshot proof before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitTaskProof(selectedTask._id, proofUri);
      setIsSubmitting(false);
      setSelectedTask(null);
      setShowSuccessModal(true);
      await refreshUserData();
      await loadData();
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'Failed to submit task proof. Please try again.');
    }
  };

  const totalRewardsAvailable = tasks.reduce((sum, t) => sum + (t.rewardAmount || 0), 0);

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Daily Earnings & Tasks</Text>

        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
          <RefreshCw size={18} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Rewards Banner */}
        <LinearGradient
          colors={['#2A1F08', '#1A1510', '#100E0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Total Daily Rewards Pool</Text>
              <Text style={styles.heroAmount}>
                ₹ {totalRewardsAvailable.toLocaleString()}
              </Text>
              <Text style={styles.heroSub}>Complete tasks and earn instant cash rewards</Text>
            </View>
            <View style={styles.giftIconWrap}>
              <Gift size={28} color="#FBBF24" />
            </View>
          </View>
        </LinearGradient>

        {/* Tab Toggle */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'available' && styles.tabButtonActive]}
            onPress={() => setActiveTab('available')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'available' && styles.tabButtonTextActive,
              ]}
            >
              Available Tasks ({tasks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'submissions' && styles.tabButtonActive]}
            onPress={() => setActiveTab('submissions')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'submissions' && styles.tabButtonTextActive,
              ]}
            >
              My Submissions
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: AVAILABLE TASKS */}
        {activeTab === 'available' && (
          <View style={styles.tasksList}>
            {isLoading ? (
              <ActivityIndicator color="#F59E0B" style={{ marginVertical: 36 }} />
            ) : tasks.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Award size={40} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Tasks Available</Text>
                <Text style={styles.emptySub}>Check back soon for new daily earning tasks.</Text>
              </View>
            ) : (
              tasks.map((task) => {
                const sub = task.mySubmission;
                const isPending = sub?.status === 'pending';
                const isApproved = sub?.status === 'approved';
                const isRejected = sub?.status === 'rejected';

                return (
                  <View key={task._id} style={styles.taskCard}>
                    <View style={styles.taskCardTop}>
                      <View style={styles.taskTagBadge}>
                        <Sparkles size={11} color="#F59E0B" />
                        <Text style={styles.taskTagText}>DAILY TASK</Text>
                      </View>
                      <View style={styles.rewardPill}>
                        <Text style={styles.rewardPillText}>+ ₹{task.rewardAmount}</Text>
                      </View>
                    </View>

                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDesc}>{task.description}</Text>

                    <View style={styles.taskFooter}>
                      {isApproved ? (
                        <View style={[styles.statusPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                          <CheckCircle2 size={14} color="#10B981" />
                          <Text style={[styles.statusPillText, { color: '#10B981' }]}>
                            Reward Approved
                          </Text>
                        </View>
                      ) : isPending ? (
                        <View style={[styles.statusPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                          <Clock size={14} color="#F59E0B" />
                          <Text style={[styles.statusPillText, { color: '#FBBF24' }]}>
                            Under Review
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.submitProofBtn}
                          onPress={() => handleOpenSubmitModal(task)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.submitProofBtnText}>
                            {isRejected ? 'Resubmit Proof' : 'Submit Proof'}
                          </Text>
                          <ChevronRight size={14} color="#0A0B10" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: MY SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <View style={styles.tasksList}>
            {isLoading ? (
              <ActivityIndicator color="#F59E0B" style={{ marginVertical: 36 }} />
            ) : submissions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Clock size={40} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Submissions Yet</Text>
                <Text style={styles.emptySub}>
                  Complete a task above and upload screenshot proof to earn rewards.
                </Text>
              </View>
            ) : (
              submissions.map((sub) => {
                const taskTitle =
                  typeof sub.task === 'object' && sub.task?.title
                    ? sub.task.title
                    : 'Task Submission';
                const statusColor =
                  sub.status === 'approved'
                    ? '#10B981'
                    : sub.status === 'rejected'
                    ? '#EF4444'
                    : '#F59E0B';

                return (
                  <View key={sub._id} style={styles.subCard}>
                    <View style={styles.subCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subTaskTitle}>{taskTitle}</Text>
                        <Text style={styles.subDate}>
                          {new Date(sub.createdAt).toLocaleString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: `${statusColor}18`, borderColor: statusColor },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                          {sub.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.subCardDivider} />

                    <View style={styles.subCardBottom}>
                      {sub.proof ? (
                        <Image
                          source={{ uri: getFullImageUrl(sub.proof) }}
                          style={styles.subProofThumb}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.subRewardText}>Reward: ₹{sub.rewardAmount}</Text>
                        {sub.adminRemark ? (
                          <Text style={styles.subRemarkText}>Note: {sub.adminRemark}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Proof Upload Modal */}
      <Modal visible={Boolean(selectedTask)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.proofModalCard}>
            <View style={styles.proofModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.proofModalTitle}>Submit Task Proof</Text>
                <Text style={styles.proofModalTaskName}>{selectedTask?.title}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedTask(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.proofRewardBanner}>
              <Award size={16} color="#F59E0B" />
              <Text style={styles.proofRewardBannerText}>
                Earning Reward: <Text style={{ fontWeight: '800' }}>₹{selectedTask?.rewardAmount}</Text>
              </Text>
            </View>

            {/* Proof Image Box */}
            {proofUri ? (
              <View style={styles.proofPreviewWrap}>
                <Image source={{ uri: proofUri }} style={styles.proofPreviewImg} />
                <TouchableOpacity
                  style={styles.removeProofBtn}
                  onPress={() => setProofUri(null)}
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadButtonsRow}>
                <TouchableOpacity
                  style={styles.uploadOptionBtn}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={24} color="#F59E0B" />
                  <Text style={styles.uploadOptionText}>Photo Library</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadOptionBtn}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Camera size={24} color="#F59E0B" />
                  <Text style={styles.uploadOptionText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            {submitError && (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color="#EF4444" />
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                (!proofUri || isSubmitting) && styles.disabledBtn,
              ]}
              onPress={handleSubmitProof}
              disabled={!proofUri || isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Submit Proof for Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={40} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Proof Submitted!</Text>
            <Text style={styles.successDesc}>
              Your task submission is now under review by our admin desk. Reward will be credited to
              your wallet upon verification.
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              activeOpacity={0.85}
              onPress={() => {
                setShowSuccessModal(false);
                setActiveTab('submissions');
              }}
            >
              <Text style={styles.successBtnText}>View My Submissions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0B10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600',
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  giftIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#FBBF24',
    fontWeight: '700',
  },
  tasksList: {
    gap: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  taskCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  taskCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  taskTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBBF24',
  },
  rewardPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rewardPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FBBF24',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  submitProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  submitProofBtnText: {
    color: '#0A0B10',
    fontSize: 12.5,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subCard: {
    backgroundColor: 'rgba(19, 21, 31, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  subCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subTaskTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  subCardDivider: {
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginVertical: 10,
  },
  subCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subProofThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  subRewardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
  },
  subRemarkText: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  proofModalCard: {
    backgroundColor: '#13151F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  proofModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  proofModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  proofModalTaskName: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  proofRewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  proofRewardBannerText: {
    fontSize: 13,
    color: '#FBBF24',
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadOptionBtn: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FBBF24',
  },
  proofPreviewWrap: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  proofPreviewImg: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  removeProofBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 6,
  },
  errorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  modalSubmitBtnText: {
    color: '#0A0B10',
    fontSize: 14.5,
    fontWeight: '800',
  },
  successCard: {
    backgroundColor: '#13151F',
    borderRadius: 24,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  successBtnText: {
    color: '#0A0B10',
    fontSize: 14,
    fontWeight: '800',
  },
});
