
import { PlusOutlined } from '@ant-design/icons';
import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PatientAttributes } from 'simrs-types';
interface PatientTableProps {
  dataSource: PatientAttributes[];
  loading?: boolean;
  onRegister?: (patient: PatientAttributes) => void;
}

export const PatientTable = ({ dataSource, loading, onRegister }: PatientTableProps) => {
  const columns: ColumnsType<PatientAttributes> = [
    {
      title: 'No. RM',
      dataIndex: 'medicalRecordNumber',
      key: 'medicalRecordNumber',
    },
    {
      title: 'NIK',
      dataIndex: 'nik',
      key: 'nik',
    },
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Jenis Kelamin',
      dataIndex: 'gender',
      key: 'gender',
    },
    {
      title: 'Tanggal Lahir',
      dataIndex: 'birthDate',
      key: 'birthDate',
    },
    {
      title: 'Alamat',
      dataIndex: 'address',
      key: 'address',
    },
    {
        title:'Aksi',
        dataIndex:'action',
        key:'action',
        render:(_,record)=>(
            <Button 
                type="primary" 
                size='small' 
                icon={<PlusOutlined />}
                onClick={() => onRegister?.(record)}
            >
                Antrian
            </Button>
        )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey="id"
      className="mt-8"
      pagination={{
        showSizeChanger: false
      }}
    />
  );
};
