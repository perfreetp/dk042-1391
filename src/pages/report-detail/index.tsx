import React, { useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusBadge from '@/components/StatusBadge';
import LargeButton from '@/components/LargeButton';
import { formatDateTime } from '@/utils/format';

const ReportDetailPage: React.FC = () => {
  const router = useRouter();
  const { reportRecords } = useAppStore();

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
        <Text className={styles.sectionTitle}>处理进度</Text>
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
                  {record.status === 'processing' ? '正在处理中' : '处理完成'}
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
    </View>
  );
};

export default ReportDetailPage;
