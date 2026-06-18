import React, { useMemo, useState } from 'react';
import { View, Text, Image, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusBadge from '@/components/StatusBadge';
import LargeButton from '@/components/LargeButton';
import { formatDateTime } from '@/utils/format';
import type { ReportStatus } from '@/types';

const STATUS_OPTIONS: { key: ReportStatus; label: string; desc: string }[] = [
  { key: 'processing', label: '处理中', desc: '已接单，正在协调' },
  { key: 'resolved', label: '已解决', desc: '问题已处置完成' },
  { key: 'closed', label: '已关闭', desc: '归档关闭' }
];

const ReportDetailPage: React.FC = () => {
  const router = useRouter();
  const { reportRecords, currentUser, updateReportStatus } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [pickStatus, setPickStatus] = useState<ReportStatus>('processing');
  const [handlerName, setHandlerName] = useState('');
  const [feedback, setFeedback] = useState('');

  const recordId = router.params?.id;

  const record = useMemo(() => {
    return reportRecords.find(r => r.id === recordId);
  }, [reportRecords, recordId]);

  const handlePreview = (current: string) => {
    if (!record?.photos?.length) return;
    Taro.previewImage({
      urls: record.photos,
      current
    });
  };

  const openFeedback = () => {
    setPickStatus(record?.status === 'pending' ? 'processing' : (record?.status as ReportStatus) || 'processing');
    setHandlerName(record?.handler || '');
    setFeedback(record?.handleRemark || '');
    setModalOpen(true);
  };

  const submitFeedback = () => {
    if (!record) return;
    if (!feedback.trim()) {
      Taro.showToast({ title: '请填写处理意见', icon: 'none' });
      return;
    }
    updateReportStatus(record.id, pickStatus, handlerName.trim() || currentUser.name, feedback.trim());
    setModalOpen(false);
    Taro.showToast({ title: '处理反馈已更新', icon: 'success', duration: 1200 });
  };

  if (!record) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyBox}>
          <Text className={styles.emptyIcon}>📸</Text>
          <Text className={styles.emptyTitle}>未找到上报记录</Text>
          <Text className={styles.emptyDesc}>该上报记录可能已被删除或不存在</Text>
          <View style={{ width: '60%', marginTop: '32rpx' }}>
            <LargeButton
              text="返回上报页"
              type="warning"
              onClick={() => Taro.switchTab({ url: '/pages/report/index' })}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <View className={styles.headerBar}>
          <View className={styles.basicInfo}>
            <Text className={styles.reportNo}>上报单号: {record.reportNo}</Text>
            <Text className={styles.typeText}>{record.typeText}</Text>
            <Text className={styles.submitInfo}>
              提交人 {record.reportedBy} · {formatDateTime(record.reportedAt)}
            </Text>
          </View>
          <StatusBadge status={record.status} text={record.statusText} />
        </View>

        <Text className={styles.sectionTitle}>航班与机位信息</Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>飞机注册号</Text>
            <Text className={styles.infoValue}>{record.aircraftNo}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>航班号</Text>
            <Text className={styles.infoValue}>{record.flightNo}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>停场位置</Text>
            <Text className={styles.infoValue}>{record.parkingPosition}</Text>
          </View>
        </View>
      </View>

      {(record.serialNumber || record.partNumber || record.partName) && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>关联航材信息</Text>
          <View className={styles.infoGrid}>
            {record.partName && (
              <View className={classnames(styles.infoItem, styles.full)}>
                <Text className={styles.infoLabel}>航材名称</Text>
                <Text className={styles.infoValue}>{record.partName}</Text>
              </View>
            )}
            {record.partNumber && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>零件号 (PN)</Text>
                <Text className={classnames(styles.infoValue, styles.mono)}>{record.partNumber}</Text>
              </View>
            )}
            {record.serialNumber && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>序列号 (SN)</Text>
                <Text className={classnames(styles.infoValue, styles.mono)}>{record.serialNumber}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>现场照片</Text>
        <View className={styles.photoGrid}>
          {record.photos.map((photo, idx) => (
            <View key={idx} className={styles.photoItem} onClick={() => handlePreview(photo)}>
              <Image
                className={styles.photoImg}
                src={photo}
                mode="aspectFill"
                onError={(e) => console.error('[ReportDetail] image error:', e)}
              />
            </View>
          ))}
        </View>
      </View>

      {record.remark && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>情况说明</Text>
          <View className={styles.remarkBox}>
            <Text className={styles.remarkTitle}>📝 维修员说明</Text>
            <Text className={styles.remarkText}>{record.remark}</Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.timelineHeader}>
          <Text className={styles.sectionTitle}>处理进度</Text>
          <View className={styles.feedbackBtn} onClick={openFeedback}>
            <Text className={styles.feedbackIcon}>✎</Text>
            <Text className={styles.feedbackText}>处理反馈</Text>
          </View>
        </View>
        <View className={styles.timeline}>
          <View className={styles.timelineItem}>
            <View className={classnames(styles.timelineDot, styles.done)} />
            <View className={styles.timelineContent}>
              <Text className={styles.timelineTitle}>异常上报提交</Text>
              <Text className={styles.timelineHandler}>操作人：{record.reportedBy}</Text>
              <Text className={styles.timelineTime}>{formatDateTime(record.reportedAt)}</Text>
            </View>
          </View>

          {record.status !== 'pending' && record.handler && (
            <View className={styles.timelineItem}>
              <View className={classnames(
                styles.timelineDot,
                record.status === 'processing' ? styles.doing : styles.done
              )} />
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTitle}>
                  {record.status === 'processing' ? '正在处理中' : record.status === 'resolved' ? '已解决' : '已关闭'}
                </Text>
                <Text className={styles.timelineHandler}>处理人：{record.handler}</Text>
                {record.handledAt && (
                  <Text className={styles.timelineTime}>{formatDateTime(record.handledAt)}</Text>
                )}
                {record.handleRemark && (
                  <View className={styles.timelineRemark}>💬 {record.handleRemark}</View>
                )}
              </View>
            </View>
          )}

          {record.status === 'pending' && (
            <View className={styles.timelineItem}>
              <View className={classnames(styles.timelineDot, styles.doing)} />
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTitle}>等待 MCC / 航材岗响应</Text>
                <Text className={styles.timelineHandler}>预计响应时间：15分钟内</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={{ marginTop: '8rpx' }}>
        <LargeButton
          text={record.status === 'closed' ? '该上报已关闭' : '更新处理反馈'}
          type={record.status === 'closed' ? 'secondary' : 'warning'}
          disabled={record.status === 'closed'}
          onClick={openFeedback}
        />
      </View>

      {modalOpen && (
        <View className={styles.modalMask} onClick={() => setModalOpen(false)}>
          <View className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>MCC 处理反馈</Text>
              <Text className={styles.modalClose} onClick={() => setModalOpen(false)}>×</Text>
            </View>

            <Text className={styles.modalLabel}>更新状态</Text>
            <View className={styles.statusOptions}>
              {STATUS_OPTIONS.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(
                    styles.statusOption,
                    pickStatus === opt.key && styles.statusOptionActive,
                    pickStatus === opt.key && styles[`s_${opt.key}`]
                  )}
                  onClick={() => setPickStatus(opt.key)}
                >
                  <Text className={styles.statusOptionLabel}>{opt.label}</Text>
                  <Text className={styles.statusOptionDesc}>{opt.desc}</Text>
                </View>
              ))}
            </View>

            <Text className={styles.modalLabel}>处理人</Text>
            <View className={styles.modalInputWrap}>
              <Textarea
                className={styles.modalInput}
                placeholder="处理人姓名/岗位，默认当前用户"
                placeholderStyle="color:#94A3B8"
                value={handlerName}
                onInput={(e) => setHandlerName(e.detail.value)}
                maxlength={30}
                autoHeight
              />
            </View>

            <Text className={styles.modalLabel}>处理意见 *</Text>
            <View className={styles.modalTextareaWrap}>
              <Textarea
                className={styles.modalTextarea}
                placeholder="填写处理措施、结论或后续要求..."
                placeholderStyle="color:#94A3B8"
                value={feedback}
                onInput={(e) => setFeedback(e.detail.value)}
                maxlength={300}
                showConfirmBar={false}
              />
            </View>

            <LargeButton
              text="提交处理反馈"
              type="warning"
              onClick={submitFeedback}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default ReportDetailPage;
