import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatCard from '@/components/StatCard';
import { formatTime } from '@/utils/format';
import type { VerifyRecord } from '@/types';

const todoList = [
  {
    id: 't1',
    aircraftNo: 'B-8965',
    parking: 'A08',
    flightNo: 'CA1831',
    partName: '主起落架减震支柱',
    position: '主起落架左',
    serialNumber: 'SN202400012345',
    priority: 'high',
    hint: '航班30分钟后出港，建议优先核验'
  },
  {
    id: 't2',
    aircraftNo: 'B-5623',
    parking: 'B15',
    flightNo: 'MU5341',
    partName: 'CFM56-7B发动机高压涡轮叶片',
    position: '左发核心机',
    serialNumber: 'SN202400023456',
    priority: 'normal',
    hint: '航班45分钟后出港'
  },
  {
    id: 't3',
    aircraftNo: 'B-305A',
    parking: 'C22',
    flightNo: 'CZ3562',
    partName: 'APU辅助动力装置',
    position: 'APU舱',
    serialNumber: 'SN202400034567',
    priority: 'high',
    hint: '航班25分钟后出港，请尽快核验'
  }
];

const HomePage: React.FC = () => {
  const { currentUser, dailyStats, verifyRecords, pendingVerifyCount, setPendingVerifyTask } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success', duration: 1000 });
    }, 800);
  };

  const goVerify = (todo?: typeof todoList[0]) => {
    if (todo) {
      setPendingVerifyTask({
        serialNumber: todo.serialNumber,
        aircraftNo: todo.aircraftNo,
        flightNo: todo.flightNo,
        position: todo.position,
        parkingPosition: todo.parking,
        partName: todo.partName,
        source: 'todo'
      });
      console.log('[Home] set pending verify task:', todo.aircraftNo, todo.position);
    }
    Taro.switchTab({ url: '/pages/verify/index' });
  };

  const goReport = () => {
    Taro.switchTab({ url: '/pages/report/index' });
  };

  const goVerifyDetail = (record: VerifyRecord) => {
    Taro.navigateTo({
      url: `/pages/verify-detail/index?id=${record.id}`
    });
  };

  const goHistory = () => {
    Taro.navigateTo({ url: '/pages/history/index' });
  };

  const recentHistory = verifyRecords.slice(0, 4);

  return (
    <ScrollView
      scrollY
      className={styles.page}
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.header}>
        <View className={styles.userCard}>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{currentUser.name}</Text>
            <Text className={styles.userMeta}>
              工号 {currentUser.employeeNo} · {currentUser.department}
            </Text>
          </View>
          <View className={styles.roleTag}>{currentUser.role}</View>
        </View>

        <View className={styles.statsGrid}>
          <StatCard value={dailyStats.totalVerify} label="今日核验" color="primary" />
          <StatCard value={dailyStats.passCount} label="可放行" color="success" />
          <StatCard value={dailyStats.reviewCount} label="需复核" color="warning" />
          <StatCard value={dailyStats.rejectCount} label="禁止放行" color="danger" />
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.quickActions}>
          <View
            className={classnames(styles.actionCard, styles.verifyAction)}
            onClick={() => goVerify()}
          >
            <View className={styles.actionIcon}>🔍</View>
            <Text className={styles.actionTitle}>快速核验</Text>
            <Text className={styles.actionDesc}>扫描铭牌/输入序号</Text>
          </View>
          <View
            className={classnames(styles.actionCard, styles.reportAction)}
            onClick={goReport}
          >
            <View className={styles.actionIcon}>📷</View>
            <Text className={styles.actionTitle}>异常上报</Text>
            <Text className={styles.actionDesc}>拍照提交MCC处理</Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              待办核验
              {pendingVerifyCount > 0 && (
                <Text className={styles.badgeCount}>{pendingVerifyCount}</Text>
              )}
            </Text>
            <Text className={styles.sectionMore}>
              航班前{formatTime('2025-06-18 12:30')}出港高峰
            </Text>
          </View>

          {todoList.length > 0 ? (
            <View className={styles.todoList}>
              {todoList.map((todo) => (
                <View
                  key={todo.id}
                  className={styles.todoCard}
                  onClick={() => goVerify(todo)}
                >
                  <View className={styles.todoHeader}>
                    <View className={styles.aircraftInfo}>
                      <Text className={styles.aircraftNo}>{todo.aircraftNo}</Text>
                      <Text className={styles.parkingTag}>机位 {todo.parking}</Text>
                      <Text className={styles.parkingTag}>{todo.flightNo}</Text>
                    </View>
                    {todo.priority === 'high' && (
                      <Text className={styles.priorityTag}>紧急</Text>
                    )}
                  </View>
                  <View className={styles.todoContent}>
                    <Text className={styles.partName}>{todo.partName}</Text>
                    <Text className={styles.position}>装机位置：{todo.position}</Text>
                  </View>
                  <View className={styles.todoFooter}>
                    <Text className={styles.hintText}>⏰ {todo.hint}</Text>
                    <View className={styles.handleBtn}>立即核验</View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyTodo}>
              <Text className={styles.emptyIcon}>✓</Text>
              <Text className={styles.emptyText}>暂无待办核验任务</Text>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>最近核验记录</Text>
            <Text className={styles.sectionMore} onClick={goHistory}>
              共{verifyRecords.length}条 ›
            </Text>
          </View>

          <View className={styles.historyList}>
            {recentHistory.map((record) => (
              <View
                key={record.id}
                className={styles.historyItem}
                onClick={() => goVerifyDetail(record)}
              >
                <View
                  className={classnames(
                    styles.statusDot,
                    record.status === 'pass' && styles.passDot,
                    record.status === 'review' && styles.reviewDot,
                    record.status === 'reject' && styles.rejectDot
                  )}
                />
                <View className={styles.historyInfo}>
                  <View className={styles.historyTop}>
                    <Text className={styles.aircraftMini}>{record.aircraftNo}</Text>
                    <Text className={styles.parkingTag}>{record.statusText}</Text>
                  </View>
                  <Text className={styles.historyPart}>
                    {record.partName} · {record.position}
                  </Text>
                </View>
                <Text className={styles.historyTime}>
                  {formatTime(record.verifiedAt)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
