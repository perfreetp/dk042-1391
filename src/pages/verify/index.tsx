import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import LargeButton from '@/components/LargeButton';
import VerifyResultCard, { VerifyResultData } from '@/components/VerifyResultCard';
import type { VerifyStatus, VerifyRecord } from '@/types';
import { getStatusText, generateId } from '@/utils/format';
import dayjs from 'dayjs';

const QUICK_SERIAL_SAMPLES = [
  'SN202400012345',
  'SN202400023456',
  'SN202400034567',
  'SN202400056789',
  'SN202400089012'
];

const calcVerifyStatus = (part: {
  remainingHours: number;
  maxHours: number;
  remainingCycles: number;
  maxCycles: number;
  hasMELRestriction: boolean;
  hasCDLRestriction: boolean;
}): VerifyStatus => {
  const hoursRatio = part.remainingHours / part.maxHours;
  const cyclesRatio = part.remainingCycles / part.maxCycles;
  const minRatio = Math.min(hoursRatio, cyclesRatio);

  if (part.hasCDLRestriction || minRatio < 0.05) {
    return 'reject';
  }
  if (part.hasMELRestriction || minRatio < 0.2) {
    return 'review';
  }
  return 'pass';
};

const VerifyPage: React.FC = () => {
  const { currentUser, queryPartBySerial, addVerifyRecord, setPendingReportPrefill } = useAppStore();

  const [serialNumber, setSerialNumber] = useState('');
  const [aircraftNo, setAircraftNo] = useState('');
  const [position, setPosition] = useState('');
  const [flightNo, setFlightNo] = useState('');
  const [parkingPosition, setParkingPosition] = useState('');
  const [positionConfirmed, setPositionConfirmed] = useState(false);
  const [fromTodo, setFromTodo] = useState(false);
  const [result, setResult] = useState<VerifyResultData | null>(null);
  const [verifying, setVerifying] = useState(false);

  const resetForm = () => {
    setSerialNumber('');
    setAircraftNo('');
    setPosition('');
    setFlightNo('');
    setParkingPosition('');
    setPositionConfirmed(false);
    setFromTodo(false);
    setResult(null);
  };

  useDidShow(() => {
    const task = useAppStore.getState().pendingVerifyTask;
    if (task) {
      setSerialNumber(task.serialNumber);
      setAircraftNo(task.aircraftNo);
      setFlightNo(task.flightNo || '');
      setPosition(task.position);
      setParkingPosition(task.parkingPosition || '');
      setPositionConfirmed(false);
      setFromTodo(true);
      setResult(null);
      useAppStore.getState().clearPendingVerifyTask();
      console.log('[Verify] prefill from todo:', task.aircraftNo, task.position);
    } else {
      resetForm();
    }
  });

  const canVerify = useMemo(() => {
    return (
      serialNumber.trim().length >= 6 &&
      aircraftNo.trim().length >= 4 &&
      position.trim().length >= 2 &&
      positionConfirmed
    );
  }, [serialNumber, aircraftNo, position, positionConfirmed]);

  const invalidateResult = () => {
    if (result) setResult(null);
    if (positionConfirmed) setPositionConfirmed(false);
  };

  const handleSerialChange = (val: string) => {
    setSerialNumber(val);
    invalidateResult();
  };

  const handleAircraftChange = (val: string) => {
    setAircraftNo(val);
    invalidateResult();
  };

  const handlePositionChange = (val: string) => {
    setPosition(val);
    invalidateResult();
  };

  const handleScan = async () => {
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['barCode', 'qrCode']
      });
      console.log('[Verify] scanCode result:', res.result);
      setSerialNumber(res.result);
      invalidateResult();
      Taro.showToast({ title: '识别成功', icon: 'success', duration: 1000 });
    } catch (error) {
      console.error('[Verify] scanCode error:', error);
      Taro.showToast({ title: '扫码取消，请手动输入', icon: 'none' });
    }
  };

  const handleVerify = async () => {
    if (!canVerify) {
      Taro.showToast({ title: positionConfirmed ? '请填写完整信息' : '请先勾选确认装机位置', icon: 'none' });
      return;
    }

    setVerifying(true);
    setResult(null);

    setTimeout(() => {
      const serial = serialNumber.trim().toUpperCase();
      const part = queryPartBySerial(serial);

      if (!part) {
        setVerifying(false);
        Taro.showModal({
          title: '系统未找到记录',
          content: `序号 ${serial} 未在寿命件库中找到。\n建议：检查序号或提交异常上报。`,
          confirmText: '去上报',
          cancelText: '重新输入',
          success: (res) => {
            if (res.confirm) {
              setPendingReportPrefill({
                reportType: 'no_record',
                serialNumber: serial,
                aircraftNo: aircraftNo.trim().toUpperCase(),
                flightNo: flightNo.trim().toUpperCase() || undefined,
                parkingPosition: parkingPosition.trim().toUpperCase() || undefined
              });
              Taro.switchTab({ url: '/pages/report/index' });
            }
          }
        });
        return;
      }

      const status = calcVerifyStatus(part);
      const verifyResult: VerifyResultData = {
        status,
        statusText: getStatusText(status),
        partName: part.partName,
        partNumber: part.partNumber,
        serialNumber: part.serialNumber,
        manufacturer: part.manufacturer,
        isLifeControlled: part.isLifeControlled,
        remainingHours: part.remainingHours,
        remainingCycles: part.remainingCycles,
        maxHours: part.maxHours,
        maxCycles: part.maxCycles,
        hasMELRestriction: part.hasMELRestriction,
        melReference: part.melReference,
        hasCDLRestriction: part.hasCDLRestriction,
        cdlReference: part.cdlReference,
        lastInstalledBy: part.lastInstalledBy,
        lastInstalledAt: part.lastInstalledAt
      };

      setResult(verifyResult);
      setVerifying(false);
      console.log('[Verify] verify result:', status, part.partName);

      Taro.vibrateShort({ type: status === 'pass' ? 'light' : 'heavy' });
    }, 1000);
  };

  const handleSign = () => {
    if (!result) return;

    Taro.showModal({
      title: '确认核验签署',
      content: `我确认 ${aircraftNo} ${position} 的航材状态核验无误，签署人：${currentUser.name}（${currentUser.employeeNo}）`,
      confirmText: '确认签署',
      success: (res) => {
        if (res.confirm && result) {
          const record: VerifyRecord = {
            id: generateId(),
            serialNumber: result.serialNumber,
            partName: result.partName,
            partNumber: result.partNumber,
            aircraftNo: aircraftNo.trim().toUpperCase(),
            position: position.trim(),
            status: result.status,
            statusText: result.statusText,
            verifiedBy: currentUser.name,
            verifiedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            flightNo: flightNo.trim().toUpperCase() || undefined,
            parkingPosition: parkingPosition.trim().toUpperCase() || undefined,
            remainingHours: result.remainingHours,
            remainingCycles: result.remainingCycles,
            hasMELRestriction: result.hasMELRestriction,
            hasCDLRestriction: result.hasCDLRestriction,
            remark: result.status === 'pass'
              ? '核验通过'
              : result.status === 'review'
                ? '已按MEL保留办理'
                : '禁止放行，已通知MCC'
          };

          addVerifyRecord(record);
          console.log('[Verify] signed record:', record.id);

          Taro.showToast({
            title: result.status === 'reject' ? '已记录并通知MCC' : '签署成功',
            icon: 'success',
            duration: 1200
          });

          setTimeout(() => {
            Taro.switchTab({ url: '/pages/home/index' });
          }, 1200);
        }
      }
    });
  };

  const handleReport = () => {
    if (result) {
      setPendingReportPrefill({
        reportType: 'serial_mismatch',
        serialNumber: result.serialNumber,
        partName: result.partName,
        aircraftNo: aircraftNo.trim().toUpperCase(),
        flightNo: flightNo.trim().toUpperCase() || undefined,
        parkingPosition: parkingPosition.trim().toUpperCase() || undefined
      });
    }
    Taro.switchTab({ url: '/pages/report/index' });
  };

  return (
    <View className={styles.page}>
      {fromTodo && (
        <View className={styles.fromTodoBanner}>
          <Text className={styles.todoIcon}>📌</Text>
          <View className={styles.todoText}>
            <Text className={styles.todoTitle}>来自待办任务，请现场核对后继续</Text>
            <Text className={styles.todoDesc}>
              {aircraftNo} · {position} · {flightNo || '未录航班'}
            </Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>📋</Text>
          录入航材信息
        </Text>

        <View className={styles.scanArea}>
          <Button className={styles.scanBtn} onClick={handleScan}>
            <Text className={styles.scanIcon}>📷</Text>
            <View className={styles.scanText}>
              <Text className={styles.scanTitle}>扫描铭牌条码 / 序列号</Text>
              <Text className={styles.scanDesc}>调用相机自动识别，也支持相册图片</Text>
            </View>
          </Button>

          <View className={styles.quickSerials}>
            {QUICK_SERIAL_SAMPLES.map((s) => (
              <Text
                key={s}
                className={styles.quickTag}
                onClick={() => { setSerialNumber(s); invalidateResult(); }}
              >
                {s}
              </Text>
            ))}
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>
            序列号 (SN) <Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="输入或扫描 SN 开头的序列号"
              placeholderStyle="color:#94A3B8"
              value={serialNumber}
              onInput={(e) => handleSerialChange(e.detail.value)}
            />
          </View>
          <Text className={styles.inputHint}>输入完整序列号，例如 SN202400012345</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>✈️</Text>
          装机位置确认
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
              onInput={(e) => handleAircraftChange(e.detail.value)}
            />
          </View>
          <Text className={styles.inputHint}>机身尾部喷涂的注册号，B-开头</Text>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>
            装机位置 <Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="例如 主起落架左 / 左发核心机"
              placeholderStyle="color:#94A3B8"
              value={position}
              onInput={(e) => handlePositionChange(e.detail.value)}
            />
          </View>
          <Text className={styles.inputHint}>必须与实际装机位置一致，避免错装</Text>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>停场机位（选填）</Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="例如 A08 / B15 廊桥号"
              placeholderStyle="color:#94A3B8"
              value={parkingPosition}
              onInput={(e) => setParkingPosition(e.detail.value)}
            />
          </View>
          <Text className={styles.inputHint}>用于异常上报时定位飞机停场位置</Text>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>航班号（选填）</Text>
          <View className={styles.inputWrap}>
            <Input
              className={styles.input}
              type="text"
              placeholder="例如 CA1831"
              placeholderStyle="color:#94A3B8"
              value={flightNo}
              onInput={(e) => setFlightNo(e.detail.value)}
            />
          </View>
        </View>

        {aircraftNo.trim().length >= 4 && position.trim().length >= 2 && (
          <View className={classnames(styles.confirmCard, positionConfirmed && styles.confirmCardDone)}>
            <Text className={styles.confirmTitle}>
              {positionConfirmed ? '✓ 已确认装机位置' : '⚠ 请现场核对以下信息'}
            </Text>
            <View className={styles.confirmGrid}>
              <View className={styles.confirmItem}>
                <Text className={styles.confirmLabel}>飞机号</Text>
                <Text className={styles.confirmValue}>{aircraftNo.toUpperCase()}</Text>
              </View>
              <View className={styles.confirmItem}>
                <Text className={styles.confirmLabel}>装机位置</Text>
                <Text className={styles.confirmValue}>{position}</Text>
              </View>
            </View>
            <View
              className={classnames(styles.confirmCheck, positionConfirmed && styles.confirmCheckDone)}
              onClick={() => setPositionConfirmed(!positionConfirmed)}
            >
              <View className={classnames(styles.checkBox, positionConfirmed && styles.checked)}>
                {positionConfirmed && <Text className={styles.checkIcon}>✓</Text>}
              </View>
              <Text className={styles.checkText}>
                {positionConfirmed
                  ? '已现场核对，飞机号与装机位置一致'
                  : '我已现场核对，飞机号与装机位置一致'}
              </Text>
            </View>
          </View>
        )}

        <LargeButton
          text={verifying ? '核验查询中...' : (positionConfirmed ? '开始核验寿命状态' : '请先勾选确认装机位置')}
          type={positionConfirmed ? 'primary' : 'secondary'}
          disabled={!canVerify || verifying}
          onClick={handleVerify}
        />
      </View>

      {result && (
        <View className={styles.resultWrap}>
          <Text className={styles.sectionTitle} style={{ marginBottom: '24rpx' }}>
            <Text className={styles.titleIcon}>🎯</Text>
            核验结果
          </Text>
          <VerifyResultCard
            data={result}
            showSignButton={true}
            showSignInfo={true}
            onSign={handleSign}
            onReport={handleReport}
          />
        </View>
      )}
    </View>
  );
};

export default VerifyPage;
