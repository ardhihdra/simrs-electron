/**
 * purpose: Render assessment metadata inputs (assessment datetime and performer) for parent assessment forms.
 * main callers: `VitalSignsMonitoringForm`, `InitialAssessmentForm`, and other assessment containers.
 * key dependencies: Ant Design `Form`, `DatePicker`, `Select`; profile source `useMyProfile`.
 * main/public functions: `AssessmentHeader`.
 * side effects: Prefills `performerId` in parent form state based on current profile and available performers.
 */
import { DatePicker, Form, Select } from 'antd'
import React, { useEffect } from 'react'
import { useMyProfile } from '@renderer/hooks/useProfile'

const { Option } = Select

interface Performer {
  id: number | string
  name: string
}

interface AssessmentHeaderProps {
  performers?: Performer[]
  loading?: boolean
  /** @deprecated No longer used as we now show all performers by default */
  filterWithLogin?: boolean
  /** If true, will automatically set the value to current login if empty or when requested */
  forceCurrentLogin?: boolean
  /** If false, header fields are optional for parent form validation */
  required?: boolean
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  performers = [],
  loading = false,
  forceCurrentLogin = false,
  required = true
}) => {
  const form = Form.useFormInstance()
  const { profile } = useMyProfile()

  useEffect(() => {
    const currentPerformer = form.getFieldValue('performerId')

    // Logic: override if forced OR if empty
    if (profile?.id && performers.length > 0) {
      const isCurrentNotFoundInList =
        currentPerformer && !performers.some((p) => String(p.id) === String(currentPerformer))

      if (!currentPerformer || forceCurrentLogin || isCurrentNotFoundInList) {
        const found = performers.find((p) => String(p.id) === String(profile.id))
        if (found) {
          form.setFieldValue('performerId', found.id)
        }
      }
    }
  }, [performers, profile, form, forceCurrentLogin])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Form.Item
          label={<span className="font-semibold">Tanggal Asesmen</span>}
          name="assessment_date"
          rules={required ? [{ required: true, message: 'Wajib memilih tanggal asesmen' }] : []}
          className="mb-0"
        >
          <DatePicker showTime className="w-full" format="DD MMM YYYY HH:mm" />
        </Form.Item>
      </div>
      <div>
        <Form.Item
          label={<span className="font-semibold">Petugas Pemeriksa</span>}
          name="performerId"
          rules={required ? [{ required: true, message: 'Wajib memilih petugas pemeriksa' }] : []}
          className="mb-0"
        >
          <Select
            showSearch
            placeholder="Pilih Petugas"
            loading={loading}
            optionFilterProp="children"
            filterOption={(input, option) =>
              String(option?.children ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {performers.map((p) => (
              <Option key={String(p.id)} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>
    </div>
  )
}
