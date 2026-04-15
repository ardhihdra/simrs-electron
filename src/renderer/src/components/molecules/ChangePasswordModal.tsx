import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { useProfileStore } from '@renderer/store/profileStore'
import { App, Divider, Form, Input, InputNumber, Modal, Switch } from 'antd'
import { useState } from 'react'
import { SelectAsync } from '../organisms/SelectAsync'

interface FormValues {
    oldPassword?: string
    newPassword: string
    confirmPassword: string
    targetUserId?: number
}

interface Props {
    open: boolean
    onClose: () => void
}

function ChangePasswordModal({ open, onClose }: Props) {
    const [form] = Form.useForm<FormValues>()
    const { message } = App.useApp()
    const profile = useProfileStore((s) => s.profile)
    const isAdmin = profile?.hakAksesId === 'administrator'
    const [resetOther, setResetOther] = useState(false)

    const mutation = client.auth.changePassword.useMutation()

    const handleFinish = async (values: FormValues) => {
        if (values.newPassword !== values.confirmPassword) {
            form.setFields([{ name: 'confirmPassword', errors: ['Passwords do not match'] }])
            return
        }

        try {
            const payload: Parameters<typeof mutation.mutateAsync>[0] = {
                newPassword: values.newPassword
            }

            if (isAdmin && resetOther && values.targetUserId) {
                payload.targetUserId = values.targetUserId
            } else {
                payload.oldPassword = values.oldPassword
            }

            const res = await mutation.mutateAsync(payload)

            if (!res.success) {
                message.error(res.message || 'Failed to change password')
                return
            }

            message.success(res.message || 'Password changed successfully')
            form.resetFields()
            setResetOther(false)
            onClose()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to change password'
            message.error(errorMessage)
        }
    }

    const handleCancel = () => {
        form.resetFields()
        setResetOther(false)
        onClose()
    }

    return (
        <Modal
            title="Change Password"
            open={open}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            okText="Change Password"
            confirmLoading={mutation.isPending}
            destroyOnHidden
        >
            <Form form={form} layout="vertical" onFinish={(v) => void handleFinish(v)}>
                {isAdmin && (
                    <>
                        <Divider orientation="left" orientationMargin={0} className="text-xs text-gray-400">
                            Administrator options
                        </Divider>
                        <Form.Item label="Reset another account's password">
                            <Switch
                                checked={resetOther}
                                onChange={(checked) => {
                                    setResetOther(checked)
                                    form.resetFields(['oldPassword', 'targetUserId'])
                                }}
                                checkedChildren="On"
                                unCheckedChildren="Off"
                            />
                        </Form.Item>

                        {resetOther && (
                            <Form.Item
                                name="targetUserId"
                                label="Target User ID"
                                rules={[{ required: true, message: 'Please enter the target user ID' }]}
                            >
                                <SelectAsync
                                    entity="kepegawaian"
                                    display="namaLengkap"
                                    output="id"
                                    // disabled={!!queue?.patientId}
                                    placeHolder="Cari Data Pasien"
                                    className="w-full"
                                />
                            </Form.Item>
                        )}

                        <Divider className="my-3" />
                    </>
                )}

                {(!isAdmin || !resetOther) && (
                    <Form.Item
                        name="oldPassword"
                        label="Current Password"
                        rules={[{ required: true, message: 'Please enter your current password' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Current password" />
                    </Form.Item>
                )}

                <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[
                        { required: true, message: 'Please enter a new password' },
                        { min: 8, message: 'Password must be at least 8 characters' }
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="New password (min. 8 characters)" />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label="Confirm New Password"
                    rules={[{ required: true, message: 'Please confirm your new password' }]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default ChangePasswordModal
