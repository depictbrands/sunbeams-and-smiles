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
  senderName?: string
  subject?: string
  body?: string
  portalUrl?: string
}

const Email = ({
  recipientName = '',
  senderName = 'Una familia',
  subject = '(sin asunto)',
  body = '',
  portalUrl = 'https://preescolarsonsoles.com/portal-padres',
}: Props) => (
  <Html lang="es">
    <Head />
    <Preview>{`Nuevo mensaje de ${senderName} en el portal`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Tienes un nuevo mensaje en el portal</Heading>
        <Text style={text}>
          {recipientName ? `Hola ${recipientName},` : 'Hola,'}
        </Text>
        <Text style={text}>
          <strong>{senderName}</strong> te escribió un mensaje en el portal de padres.
        </Text>
        <Text style={text}>
          <strong>Asunto:</strong> {subject}
        </Text>
        <Hr style={hr} />
        <Section>
          <Text style={messageBody}>{body}</Text>
        </Section>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={portalUrl} style={button}>
            Abrir el portal
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Preescolar Sonsoles — Aviso automático del portal de padres. Responde desde el portal.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `[Portal] Nuevo mensaje de ${d.senderName ?? 'una familia'}`,
  displayName: 'Nuevo mensaje en el portal',
  previewData: {
    recipientName: 'Yeidy',
    senderName: 'Maria Perez',
    subject: 'Pregunta sobre el horario',
    body: 'Buenas tardes, quisiera saber...',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { color: '#1f2937', fontSize: '22px', marginBottom: '16px' }
const text = { color: '#374151', fontSize: '14px', margin: '6px 0' }
const messageBody = {
  color: '#1f2937',
  fontSize: '15px',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
}
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
