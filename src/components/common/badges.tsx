import type {
  CallResult,
  CallStatus,
  DocumentStatus,
  LeadStatus,
  OrderStatus,
  PipelineStageId,
  Priority,
  QuotationStatus,
} from '@/models'
import {
  CALL_RESULT_LABEL,
  CALL_STATUS_LABEL,
  DOCUMENT_STATUS_LABEL,
  LEAD_STATUS_BADGE,
  LEAD_STATUS_LABEL,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  QUOTE_STATUS_BADGE,
  QUOTE_STATUS_LABEL,
  STAGE_BADGE,
  stageName,
} from '@/models/labels'
import { cn } from '@/lib/utils'

export function StageBadge({ stage, className }: { stage: PipelineStageId; className?: string }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', STAGE_BADGE[stage], className)}>{stageName(stage)}</span>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', PRIORITY_BADGE[priority])}>{PRIORITY_LABEL[priority]}</span>
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', LEAD_STATUS_BADGE[status])}>{LEAD_STATUS_LABEL[status]}</span>
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', ORDER_STATUS_BADGE[status])}>{ORDER_STATUS_LABEL[status]}</span>
}

export function QuoteStatusBadge({ status }: { status: QuotationStatus }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', QUOTE_STATUS_BADGE[status])}>{QUOTE_STATUS_LABEL[status]}</span>
}

export function CallStatusBadge({ status }: { status: CallStatus }) {
  const tone = status === 'answered' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : status === 'missed' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-slate-100 text-slate-700 ring-slate-200'
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tone)}>{CALL_STATUS_LABEL[status]}</span>
}

export function CallResultText({ result }: { result: CallResult }) {
  return <span>{CALL_RESULT_LABEL[result]}</span>
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const tone = status === 'verified' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : status === 'rejected' ? 'bg-rose-50 text-rose-700 ring-rose-200' : status === 'pending' ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-sky-50 text-sky-800 ring-sky-200'
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tone)}>{DOCUMENT_STATUS_LABEL[status]}</span>
}
