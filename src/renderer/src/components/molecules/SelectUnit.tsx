import { useUnitOptions } from "@renderer/hooks/query/use-unit"
import { Form, Select } from "antd"

export default function SelectUnit({ field, name, rules, className, label }: {
  field: any;
  name: any;
  rules: any[];
  className?: string;
  label?: React.ReactNode;
}) {
  const unitOptions = useUnitOptions()

  return (
    <Form.Item
      {...field}
      name={name}
      className={className}
      rules={rules}
      label={label}
    >
      <Select
        showSearch
        placeholder="Satuan beli"
        options={unitOptions}
        optionFilterProp="label"
      />
    </Form.Item>
  )
}