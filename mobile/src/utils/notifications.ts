// Notification Utilities - Disabled for compatibility

export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  console.log('⚠️ Local notifications are disabled in this build');
  console.log('Would have shown:', title, body);
};

export const cancelAllNotifications = async (): Promise<void> => {
  console.log('⚠️ Notifications are disabled in this build');
};

export const cancelNotification = async (id: string): Promise<void> => {
  console.log('⚠️ Notifications are disabled in this build');
};
