import { notification } from 'antd';

export const successNotification = (message, description) => {
  return notification.success({
    message: message,
    description,
    placement: "topRight",
    duration: 6,
  });
};

export const errorNotification = (message, description) => {
  return notification.error({
    message: message,
    description,
    placement: "topRight",
    duration: 6,
  });
};

export const infoNotification = (message, description) => {
  return notification.info({
    message: message,
    description,
    placement: "topRight",
    duration: 6,
  });
};