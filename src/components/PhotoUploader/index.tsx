import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { tempPathToBase64 } from '@/utils/image';

interface PhotoUploaderProps {
  title?: string;
  required?: boolean;
  photos: string[];
  maxCount?: number;
  onChange: (photos: string[]) => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  title = '现场照片',
  required = true,
  photos,
  maxCount = 6,
  onChange
}) => {
  const handleChooseImage = async () => {
    try {
      const remaining = maxCount - photos.length;
      if (remaining <= 0) {
        Taro.showToast({ title: `最多上传${maxCount}张`, icon: 'none' });
        return;
      }

      const res = await Taro.chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      });

      console.log('[PhotoUploader] chooseImage:', res.tempFilePaths.length, 'files');
      Taro.showLoading({ title: '处理图片中...', mask: true });
      const base64List = await Promise.all(
        res.tempFilePaths.map(p => tempPathToBase64(p).catch(() => p))
      );
      Taro.hideLoading();
      onChange([...photos, ...base64List]);
    } catch (error) {
      console.error('[PhotoUploader] chooseImage error:', error);
    }
  };

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  return (
    <View className={styles.uploader}>
      {title && (
        <Text className={styles.title}>
          {title}
          {required && <Text className={styles.required}>*</Text>}
        </Text>
      )}
      <View className={styles.grid}>
        {photos.map((photo, index) => (
          <View key={index} className={styles.photoItem}>
            <Image
              className={styles.photo}
              src={photo}
              mode="aspectFill"
              onClick={() => {
                Taro.previewImage({
                  urls: photos,
                  current: photo
                });
              }}
            />
            <View className={styles.removeBtn} onClick={() => handleRemove(index)}>
              ×
            </View>
          </View>
        ))}
        {photos.length < maxCount && (
          <View className={styles.addBtn} onClick={handleChooseImage}>
            <View className={styles.addContent}>
              <Text className={styles.addIcon}>+</Text>
              <Text className={styles.addText}>拍照/相册</Text>
            </View>
          </View>
        )}
      </View>
      <Text className={styles.hint}>建议拍摄铭牌全貌、序号特写和装机位置，共{photos.length}/{maxCount}张</Text>
    </View>
  );
};

export default PhotoUploader;
