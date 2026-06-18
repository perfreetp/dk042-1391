import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';

const MinePage: React.FC = () => {
  const { currentUser, dailyStats, verifyRecords, reportRecords } = useAppStore();

  const getInitial = (name: string) => {
    return name ? name.charAt(0) : '?';
  };

  const handleMenuClick = (key: string, title: string) => {
    console.log('[Mine] menu clicked:', key);
    Taro.showToast({ title: `${title}功能开发中`, icon: 'none' });
  };

  const menuList = [
    [
      {
        key: 'verify_history',
        icon: '📋',
        iconClass: 'blue',
        title: '核验记录',
        desc: `${verifyRecords.length}条核验档案，可筛选查询`,
        onClick: () => Taro.navigateTo({ url: '/pages/history/index?tab=all' })
      },
      {
        key: 'report_history',
        icon: '📸',
        iconClass: 'orange',
        title: '上报记录',
        desc: `${reportRecords.length}条异常，跟踪处理进度`,
        badge: reportRecords.filter(r => r.status === 'pending').length,
        onClick: () => Taro.navigateTo({ url: '/pages/history/index?tab=report' })
      },
      {
        key: 'signature',
        icon: '✍️',
        iconClass: 'green',
        title: '电子签章管理',
        desc: '授权签署范围与权限设置',
        onClick: () => handleMenuClick('signature', '电子签章')
      }
    ],
    [
      {
        key: 'message',
        icon: '🔔',
        iconClass: 'orange',
        title: '消息通知',
        desc: 'MCC通知、航材回复、系统公告',
        onClick: () => handleMenuClick('message', '消息通知')
      },
      {
        key: 'help',
        icon: '❓',
        iconClass: 'gray',
        title: '使用帮助',
        desc: '操作手册、常见问题、寿命件判定标准',
        onClick: () => handleMenuClick('help', '使用帮助')
      },
      {
        key: 'setting',
        icon: '⚙️',
        iconClass: 'gray',
        title: '系统设置',
        desc: '字体大小、离线模式、缓存清理',
        onClick: () => handleMenuClick('setting', '系统设置')
      }
    ]
  ];

  const menuGroupTitles = ['业务记录', '工具与设置'];

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.profile}>
          <View className={styles.avatar}>{getInitial(currentUser.name)}</View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>
              {currentUser.name}
              <Text className={styles.certIcon}>✓ 已授权放行</Text>
            </Text>
            <Text className={styles.userMeta}>
              工号：{currentUser.employeeNo} · {currentUser.role}
            </Text>
            <Text className={styles.userDept}>{currentUser.department}</Text>
          </View>
        </View>

        <View className={styles.statsWrap}>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{dailyStats.totalVerify}</Text>
              <Text className={styles.statLabel}>今日核验</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#DCFCE7' }}>{dailyStats.passCount}</Text>
              <Text className={styles.statLabel}>通过数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#FEF3C7' }}>{dailyStats.reviewCount}</Text>
              <Text className={styles.statLabel}>复核数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#FEE2E2' }}>{dailyStats.reportCount}</Text>
              <Text className={styles.statLabel}>上报数</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.workCard}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📊</Text>
            工作绩效
          </Text>
          <View className={styles.workSummary}>
            <View className={styles.workItem}>
              <Text className={classnames(styles.workValue, styles.success)}>
                {dailyStats.totalVerify > 0
                  ? Math.round((dailyStats.passCount / dailyStats.totalVerify) * 100)
                  : 0}%
              </Text>
              <Text className={styles.workLabel}>一次放行率</Text>
              <Text className={styles.workHint}>较昨日 +2.3%</Text>
            </View>
            <View className={styles.workItem}>
              <Text className={classnames(styles.workValue, styles.warning)}>
                {dailyStats.reviewCount + dailyStats.rejectCount}
              </Text>
              <Text className={styles.workLabel}>需关注事项</Text>
              <Text className={styles.workHint}>含复核与禁止放行</Text>
            </View>
            <View className={styles.workItem}>
              <Text className={classnames(styles.workValue, styles.danger)}>{dailyStats.reportCount}</Text>
              <Text className={styles.workLabel}>异常待处理</Text>
              <Text className={styles.workHint}>航材控制岗处理中</Text>
            </View>
            <View className={styles.workItem}>
              <Text className={styles.workValue}>
                {verifyRecords.length > 0
                  ? verifyRecords.filter(r => r.status === 'reject').length
                  : 0}
              </Text>
              <Text className={styles.workLabel}>禁止放行累计</Text>
              <Text className={styles.workHint}>需MCC介入的情况</Text>
            </View>
          </View>
        </View>

        {menuList.map((group, groupIdx) => (
          <View key={groupIdx}>
            {groupIdx > 0 && (
              <Text className={styles.menuGroupTitle} style={{ paddingBottom: '16rpx' }}>
                {menuGroupTitles[groupIdx]}
              </Text>
            )}
            <View className={styles.menuGroup}>
              {group.map((item) => (
                <View
                  key={item.key}
                  className={styles.menuItem}
                  onClick={item.onClick}
                >
                  <View className={classnames(styles.menuIcon, styles[item.iconClass])}>
                    {item.icon}
                  </View>
                  <View className={styles.menuText}>
                    <Text className={styles.menuTitle}>{item.title}</Text>
                    <Text className={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  {item.badge && item.badge > 0 ? (
                    <Text className={styles.menuBadge}>{item.badge}</Text>
                  ) : (
                    <Text className={styles.menuArrow}>›</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default MinePage;
