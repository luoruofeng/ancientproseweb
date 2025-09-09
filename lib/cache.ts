import Cookies from 'js-cookie';

const READING_PROGRESS_COOKIE_PREFIX = 'reading_progress_';

// 设置阅读进度
export const setReadingProgress = (dirname: string, subdirname: string, sliderId: number) => {
  const key = `${READING_PROGRESS_COOKIE_PREFIX}${dirname}/${subdirname}`;
  Cookies.set(key, String(sliderId), { expires: 365 }); // Cookie 保存一年
};

// 获取阅读进度
export const getReadingProgress = (dirname: string, subdirname: string): number | null => {
  const key = `${READING_PROGRESS_COOKIE_PREFIX}${dirname}/${subdirname}`;
  const savedId = Cookies.get(key);
  if (savedId) {
    const sliderId = parseInt(savedId, 10);
    return isNaN(sliderId) ? null : sliderId;
  }
  return null;
};