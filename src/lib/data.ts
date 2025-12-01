// This file contains utility functions for data formatting and constants

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatReadTime = (minutes: number): string => {
  return `${minutes}분 읽기`;
};

export const formatViews = (views: number): string => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`;
  }
  return views.toString();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const categoryColors: Record<string, string> = {
  react: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  typescript: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
  css: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  performance: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  nextjs: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
};

export const defaultGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
];
