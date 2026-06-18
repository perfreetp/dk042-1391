import React from 'react';
import { View } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatusBadgeProps {
  status: string;
  text: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  return (
    <View className={classnames(styles.badge, styles[status])}>
      {text}
    </View>
  );
};

export default StatusBadge;
