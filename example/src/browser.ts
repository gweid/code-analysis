export const getCookie = () => document.cookie;

export const getLocalStorage = (key: string) => window.localStorage.getItem(key);

export const historyUtil = () => {
  history.back();
};

export const historyBack = () => {
  window.history.back();
};
