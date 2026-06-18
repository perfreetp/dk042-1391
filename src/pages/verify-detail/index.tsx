import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusBadge from '@/components/StatusBadge';
import LargeButton from '@/components/LargeButton';
import { formatHours, formatCycles, formatDateTime } from '@/utils/format';

const VerifyDetailPage: React.FC = () => {
  const router = useRouter();
  const { verifyRecords } = useAppStore();

  const recordId = router.params?.id;

  const record = useMemo(() => {
    return verifyRecords.find(r => r.id === recordId);
  }, [verifyRecords, recordId]);

  const getLifeClass = (remaining: number, max: number): string => {
    const ratio = remaining / max;
    if (ratio < 0.05) return 'danger';
    if (ratio < 0.2) return 'warning';
    return '';
  };

  const getRatioText = (remaining: number, max: number): string => {
    const percent = Math.round((remaining / max) * 100);
    return `剩余 ${percent}% (上限 ${max})`;
  };

  if (!record) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyBox}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>未找到核验记录</Text>
          <Text className={styles.emptyDesc}>该核验记录可能已被删除或不存在</Text>
          <View style={{ width: '60%', marginTop: '32rpx' }}>
            <LargeButton text="返回首页" type="primary" onClick={() => Taro.switchTab({ url: '/pages/home/index' })} />
          </View>
        </View>
      </View>
    );
  }

  const mockMaxHours = 8000;
  const mockMaxCycles = 5000;
  const hoursClass = getLifeClass(record.remainingHours, mockMaxHours);
  const cyclesClass = getLifeClass(record.remainingCycles, mockMaxCycles);

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <View className={styles.headerBar}>
          <View className={styles.basicInfo}>
            <Text className={styles.recordId}>核验编号: {record.id.toUpperCase()}</Text>
            <Text className={styles.aircraftNo}>{record.aircraftNo}</Text>
            <Text className={styles.flightInfo}>
              {record.flightNo || '未录入航班号'} · 装机位置: {record.position}
            </Text>
          </View>
          <StatusBadge status={record.status} text={record.statusText} />
        </View>

        <Text className={styles.sectionTitle}>航材信息</Text>
        <View className={styles.infoGrid}>
          <View className={classnames(styles.infoItem, styles.full)}>
            <Text className={styles.infoLabel}>航材名称</Text>
            <Text className={styles.infoValue}>{record.partName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>零件号 (PN)</Text>
            <Text className={classnames(styles.infoValue, styles.mono)}>{record.partNumber}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>序列号 (SN)</Text>
            <Text className={classnames(styles.infoValue, styles.mono)}>{record.serialNumber}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>寿命状态</Text>
        <View className={styles.lifeGrid}>
          <View className={classnames(styles.lifeCard, hoursClass)}>
            <Text className={styles.lifeValue}>{formatHours(record.remainingHours)}</Text>
            <Text className={styles.lifeLabel}>剩余飞行小时</Text>
            <Text className={styles.lifeRatio}>{getRatioText(record.remainingHours, mockMaxHours)}</Text>
          </View>
          <View className={classnames(styles.lifeCard, cyclesClass)}>
            <Text className={styles.lifeValue}>{formatCycles(record.remainingCycles)}</Text>
            <Text className={styles.lifeLabel}>剩余飞行循环</Text>
            <Text className={styles.lifeRatio}>{getRatioText(record.remainingCycles, mockMaxCycles)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>MEL / CDL 限制</Text>
        <View className={styles.restrictions}>
          {record.hasMELRestriction && (
            <View className={classnames(styles.restrictionTag, styles.mel)}>
              ⚠ 已关联 MEL 最低设备清单保留项
            </View>
          )}
          {record.hasCDLRestriction && (
            <View className={classnames(styles.restrictionTag, styles.cdl)}>
              ✕ 已关联 CDL 构型缺损清单项目
            </View>
          )}
          {!record.hasMELRestriction && !record.hasCDLRestriction && (
            <View className={classnames(styles.restrictionTag, styles.none)}>
              ✓ 无 MEL/CDL 关联限制，状态正常
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>核验签署</Text>
        <View className={styles.signBox}>
          <View className={styles.signRow}>
            <View className={styles.signText}>
              <Text className={styles.signLabel}>核验放行签署人</Text>
              <Text className={styles.signValue}>{record.verifiedBy}</Text>
            </View>
            <View className={styles.signText} style={{ alignItems: 'flex-end' }}>
              <Text className={styles.signLabel}>核验时间</Text>
              <Text className={styles.signValue}>{formatDateTime(record.verifiedAt)}</Text>
            </View>
          </View>
          {record.remark && (
            <View className={styles.remarkBox}>
              <Text className={styles.remarkText}>📌 {record.remark}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default VerifyDetailPage;
