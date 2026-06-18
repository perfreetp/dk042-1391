import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { VerifyStatus } from '@/types';
import { formatDateTime, formatHours, formatCycles } from '@/utils/format';
import LargeButton from '@/components/LargeButton';

export interface VerifyResultData {
  status: VerifyStatus;
  statusText: string;
  partName: string;
  partNumber: string;
  serialNumber: string;
  manufacturer?: string;
  isLifeControlled: boolean;
  remainingHours: number;
  remainingCycles: number;
  maxHours: number;
  maxCycles: number;
  hasMELRestriction: boolean;
  melReference?: string;
  hasCDLRestriction: boolean;
  cdlReference?: string;
  lastInstalledBy: string;
  lastInstalledAt: string;
  verifiedAt?: string;
}

interface VerifyResultCardProps {
  data: VerifyResultData;
  showSignButton?: boolean;
  showSignInfo?: boolean;
  onSign?: () => void;
  onReport?: () => void;
}

const getStatusIcon = (status: VerifyStatus): string => {
  const map = { pass: '✓', review: '!', reject: '✕' };
  return map[status];
};

const getLifeHighlight = (remaining: number, max: number): string => {
  const ratio = remaining / max;
  if (ratio < 0.05) return 'danger';
  if (ratio < 0.2) return 'highlight';
  return '';
};

const VerifyResultCard: React.FC<VerifyResultCardProps> = ({
  data,
  showSignButton = false,
  showSignInfo = false,
  onSign,
  onReport
}) => {
  const hoursClass = getLifeHighlight(data.remainingHours, data.maxHours);
  const cyclesClass = getLifeHighlight(data.remainingCycles, data.maxCycles);

  return (
    <View className={classnames(styles.card, styles[data.status])}>
      <View className={styles.header}>
        <View className={styles.statusWrap}>
          <View className={styles.statusIcon}>{getStatusIcon(data.status)}</View>
          <Text className={styles.statusText}>{data.statusText}</Text>
        </View>
        {data.verifiedAt && (
          <Text className={styles.time}>{formatDateTime(data.verifiedAt)}</Text>
        )}
      </View>

      <View className={styles.content}>
        <View className={styles.partInfo}>
          <Text className={styles.partName}>{data.partName}</Text>
          <View className={styles.partMeta}>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>零件号</Text>
              <Text className={styles.metaValue}>{data.partNumber}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>序列号</Text>
              <Text className={styles.metaValue}>{data.serialNumber}</Text>
            </View>
          </View>
        </View>

        <View className={styles.lifeSection}>
          <Text className={styles.sectionTitle}>
            寿命剩余 {data.isLifeControlled ? '(寿命控制件)' : '(非寿命控制件)'}
          </Text>
          <View className={styles.lifeGrid}>
            <View className={classnames(styles.lifeItem, hoursClass)}>
              <Text className={styles.lifeValue}>{formatHours(data.remainingHours)}</Text>
              <Text className={styles.lifeLabel}>剩余飞行小时</Text>
            </View>
            <View className={classnames(styles.lifeItem, cyclesClass)}>
              <Text className={styles.lifeValue}>{formatCycles(data.remainingCycles)}</Text>
              <Text className={styles.lifeLabel}>剩余飞行循环</Text>
            </View>
          </View>
        </View>

        <View className={styles.restrictionList}>
          {data.hasMELRestriction && (
            <View className={classnames(styles.restrictionItem, styles.mel)}>
              ⚠ MEL限制：{data.melReference || '已关联MEL保留项'}
            </View>
          )}
          {data.hasCDLRestriction && (
            <View className={classnames(styles.restrictionItem, styles.cdl)}>
              ✕ CDL限制：{data.cdlReference || '已关联CDL缺损项'}
            </View>
          )}
          {!data.hasMELRestriction && !data.hasCDLRestriction && (
            <View className={classnames(styles.restrictionItem, styles.noRestriction)}>
              ✓ 无 MEL/CDL 关联限制
            </View>
          )}
        </View>

        {showSignInfo && (
          <View className={styles.signInfo}>
            <View className={styles.signItem}>
              <Text className={styles.signLabel}>最近装机签署人</Text>
              <Text className={styles.signValue}>{data.lastInstalledBy}</Text>
            </View>
            <View className={styles.signItem}>
              <Text className={styles.signLabel}>装机时间</Text>
              <Text className={styles.signValue}>{formatDateTime(data.lastInstalledAt)}</Text>
            </View>
          </View>
        )}
      </View>

      {showSignButton && (
        <View className={styles.footer}>
          {data.status !== 'reject' ? (
            <LargeButton
              text={data.status === 'review' ? '复核确认并签署放行' : '确认并签署放行'}
              type={data.status === 'pass' ? 'success' : 'warning'}
              onClick={onSign}
            />
          ) : (
            <View style={{ display: 'flex', gap: '24rpx' }}>
              <View style={{ flex: 1 }}>
                <LargeButton text="禁止放行，联系MCC" type="danger" onClick={onSign} />
              </View>
              <View style={{ flex: 1 }}>
                <LargeButton text="异常上报" type="secondary" onClick={onReport} />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default VerifyResultCard;
