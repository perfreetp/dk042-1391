import React from 'react';
import { Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface LargeButtonProps {
  text: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'ghost';
  size?: 'normal' | 'small';
  block?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const LargeButton: React.FC<LargeButtonProps> = ({
  text,
  type = 'primary',
  size = 'normal',
  block = true,
  disabled = false,
  onClick
}) => {
  return (
    <Button
      className={classnames(
        styles.button,
        styles[type],
        size === 'small' && styles.small,
        block && styles.block
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </Button>
  );
};

export default LargeButton;
