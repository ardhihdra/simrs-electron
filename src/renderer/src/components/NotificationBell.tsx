import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { Badge, Button, Empty, List, Popover, Typography } from 'antd'
import { useNotificationStore } from '@renderer/store/notificationStore'
import dayjs from 'dayjs'

const { Text, Title } = Typography

const NotificationBell = () => {
  const { notifications, unreadCount, isOpen, setIsOpen, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore()

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
  }

  const content = (
    <div className="w-80 max-h-[500px] flex flex-col text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-2 px-1">
        <Title level={5} style={{ margin: 0 }}>
          Notifications
        </Title>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={markAllAsRead}
              title="Mark all as read"
            />
          )}
          {notifications.length > 0 && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={clearAll}
              title="Clear all"
            />
          )}
        </div>
      </div>
      <div className="overflow-y-auto max-h-[400px]">
        {notifications.length === 0 ? (
          <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-2 rounded ${!item.read ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                onClick={() => markAsRead(item.id)}
              >
                <List.Item.Meta
                  title={
                    <div className="flex justify-between px-4">
                      <Text strong={!item.read}>{item.title}</Text>
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        {dayjs(item.timestamp).format('HH:mm')}
                      </Text>
                    </div>
                  }
                  description={
                    <div className="px-4">
                      <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {item.body}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-400 mt-1 capitalize">
                        {item.type}
                      </div>
                    </div>
                  }
                />
                {!item.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 shrink-0 mr-2" />
                )}
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={isOpen}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      overlayClassName="notification-popover"
    >
      <div className="cursor-pointer p-2 flex items-center">
        <Badge count={unreadCount} overflowCount={99} size="small">
          <BellOutlined className="text-[20px] text-[#555] dark:text-gray-200" />
        </Badge>
      </div>
    </Popover>
  )
}

export default NotificationBell
