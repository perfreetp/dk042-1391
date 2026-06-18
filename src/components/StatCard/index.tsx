import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  value: number | string;
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, color = 'primary', onClick }) => {
  return (
    <View className={styles.card} onClick={onClick}>
      <Text className={classnames(styles.value, styles[color])}>{value}</Text>
      <Text className={styles.label}>{label}</Text>
    </View>
  );
};

export default StatCard;
