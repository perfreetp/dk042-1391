import Taro from '@tarojs/taro';

export const tempPathToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (/^data:/.test(filePath) || /^https?:/i.test(filePath)) {
      resolve(filePath);
      return;
    }

    try {
      const fs = Taro.getFileSystemManager();
      fs.readFile({
        filePath,
        encoding: 'base64',
        success: (res) => {
          resolve(`data:image/jpeg;base64,${res.data}`);
        },
        fail: (err) => {
          console.warn('[image] readFile fail, fallback:', err);
          reject(err);
        }
      });
    } catch (e) {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        fetch(filePath)
          .then(r => r.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(e);
            reader.readAsDataURL(blob);
          })
          .catch(() => reject(e));
      } else {
        reject(e);
      }
    }
  });
};

export const convertPhotosToBase64 = async (photos: string[]): Promise<string[]> => {
  const results = await Promise.all(
    photos.map(p => tempPathToBase64(p).catch(() => p))
  );
  return results;
};
