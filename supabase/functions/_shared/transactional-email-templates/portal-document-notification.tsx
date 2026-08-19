/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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
  recipientName?: string
  studentName?: string
  categoryLabel?: string
  documentTitle?: string
  portalUrl?: string
}

const Email = ({
  recipientName = '',
  studentName = '',
  categoryLabel = 'Documento',
  documentTitle = '',
  portalUrl = 'https://preescolarsonsoles.com/portal-padres',
}: Props) => (
  <Html lang="es">
    <Head />
    <Preview>{`Nuevo documento disponible en el portal: ${categoryLabel}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nuevo documento en el portal</Heading>
        <Text style={text}>{recipientName ? `Hola ${recipientName},` : 'Hola,'}</Text>
        <Text style={text}>
          La escuela subió un documento{studentName ? ` de ${studentName}` : ''} a su expediente en el
          portal de padres.
        </Text>
        <Hr style={hr} />
        <Section>
          <Text style={text}>
            <strong>Categoría:</strong> {categoryLabel}
          </Text>
          {documentTitle ? (
            <Text style={text}>
              <strong>Documento:</strong> {documentTitle}
            </Text>
          ) : null}
        </Section>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={portalUrl} style={button}>
            Ver el documento
          </Button>
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
  subject: (d: Props) => `[Portal] Nuevo documento: ${d.categoryLabel ?? 'documento'}`,
  displayName: 'Nuevo documento en el portal',
  previewData: {
    recipientName: 'Maria',
    studentName: 'Lucas Perez',
    categoryLabel: 'Vacunas',
    documentTitle: 'Certificado de vacunas 2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { color: '#1f2937', fontSize: '22px', marginBottom: '16px' }
const text = { color: '#374151', fontSize: '14px', margin: '6px 0' }
const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  padding: '12px 22px',
  textDecoration: 'none',
}
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const footer = { color: '#6b7280', fontSize: '12px', marginTop: '16px' }
