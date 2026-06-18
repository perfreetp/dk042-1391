import React, { useState } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import LargeButton from '@/components/LargeButton';
import PhotoUploader from '@/components/PhotoUploader';
import StatusBadge from '@/components/StatusBadge';
import type { ReportType, ReportRecord } from '@/types';
import { generateId, generateReportNo, getReportTypeText, formatDateTime } from '@/utils/format';
import dayjs from 'dayjs';

interface ReportTypeOption {
  key: ReportType;
  name: string;
  desc: string;
  icon: string;
}

const REPORT_TYPES: ReportTypeOption[] = [
  { key: 'blur_plate', name: '铭牌模糊', desc: '铭牌磨损/污渍，序号不清', icon: '🔍' },
  { key: 'serial_mismatch', name: '序号不符', desc: '实物与系统记录不一致', icon: '⚠️' },
  { key: 'no_record', name: '系统无记录', desc: '系统未找到该寿命件', icon: '❓' },
  { key: 'other', name: '其他异常', desc: '其他需上报的特殊情况', icon: '📎' }
];

const ReportPage: React.FC = () => {
  const { currentUser, reportRecords, addReportRecord, dailyStats } = useAppStore();

  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [serialNumber, setSerialNumber] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [aircraftNo, setAircraftNo] = useState('');
  const [flightNo, setFlightNo] = useState('');
  const [parkingPosition, setParkingPosition] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useDidShow(() => {
    const prefill = useAppStore.getState().pendingReportPrefill;
    if (prefill) {
      setReportType(prefill.reportType);
      setSerialNumber(prefill.serialNumber || '');
      setAircraftNo(prefill.aircraftNo || '');
      setFlightNo(prefill.flightNo || '');
      setParkingPosition(prefill.parkingPosition || '');
      setPartName(prefill.partName || '');
      useAppStore.getState().clearPendingReportPrefill();
      console.log('[Report] prefill from verify:', prefill.reportType);
      Taro.showToast({ title: '已带入核验信息，请补充照片', icon: 'none', duration: 1500 });
      Taro.pageScrollTo({ scrollTop: 0, duration: 200 });
    }
  });

  const canSubmit = (): boolean => {
    return (
      !!reportType &&
      aircraftNo.trim().length >= 4 &&
      flightNo.trim().length >= 4 &&
      parkingPosition.trim().length >= 2 &&
      photos.length >= 1
    );
  };

  const handleSubmit = () => {
    if (!canSubmit()) {
      Taro.showToast({ title: '请填写必填项并上传照片', icon: 'none' });
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const record: ReportRecord = {
        id: generateId(),
        reportNo: generateReportNo(),
        type: reportType as ReportType,
        typeText: getReportTypeText(reportType),
        serialNumber: serialNumber.trim().toUpperCase() || undefined,
        partNumber: partNumber.trim() || undefined,
        partName: partName.trim() || undefined,
        flightNo: flightNo.trim().toUpperCase(),
        parkingPosition: parkingPosition.trim().toUpperCase(),
        aircraftNo: aircraftNo.trim().toUpperCase(),
        photos,
        remark: remark.trim() || undefined,
        reportedBy: currentUser.name,
        reportedAt: dayjs().format('YYYY-MM-DD HH:mm'),
        status: 'pending',
        statusText: '待处理'
      };

      addReportRecord(record);
      console.log('[Report] submitted:', record.reportNo);

      setSubmitting(false);
      Taro.showModal({
        title: '上报成功',
        content: `上报单号：${record.reportNo}\n已同步至 MCC 控制中心和航材岗，预计15分钟内响应。`,
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          setReportType('');
          setSerialNumber('');
          setPartNumber('');
          setPartName('');
          setAircraftNo('');
          setFlightNo('');
          setParkingPosition('');
          setPhotos([]);
          setRemark('');
        }
      });
    }, 800);
  };

  const goDetail = (record: ReportRecord) => {
    Taro.navigateTo({
      url: `/pages/report-detail/index?id=${record.id}`
    });
  };

  const historyList = reportRecords;

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>📝</Text>
          异常类型
        </Text>
        <View className={styles.typeOptions}>
          {REPORT_TYPES.map((opt) => (
            <View
              key={opt.key}
              className={classnames(
                styles.typeCard,
                reportType === opt.key && styles.typeCardSelected
              )}
              onClick={() => setReportType(opt.key)}
            >
              <Text className={styles.typeIcon}>{opt.icon}</Text>
              <Text className={styles.typeName}>{opt.name}</Text>
              <Text className={styles.typeDesc}>{opt.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>✈️</Text>
          航班与飞机信息
        </Text>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>
            飞机注册号 <Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="例如 B-8965"
              placeholderStyle="color:#94A3B8"
              value={aircraftNo}
              onInput={(e) => setAircraftNo(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>
            航班号 <Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="例如 CA1831 / MU5341"
              placeholderStyle="color:#94A3B8"
              value={flightNo}
              onInput={(e) => setFlightNo(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>
            停场位置 <Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="例如 A12 / B05 廊桥号"
              placeholderStyle="color:#94A3B8"
              value={parkingPosition}
              onInput={(e) => setParkingPosition(e.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>🔧</Text>
          航材信息（选填）
        </Text>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>序列号 (SN)</Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="铭牌可辨识部分"
              placeholderStyle="color:#94A3B8"
              value={serialNumber}
              onInput={(e) => setSerialNumber(e.detail.value)}
            />
          </View>
          <Text className={styles.inputHint}>铭牌模糊时尽量输入可识别字符</Text>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>零件号 (PN)</Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="例如 PN-A320-XXX-XXX"
              placeholderStyle="color:#94A3B8"
              value={partNumber}
              onInput={(e) => setPartNumber(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>航材名称</Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="例如 主起落架减震支柱"
              placeholderStyle="color:#94A3B8"
              value={partName}
              onInput={(e) => setPartName(e.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <PhotoUploader
          title="现场照片"
          required={true}
          photos={photos}
          maxCount={6}
          onChange={setPhotos}
        />
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>📌</Text>
          情况说明（选填）
        </Text>
        <View className={styles.textareaWrap}>
          <Textarea
            className={styles.textarea}
            placeholder="详细描述异常情况、已采取的临时措施等..."
            placeholderStyle="color:#94A3B8"
            value={remark}
            onInput={(e) => setRemark(e.detail.value)}
            maxlength={500}
            showConfirmBar={false}
            adjustPosition={true}
          />
        </View>
        <Text className={styles.inputHint}>最多500字，MCC调度岗和航材控制岗会收到此说明</Text>
      </View>

      <LargeButton
        text={submitting ? '提交中...' : '提交至 MCC / 航材控制岗'}
        type="warning"
        disabled={!canSubmit() || submitting}
        onClick={handleSubmit}
      />

      <View className={styles.historySection}>
        <View className={styles.historyHeader}>
          <Text className={styles.historyTitle}>我提交的上报记录</Text>
          <Text className={styles.historyCount}>共{dailyStats.reportCount}条</Text>
        </View>

        {historyList.length > 0 ? (
          <View className={styles.historyList}>
            {historyList.map((record) => (
              <View
                key={record.id}
                className={styles.historyCard}
                onClick={() => goDetail(record)}
              >
                <View className={styles.historyTop}>
                  <Text className={styles.reportNo}>{record.reportNo}</Text>
                  <StatusBadge status={record.status} text={record.statusText} />
                </View>
                <View className={styles.historyBody}>
                  <Text className={styles.historyTitle2}>
                    {record.typeText}
                    {record.partName && ` · ${record.partName}`}
                  </Text>
                  <View className={styles.historyMeta}>
                    <Text className={styles.metaItem}>✈️ {record.aircraftNo}</Text>
                    <Text className={styles.metaItem}>🛫 {record.flightNo}</Text>
                    <Text className={styles.metaItem}>📍 {record.parkingPosition}</Text>
                  </View>
                </View>
                <View className={styles.historyFooter}>
                  <Text className={styles.reporter}>
                    {record.reportedBy} · {formatDateTime(record.reportedAt)}
                  </Text>
                  <Text style={{ color: '#94A3B8', fontSize: '24rpx' }}>查看详情 ›</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyHistory}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无上报记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ReportPage;
