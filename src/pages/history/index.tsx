import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusBadge from '@/components/StatusBadge';
import { formatDateTime, formatHours, formatCycles } from '@/utils/format';
import type { VerifyRecord, ReportRecord } from '@/types';

type TabKey = 'all' | 'pass' | 'review' | 'reject' | 'report';

interface HistoryItem {
  id: string;
  kind: 'verify' | 'report';
  record: VerifyRecord | ReportRecord;
  sortTime: string;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pass', label: '可放行' },
  { key: 'review', label: '需复核' },
  { key: 'reject', label: '禁止放行' },
  { key: 'report', label: '异常上报' }
];

const HistoryPage: React.FC = () => {
  const router = useRouter();
  const initialTab = (router.params?.tab as TabKey) || 'all';
  const { verifyRecords, reportRecords } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const allItems = useMemo<HistoryItem[]>(() => {
    const vItems: HistoryItem[] = verifyRecords.map(r => ({
      id: r.id,
      kind: 'verify',
      record: r,
      sortTime: r.verifiedAt
    }));
    const rItems: HistoryItem[] = reportRecords.map(r => ({
      id: r.id,
      kind: 'report',
      record: r,
      sortTime: r.reportedAt
    }));
    return [...vItems, ...rItems].sort((a, b) => b.sortTime.localeCompare(a.sortTime));
  }, [verifyRecords, reportRecords]);

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return allItems;
    if (activeTab === 'report') return allItems.filter(i => i.kind === 'report');
    return allItems.filter(i => {
      if (i.kind !== 'verify') return false;
      return (i.record as VerifyRecord).status === activeTab;
    });
  }, [allItems, activeTab]);

  const goDetail = (item: HistoryItem) => {
    if (item.kind === 'verify') {
      Taro.navigateTo({ url: `/pages/verify-detail/index?id=${item.id}` });
    } else {
      Taro.navigateTo({ url: `/pages/report-detail/index?id=${item.id}` });
    }
  };

  const renderVerifyCard = (item: HistoryItem) => {
    const r = item.record as VerifyRecord;
    return (
      <View className={classnames(styles.card, styles[r.status])} onClick={() => goDetail(item)}>
        <View className={styles.cardBody}>
          <View className={styles.cardTop}>
            <Text className={styles.cardTitle}>{r.aircraftNo}</Text>
            <StatusBadge status={r.status} text={r.statusText} />
          </View>
          <View className={styles.cardSub}>
            <Text className={styles.subItem}>🔧 {r.partName}</Text>
            <Text className={styles.subItem}>📍 {r.position}</Text>
          </View>
          <View className={styles.tagRow}>
            <Text className={classnames(styles.miniTag, styles.life)}>
              {formatHours(r.remainingHours)} / {formatCycles(r.remainingCycles)}
            </Text>
            {r.hasMELRestriction && <Text className={classnames(styles.miniTag, styles.mel)}>MEL</Text>}
            {r.hasCDLRestriction && <Text className={classnames(styles.miniTag, styles.cdl)}>CDL</Text>}
            {r.flightNo && <Text className={classnames(styles.miniTag, styles.flight)}>{r.flightNo}</Text>}
          </View>
          <View className={styles.cardFooter}>
            <Text className={styles.footerText}>✍ {r.verifiedBy} · {formatDateTime(r.verifiedAt)}</Text>
            <Text className={styles.arrow}>详情 ›</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderReportCard = (item: HistoryItem) => {
    const r = item.record as ReportRecord;
    return (
      <View className={classnames(styles.card, styles.report)} onClick={() => goDetail(item)}>
        <View className={styles.cardBody}>
          <View className={styles.cardTop}>
            <Text className={styles.cardTitle}>{r.typeText}</Text>
            <StatusBadge status={r.status} text={r.statusText} />
          </View>
          <View className={styles.cardSub}>
            <Text className={styles.subItem}>✈️ {r.aircraftNo}</Text>
            <Text className={styles.subItem}>🛫 {r.flightNo}</Text>
            <Text className={styles.subItem}>📍 {r.parkingPosition}</Text>
          </View>
          <View className={styles.tagRow}>
            {r.serialNumber && <Text className={classnames(styles.miniTag, styles.life)}>{r.serialNumber}</Text>}
            <Text className={classnames(styles.miniTag, styles.photo)}>📷 {r.photos?.length || 0}张</Text>
          </View>
          <View className={styles.cardFooter}>
            <Text className={styles.footerText}>📸 {r.reportedBy} · {formatDateTime(r.reportedAt)}</Text>
            <Text className={styles.arrow}>进度 ›</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollX className={styles.tabsBar}>
        {TABS.map(tab => (
          <Text
            key={tab.key}
            className={classnames(
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              activeTab === tab.key && styles[tab.key]
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Text>
        ))}
      </ScrollView>

      <View className={styles.summaryBar}>
        <Text>当前筛选：{TABS.find(t => t.key === activeTab)?.label}</Text>
        <Text>共 <Text className={styles.summaryCount}>{filteredItems.length}</Text> 条</Text>
      </View>

      {filteredItems.length > 0 ? (
        <View className={styles.list}>
          {filteredItems.map(item => (
            <React.Fragment key={item.id}>
              {item.kind === 'verify' ? renderVerifyCard(item) : renderReportCard(item)}
            </React.Fragment>
          ))}
        </View>
      ) : (
        <View className={styles.emptyBox}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyTitle}>暂无相关记录</Text>
          <Text className={styles.emptyDesc}>该筛选条件下没有历史记录，可切换其他筛选查看</Text>
        </View>
      )}
    </View>
  );
};

export default HistoryPage;
