import type { ComponentType } from 'npm:react@18.3.1'
import { template as newParentMessage } from './new-parent-message.tsx'
import { template as portalMessageNotification } from './portal-message-notification.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string | ((data: any) => string)
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'new-parent-message': newParentMessage,
  'portal-message-notification': portalMessageNotification,
}
