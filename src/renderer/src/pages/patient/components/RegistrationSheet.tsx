import { SelectAsync } from '@renderer/components/dynamic/SelectAsync';
import { PatientAttributes } from '@shared/patient';
import { useMutation } from '@tanstack/react-query';
import { Button, DatePicker, Drawer, Form, Space } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';

export type RegistrationSheetProps = {
  open: boolean;
  onClose: () => void;
  patient?: PatientAttributes;
  onFinish?: (values: any) => Promise<void>;
};

const RegistrationSheet = ({ open, onClose, patient, onFinish }: RegistrationSheetProps) => {
  const [form] = Form.useForm();
  const mutate = useMutation({
    mutationFn: (values: any) => {
      const fn = window.api.query.queue.create
      if(!fn){
        throw new Error('Failed to load data')
      }
      return fn(values)
    },
    onSuccess: () => {
        console.log('success')
    },
    onError: (error) => {
      console.error(error);
    },
  });

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        queueDate: dayjs(),
      });
    } else {
        form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async (values: any) => {
    const formattedValues = {
        ...values,
        queueDate: values.queueDate ? dayjs(values.queueDate).format('YYYY-MM-DD') : undefined
    }
    mutate.mutate({ ...formattedValues, patientId: patient?.id });
      if (onFinish) {
          await onFinish({ ...formattedValues, patientId: patient?.id });
      }
  };

  return (
    <Drawer
      title={`Pendaftaran Pasien: ${patient?.name || ''}`}
      width={600}
      open={open}
      onClose={onClose}
      maskClosable={false}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>
            Daftar
          </Button>
        </Space>
      }
    >
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
                queueDate: dayjs(),
            }}
        >
            <Form.Item
                name="queueDate"
                label="Tanggal Antrian"
                rules={[{ required: true, message: 'Harap pilih tanggal' }]}
            >
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
                name="serviceUnitCodeId"
                label="Unit Layanan"
                rules={[{ required: true, message: 'Harap pilih unit layanan' }]}
            >
                <SelectAsync entity='referencecode' display='display' output='code' filters={{ category: "SERVICE_UNIT" }} />
            </Form.Item>

            <Form.Item
                name="poliCodeId"
                label="Sub-Poli / Ruangan"
                rules={[{ required: true, message: 'Harap pilih sub-poli' }]}
            >
                <SelectAsync entity='poli' />
            </Form.Item>

            <Form.Item
                name="registrationChannelCodeId"
                label="Registrasi"
                rules={[{ required: true, message: 'Harap pilih registrasi' }]}
                initialValue={'OFFLINE'}
            >
               <SelectAsync entity='referencecode' display='display' output='code' filters={{ category: "REGISTRATION_CHANNEL" }} disabled/>
            </Form.Item>

             <Form.Item
          name="assuranceCodeId"
          label="Asuransi"
          rules={[{ required: true, message: 'Harap pilih asuransi' }]}
        >
          <SelectAsync
            entity={'referencecode'}
            display='display'
            output='code'
            filters={{ category: "ASSURANCE" }}
          />
        </Form.Item>

        <Form.Item
          name="practitionerId"
          label="Dokter"
          rules={[{ required: true, message: 'Harap pilih dokter' }]}
        >
        
          <SelectAsync
                      display="namaLengkap"
                      entity="kepegawaian"
                     
                      output="id"
                    
                      filters={{
                          hakAksesId: "doctor"
                      }}      />
        </Form.Item>
        </Form>
    </Drawer>
  );
};

export default RegistrationSheet;
