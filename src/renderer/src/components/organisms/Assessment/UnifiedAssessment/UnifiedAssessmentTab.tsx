import { Card, Form } from 'antd'
import React from 'react'
import { PatientData } from '@renderer/types/doctor.types'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'

import { AnamnesisForm } from '../Anamnesis/AnamnesisForm'
import { PastDiseaseForm } from '../PastDisease/PastDiseaseForm'
import { AllergyForm } from '../Allergy/AllergyForm'
import { MedicationForm } from '../Medication/MedicationForm'
import { FamilyHistoryForm } from '../FamilyHistory/FamilyHistoryForm'
import { PhysicalAssessmentForm } from '../PhysicalAssessment/PhysicalAssessmentForm'
import { FunctionalAssessmentForm } from '../FunctionalAssessment/FunctionalAssessmentForm'
import { RiwayatPerjalananPenyakitForm } from '../RiwayatPerjalananPenyakitForm'
import { GoalForm } from '../Goal/GoalForm'
import { CarePlanForm } from '../Careplan/CarePlanForm'
import { InstruksiMedikForm } from '../Careplan/InstruksiMedikForm'
import { RasionalKlinisForm } from '../RasionalKlinisForm'
import { PrognosisForm } from '../Prognosis/PrognosisForm'

interface UnifiedAssessmentTabProps {
  encounterId: string
  patientData: PatientData
}

export const UnifiedAssessmentTab: React.FC<UnifiedAssessmentTabProps> = ({
  encounterId,
  patientData
}) => {
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  const [headerForm] = Form.useForm()
  const globalPerformerId = Form.useWatch('performerId', headerForm)

  const commonProps = {
    encounterId,
    patientData,
    hideHeader: true,
    globalPerformerId
  }

  const items = [
    {
      key: '1',
      label: 'Anamnesis (Keluhan Utama & RPS)',
      children: <AnamnesisForm {...commonProps} />
    },
    {
      key: '2',
      label: 'Riwayat Penyakit Dahulu',
      children: <PastDiseaseForm {...commonProps} />
    },
    {
      key: '3',
      label: 'Alergi',
      children: <AllergyForm {...commonProps} />
    },
    {
      key: '4',
      label: 'Riwayat Penggunaan Obat',
      children: <MedicationForm {...commonProps} />
    },
    {
      key: '5',
      label: 'Riwayat Penyakit Keluarga',
      children: <FamilyHistoryForm {...commonProps} />
    },
    {
      key: '6',
      label: 'Pemeriksaan Fisik',
      children: <PhysicalAssessmentForm {...commonProps} />
    },
    {
      key: '7',
      label: 'Riwayat Perjalanan Penyakit',
      children: <RiwayatPerjalananPenyakitForm {...commonProps} />
    },
    {
      key: '8',
      label: 'Asesmen Fungsional',
      children: <FunctionalAssessmentForm {...commonProps} />
    },
    {
      key: '9',
      label: 'Tujuan Perawatan (Goals)',
      children: <GoalForm {...commonProps} />
    },
    {
      key: '10',
      label: 'Rencana Rawat Pasien (Care Plan)',
      children: <CarePlanForm {...commonProps} />
    },
    {
      key: '11',
      label: 'Instruksi Medik & Keperawatan',
      children: <InstruksiMedikForm {...commonProps} />
    },
    {
      key: '12',
      label: 'Rasional Klinis',
      children: <RasionalKlinisForm {...commonProps} />
    },
    {
      key: '13',
      label: 'Prognosis Klinis',
      children: <PrognosisForm {...commonProps} />
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <Form form={headerForm} layout="vertical">
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
      </Form>

      {items.map((item) => (
        <Card key={item.key} title={item.label} className="w-full">
          {item.children}
        </Card>
      ))}
    </div>
  )
}
