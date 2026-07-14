// CV container. Combines header, experience section, education section, and
// selected skills (chips row). Used by the preview screen and the home view.

import { View } from 'react-native'

import { Chip } from '@/components/ui/chip'
import { Text } from '@/components/ui/text'

import { CvHeader } from './cv-header'
import { CvExperienceBlock } from './cv-experience-block'
import { CvEducationBlock } from './cv-education-block'

import type {
  EducationRow,
  ProfileRow,
  SeekerProfileRow,
  SkillRow,
  WorkExperienceRow,
} from '@/lib/seeker'

export function CvView({
  profile,
  seeker,
  workExperiences,
  educations,
  skills,
}: {
  profile: ProfileRow | null
  seeker: SeekerProfileRow | null
  workExperiences: WorkExperienceRow[]
  educations: EducationRow[]
  skills: SkillRow[]
}) {
  return (
    <View>
      <CvHeader
        firstName={profile?.first_name ?? null}
        jobTitle={seeker?.job_title ?? null}
        hasDriverLicense={seeker?.has_driver_license ?? null}
        hasCar={seeker?.has_car ?? null}
        birthYear={seeker?.birth_year ?? null}
        postalCode={seeker?.postal_code ?? null}
        city={seeker?.city ?? null}
        availableFrom={seeker?.available_from ?? null}
        salaryEur={seeker?.salary_expectation_eur ?? null}
      />

      {workExperiences.length > 0 && (
        <View className="mt-6">
          <Text variant="subheading">Berufserfahrung</Text>
          <View className="mt-2 h-px bg-brand-200" />
          {workExperiences.map((row) => (
            <CvExperienceBlock
              key={row.id}
              startMonth={row.start_month}
              startYear={row.start_year}
              endMonth={row.end_month}
              endYear={row.end_year}
              title={row.title}
              subtitle={row.subtitle}
              description={row.description}
            />
          ))}
        </View>
      )}

      {educations.length > 0 && (
        <View className="mt-6">
          <Text variant="subheading">Ausbildung</Text>
          <View className="mt-2 h-px bg-brand-200" />
          {educations.map((row) => (
            <CvEducationBlock
              key={row.id}
              startMonth={row.start_month}
              startYear={row.start_year}
              endMonth={row.end_month}
              endYear={row.end_year}
              title={row.title}
              status={row.status}
              description={row.description}
            />
          ))}
        </View>
      )}

      {skills.length > 0 && (
        <View className="mt-6">
          <Text variant="subheading">Skills</Text>
          <View className="mt-2 h-px bg-brand-200" />
          <View className="mt-3 flex-row flex-wrap gap-2">
            {skills.map((s) => (
              <Chip key={s.id}>{s.display_name}</Chip>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}
