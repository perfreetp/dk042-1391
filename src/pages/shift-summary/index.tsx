import React, { useMemo, useState } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusBadge from '@/components/StatusBadge';
import { formatDateTime, formatTime } from '@/utils/format';
import type { VerifyRecord, ReportRecord } from '@/types';
import dayjs from 'dayjs';

type RangeKey = 'today' | 'all';

interface GroupedRecord {
  id: string;
  kind: 'verify' | 'report';
  record: VerifyRecord | ReportRecord;
  sortTime: string;
  statusColor: 'pass' | 'review' | 'reject' | 'report';
}

interface AircraftGroup {
  key: string;
  aircraftNo: string;
  flightNo: string;
  parkingPosition: string;
  records: GroupedRecord[];
  verifyCount: number;
  reportCount: number;
  pendingCount: number;
  latestTime: string;
}

const ShiftSummaryPage: React.FC = () => {
  const { verifyRecords, reportRecords } = useAppStore();
  const [keyword, setKeyword] = useState('');
  const [range, setRange] = useState<RangeKey>('today');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const todayStr = dayjs().format('YYYY-MM-DD');

  const allItems = useMemo<GroupedRecord[]>(() => {
    const vItems: GroupedRecord[] = verifyRecords.map(r => ({
      id: r.id,
      kind: 'verify',
      record: r,
      sortTime: r.verifiedAt,
      statusColor: r.status as 'pass' | 'review' | 'reject'
    }));
    const rItems: GroupedRecord[] = reportRecords.map(r => ({
      id: r.id,
      kind: 'report',
      record: r,
      sortTime: r.reportedAt,
      statusColor: 'report'
    }));
    return [...vItems, ...rItems].sort((a, b) => b.sortTime.localeCompare(a.sortTime));
  }, [verifyRecords, reportRecords]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (range === 'today') {
      items = items.filter(i => i.sortTime.startsWith(todayStr));
    }
    const kw = keyword.trim().toUpperCase();
    if (kw) {
      items = items.filter(i => {
        const v = i.record as any;
        return (
          (v.aircraftNo || '').toUpperCase().includes(kw) ||
          (v.flightNo || '').toUpperCase().includes(kw) ||
          (v.parkingPosition || '').toUpperCase().includes(kw)
        );
      });
    }
    return items;
  }, [allItems, range, keyword, todayStr]);

  const groups = useMemo<AircraftGroup[]>(() => {
    const map = new Map<string, AircraftGroup>();
    filteredItems.forEach(item => {
      const v = item.record as any;
      const key = v.aircraftNo || '未知飞机';
      if (!map.has(key)) {
        map.set(key, {
          key,
          aircraftNo: v.aircraftNo || '未知飞机',
          flightNo: v.flightNo || '',
          parkingPosition: v.parkingPosition || '',
          records: [],
          verifyCount: 0,
          reportCount: 0,
          pendingCount: 0,
          latestTime: item.sortTime
        });
      }
      const g = map.get(key)!;
      g.records.push(item);
      if (item.sortTime > g.latestTime) g.latestTime = item.sortTime;
      if (item.kind === 'verify') g.verifyCount += 1;
      else {
        g.reportCount += 1;
        const rep = item.record as ReportRecord;
        if (rep.status === 'pending' || rep.status === 'processing') g.pendingCount += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.latestTime.localeCompare(a.latestTime));
  }, [filteredItems]);

  const stats = useMemo(() => {
    const verifyTotal = filteredItems.filter(i => i.kind === 'verify').length;
    const reportTotal = filteredItems.filter(i => i.kind === 'report').length;
    const pending = filteredItems.filter(i => {
      if (i.kind !== 'report') return false;
      const rep = i.record as ReportRecord;
      return rep.status === 'pending' || rep.status === 'processing';
    }).length;
    const reject = filteredItems.filter(i => i.kind === 'verify' && i.statusColor === 'reject').length;
    return { verifyTotal, reportTotal, pending, reject };
  }, [filteredItems]);

  const toggleGroup = (key: string) => {
    setExpandedKey(prev => (prev === key ? null : key));
  };

  const goDetail = (item: GroupedRecord) => {
    if (item.kind === 'verify') {
      Taro.navigateTo({ url: `/pages/verify-detail/index?id=${item.id}` });
    } else {
      Taro.navigateTo({ url: `/pages/report-detail/index?id=${item.id}` });
    }
  };

  const renderRecordRow = (item: GroupedRecord) => {
    if (item.kind === 'verify') {
      const r = item.record as VerifyRecord;
      return (
        <View
          key={item.id}
          className={classnames(styles.recordRow, styles[r.status])}
          onClick={() => goDetail(item)}
        >
          <View className={styles.recordBody}>
            <Text className={styles.recordTitle}>{r.partName}</Text>
            <Text className={styles.recordSub}>{r.position} · {r.statusText}</Text>
          </View>
          <Text className={styles.recordTime}>{formatTime(r.verifiedAt)}</Text>
        </View>
      );
    }
    const r = item.record as ReportRecord;
    return (
      <View
        key={item.id}
        className={classnames(styles.recordRow, styles.report)}
        onClick={() => goDetail(item)}
      >
        <View className={styles.recordBody}>
          <Text className={styles.recordTitle}>📷 {r.typeText}</Text>
          <Text className={styles.recordSub}>
            {r.serialNumber || '无SN'} · {r.statusText}
          </Text>
        </View>
        <Text className={styles.recordTime}>{formatTime(r.reportedAt)}</Text>
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.summaryHeader}>
        <Text className={styles.summaryTitle}>
          值班交班汇总 · {range === 'today' ? todayStr : '全部记录'}
        </Text>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryCell}>
            <Text className={styles.summaryValue}>{stats.verifyTotal}</Text>
            <Text className={styles.summaryLabel}>核验</Text>
          </View>
          <View className={styles.summaryCell}>
            <Text className={styles.summaryValue}>{stats.reportTotal}</Text>
            <Text className={styles.summaryLabel}>异常</Text>
          </View>
          <View className={styles.summaryCell}>
            <Text className={styles.summaryValue}>{stats.pending}</Text>
            <Text className={styles.summaryLabel}>待处理</Text>
          </View>
          <View className={styles.summaryCell}>
            <Text className={styles.summaryValue}>{stats.reject}</Text>
            <Text className={styles.summaryLabel}>禁放</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        <View className={styles.searchWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="飞机号 / 航班号 / 机位"
            placeholderStyle="color:#94A3B8"
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.rangeToggle}>
        <Text
          className={classnames(styles.rangeBtn, range === 'today' && styles.rangeBtnActive)}
          onClick={() => setRange('today')}
        >
          今日值班
        </Text>
        <Text
          className={classnames(styles.rangeBtn, range === 'all' && styles.rangeBtnActive)}
          onClick={() => setRange('all')}
        >
          全部记录
        </Text>
      </View>

      <Text className={styles.sectionTip}>
        共 {groups.length} 架次短停，按飞机号聚合，点击展开查看本次短停全部记录
      </Text>

      {groups.length > 0 ? (
        <ScrollView scrollY className={styles.groupList}>
          {groups.map(g => (
            <View key={g.key} className={styles.groupCard}>
              <View className={styles.groupHead} onClick={() => toggleGroup(g.key)}>
                <View className={styles.groupLeft}>
                  <Text className={styles.groupAircraft}>{g.aircraftNo}</Text>
                  <Text className={styles.groupMeta}>
                    {g.flightNo || '无航班'} · {g.parkingPosition || '无机位'} · {formatDateTime(g.latestTime)}
                  </Text>
                </View>
                <View className={styles.groupCounts}>
                  {g.verifyCount > 0 && (
                    <View className={classnames(styles.countChip, styles.verify)}>
                      <Text className={styles.countNum}>{g.verifyCount}</Text>
                      <Text className={styles.countTxt}>核验</Text>
                    </View>
                  )}
                  {g.reportCount > 0 && (
                    <View className={classnames(styles.countChip, styles.report)}>
                      <Text className={styles.countNum}>{g.reportCount}</Text>
                      <Text className={styles.countTxt}>异常</Text>
                    </View>
                  )}
                  {g.pendingCount > 0 && (
                    <View className={classnames(styles.countChip, styles.pending)}>
                      <Text className={styles.countNum}>{g.pendingCount}</Text>
                      <Text className={styles.countTxt}>待处</Text>
                    </View>
                  )}
                  <Text className={styles.expandIcon}>
                    {expandedKey === g.key ? '▾' : '▸'}
                  </Text>
                </View>
              </View>

              {expandedKey === g.key && (
                <View className={styles.recordList}>
                  {g.records.map(renderRecordRow)}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className={styles.emptyBox}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>暂无符合条件的数据</Text>
          <Text className={styles.emptyDesc}>
            {range === 'today' ? '今日还没有核验或上报记录，可切换为全部记录查看' : '没有匹配该筛选条件的记录'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default ShiftSummaryPage;
