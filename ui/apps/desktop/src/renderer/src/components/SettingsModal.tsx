import { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, message } from 'antd'

interface SettingsModalProps {
    open: boolean
    onClose: () => void
}

interface SettingsForm {
    apiEndpoint: string
    token: string
}

export default function SettingsModal({ open, onClose }: SettingsModalProps): React.JSX.Element {
    const [form] = Form.useForm<SettingsForm>()
    const [loading, setLoading] = useState(false)

    // Load saved config when modal opens
    useEffect(() => {
        if (open) {
            loadConfig()
        }
    }, [open])

    const loadConfig = async (): Promise<void> => {
        try {
            const config = await window.storeApi.getConfig()
            form.setFieldsValue({
                apiEndpoint: config.apiEndpoint || '',
                token: config.token || ''
            })
        } catch (error) {
            console.error('Failed to load config:', error)
        }
    }

    const handleSave = async (): Promise<void> => {
        try {
            setLoading(true)
            const values = await form.validateFields()

            // Save to electron store
            await window.storeApi.setConfig({
                apiEndpoint: values.apiEndpoint,
                token: values.token
            })

            // Also sync token to localStorage for web compatibility
            if (values.token) {
                localStorage.setItem('token', values.token)
            }

            message.success('设置已保存')
            onClose()

            // Reload to apply new settings
            window.location.reload()
        } catch (error) {
            console.error('Failed to save config:', error)
            message.error('保存失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title="设置"
            open={open}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    取消
                </Button>,
                <Button key="save" type="primary" loading={loading} onClick={handleSave}>
                    保存
                </Button>
            ]}
            width={500}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    apiEndpoint: 'http://localhost:8000',
                    token: ''
                }}
            >
                <Form.Item
                    name="apiEndpoint"
                    label="API 地址"
                    rules={[{ required: true, message: '请输入 API 地址' }]}
                >
                    <Input placeholder="http://localhost:8000" />
                </Form.Item>

                <Form.Item
                    name="token"
                    label="登录 Token"
                    extra="Kubernetes ServiceAccount JWT Token"
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="eyJhbGciOiJSUzI1NiIs..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
