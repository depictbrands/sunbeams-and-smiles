/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  parentName?: string
  parentEmail?: string
  teacherName?: string
  subject?: string
  body?: string
}

const Email = ({
  parentName = 'Un padre',
  parentEmail = '',
  teacherName = 'una maestra',
  subject = '(sin asunto)',
  body = '',
}: Props) => (
  <Html lang="es">
    <Head />
    <Preview>{`Nuevo mensaje de ${parentName} para ${teacherName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nuevo mensaje en el portal</Heading>
        <Text style={text}>
          <strong>De:</strong> {parentName} {parentEmail ? `<${parentEmail}>` : ''}
        </Text>
        <Text style={text}>
          <strong>Para:</strong> {teacherName}
        </Text>
        <Text style={text}>
          <strong>Asunto:</strong> {subject}
        </Text>
        <Hr style={hr} />
        <Section>
          <Text style={messageBody}>{body}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Preescolar Sonsoles — Aviso automático del portal de padres.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) =>
    `[Portal] ${d.parentName ?? 'Padre'} → ${d.teacherName ?? 'Maestra'}: ${d.subject ?? ''}`,
  displayName: 'Nuevo mensaje de padre',
  to: 'preescolarsonsoles@gmail.com',
  previewData: {
    parentName: 'Maria Perez',
    parentEmail: 'maria@example.com',
    teacherName: 'Yeidy',
    subject: 'Pregunta sobre el horario',
    body: 'Buenas tardes, quisiera saber...',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { color: '#1f2937', fontSize: '22px', marginBottom: '16px' }
const text = { color: '#374151', fontSize: '14px', margin: '4px 0' }
const messageBody = {
  color: '#1f2937',
  fontSize: '15px',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
}
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const footer = { color: '#6b7280', fontSize: '12px', marginTop: '16px' }
