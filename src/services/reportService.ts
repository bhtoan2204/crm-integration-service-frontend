import { format, parseISO, startOfDay } from 'date-fns'
import type { DatePreset, ReportMetric, UnmetReason, User } from '@/models'
import { stageIndex, stageName, UNMET_REASON_LABEL } from '@/models/labels'
import { PIPELINE_STAGES } from '@/models/labels'
import { getDb } from '@/mocks/store'
import { changePercent } from '@/utils/format'
import { eachDay, inRange, resolveRange } from '@/utils/dates'
import { delay } from './delay'

export interface ReportFilters {
  preset: DatePreset
  from?: string
  to?: string
  teamId?: string
  employeeId?: string
}

export interface PerformanceRow {
  salesId: string
  name: string
  teamName: string
  leads: number
  calls: number
  durationSeconds: number
  quotations: number
  bookings: number
  completed: number
  conversionRate: number
  avgResponseMinutes: number
}

export interface DashboardData {
  rangeLabel: string
  metrics: ReportMetric[]
  funnel: Array<{ name: string; count: number }>
  leadTrend: Array<{ label: string; newLeads: number; completed: number }>
  callActivity: Array<{ name: string; calls: number; minutes: number }>
  performance: PerformanceRow[]
}

export interface ReportData {
  rangeLabel: string
  callMetrics: ReportMetric[]
  customerMetrics: ReportMetric[]
  orderMetrics: ReportMetric[]
  responseMetrics: ReportMetric[]
  unmetTotal: number
  unmetByReason: Array<{ reason: UnmetReason; label: string; count: number }>
  ranking: PerformanceRow[]
  callTrend: Array<{ label: string; calls: number; minutes: number }>
  conversionTrend: Array<{ label: string; conversion: number }>
}

function rangeLabel(preset: DatePreset, from?: string, to?: string) {
  if (preset === 'today') return 'Hôm nay'
  if (preset === '7d') return '7 ngày gần nhất'
  if (preset === '30d') return '30 ngày gần nhất'
  if (preset === 'week') return 'Tuần này'
  if (preset === 'month') return 'Tháng này'
  if (from && to) return `${from.split('-').reverse().join('/')} – ${to.split('-').reverse().join('/')}`
  return 'Khoảng tùy chọn'
}

function scopedSales(filters: ReportFilters) {
  return getDb().users.filter((user) => {
    if (user.role === 'admin') return false
    if (filters.teamId && filters.teamId !== 'all' && user.teamId !== filters.teamId) return false
    if (filters.employeeId && filters.employeeId !== 'all' && user.id !== filters.employeeId) return false
    return user.role === 'sales' || user.role === 'manager'
  })
}

function salesIds(filters: ReportFilters) {
  return new Set(scopedSales(filters).map((user) => user.id))
}

function buildPerformance(filters: ReportFilters, start: Date, end: Date): PerformanceRow[] {
  const db = getDb()
  const ids = salesIds(filters)
  return scopedSales(filters).map((user) => {
    const leads = db.leads.filter(
      (lead) => lead.assignedSalesId === user.id && inRange(lead.createdAt, start, end),
    )
    const calls = db.calls.filter(
      (call) => call.salesId === user.id && inRange(call.startedAt, start, end),
    )
    const quotations = db.quotations.filter(
      (quote) => quote.createdById === user.id && inRange(quote.createdAt, start, end),
    )
    const bookings = db.orders.filter(
      (order) =>
        order.salesId === user.id &&
        order.status !== 'cancelled' &&
        stageIndex(order.stage) >= stageIndex('booking') &&
        inRange(order.createdAt, start, end),
    )
    const completed = db.orders.filter(
      (order) =>
        order.salesId === user.id &&
        order.status === 'completed' &&
        order.completedAt &&
        inRange(order.completedAt, start, end),
    )
    const responseValues = leads.map((lead) => lead.firstResponseMinutes).filter((value) => value > 0)
    return {
      salesId: user.id,
      name: user.name,
      teamName: db.teams.find((team) => team.id === user.teamId)?.name ?? '—',
      leads: leads.length,
      calls: calls.length,
      durationSeconds: calls.reduce((sum, call) => sum + call.durationSeconds, 0),
      quotations: quotations.length,
      bookings: bookings.length,
      completed: completed.length,
      conversionRate: leads.length === 0 ? 0 : (completed.length / leads.length) * 100,
      avgResponseMinutes:
        responseValues.length === 0
          ? 0
          : responseValues.reduce((sum, value) => sum + value, 0) / responseValues.length,
    }
  }).filter((row) => ids.has(row.salesId))
}

function trendDays(start: Date, end: Date) {
  const days = eachDay(start, end)
  if (days.length <= 31) return days.map((day) => ({ day, label: format(day, 'dd/MM') }))
  const buckets: Array<{ day: Date; label: string }> = []
  for (let index = 0; index < days.length; index += 7) {
    const day = days[index]
    if (!day) continue
    buckets.push({ day, label: `Tuần ${format(day, 'dd/MM')}` })
  }
  return buckets
}

export const reportService = {
  async getDashboard(filters: ReportFilters): Promise<DashboardData> {
    await delay()
    const db = getDb()
    const range = resolveRange(filters.preset, filters.from, filters.to)
    const ids = salesIds({ ...filters, teamId: 'all', employeeId: 'all' })
    const totalLeads = db.leads.filter(
      (lead) => ids.has(lead.assignedSalesId) && parseISO(lead.createdAt) <= range.end,
    )
    const prevTotalLeads = db.leads.filter(
      (lead) => ids.has(lead.assignedSalesId) && parseISO(lead.createdAt) <= range.previousEnd,
    )
    const leads = db.leads.filter((lead) => ids.has(lead.assignedSalesId) && inRange(lead.createdAt, range.start, range.end))
    const prevLeads = db.leads.filter((lead) => ids.has(lead.assignedSalesId) && inRange(lead.createdAt, range.previousStart, range.previousEnd))
    const caring = db.leads.filter(
      (lead) => ids.has(lead.assignedSalesId) && lead.stage === 'caring' && lead.leadStatus !== 'unmet' && inRange(lead.lastContactAt, range.start, range.end),
    )
    const prevCaring = db.leads.filter(
      (lead) => ids.has(lead.assignedSalesId) && lead.stage === 'caring' && lead.leadStatus !== 'unmet' && inRange(lead.lastContactAt, range.previousStart, range.previousEnd),
    )
    const calls = db.calls.filter((call) => ids.has(call.salesId) && inRange(call.startedAt, range.start, range.end))
    const prevCalls = db.calls.filter((call) => ids.has(call.salesId) && inRange(call.startedAt, range.previousStart, range.previousEnd))
    const completed = db.orders.filter(
      (order) => ids.has(order.salesId) && order.status === 'completed' && order.completedAt && inRange(order.completedAt, range.start, range.end),
    )
    const prevCompleted = db.orders.filter(
      (order) => ids.has(order.salesId) && order.status === 'completed' && order.completedAt && inRange(order.completedAt, range.previousStart, range.previousEnd),
    )
    const pipelineValue = leads
      .filter((lead) => lead.leadStatus !== 'unmet' && lead.stage !== 'completed')
      .reduce((sum, lead) => sum + lead.expectedValue, 0)
    const prevPipelineValue = prevLeads
      .filter((lead) => lead.leadStatus !== 'unmet' && lead.stage !== 'completed')
      .reduce((sum, lead) => sum + lead.expectedValue, 0)
    const conversion = leads.length === 0 ? 0 : (completed.length / leads.length) * 100
    const prevConversion = prevLeads.length === 0 ? 0 : (prevCompleted.length / prevLeads.length) * 100
    const duration = calls.reduce((sum, call) => sum + call.durationSeconds, 0)
    const prevDuration = prevCalls.reduce((sum, call) => sum + call.durationSeconds, 0)

    const metrics: ReportMetric[] = [
      { id: 'leads', label: 'Tổng khách hàng tiềm năng', value: totalLeads.length, changePercent: changePercent(totalLeads.length, prevTotalLeads.length), hint: 'Lead đã tiếp nhận tính đến cuối kỳ' },
      { id: 'new', label: 'Lead mới hôm nay', value: leads.length, changePercent: changePercent(leads.length, prevLeads.length), hint: 'Lead tạo trong kỳ đang chọn' },
      { id: 'caring', label: 'Lead đang chăm sóc', value: caring.length, changePercent: changePercent(caring.length, prevCaring.length), hint: 'Đang ở bước chăm sóc, có liên hệ trong kỳ' },
      { id: 'calls', label: 'Cuộc gọi hôm nay', value: calls.length, changePercent: changePercent(calls.length, prevCalls.length), hint: 'Cuộc gọi phát sinh trong kỳ' },
      { id: 'duration', label: 'Tổng thời gian gọi', value: duration, unit: 'seconds', changePercent: changePercent(duration, prevDuration), hint: 'Tổng thời lượng cuộc gọi trong kỳ' },
      { id: 'completed', label: 'Đơn hoàn thành tháng này', value: completed.length, changePercent: changePercent(completed.length, prevCompleted.length), hint: 'Đơn hoàn thành trong kỳ' },
      { id: 'revenue', label: 'Doanh thu dự kiến', value: pipelineValue, unit: 'vnd', changePercent: changePercent(pipelineValue, prevPipelineValue), hint: 'Tổng giá trị dự kiến của lead chưa hoàn thành' },
      { id: 'conversion', label: 'Tỷ lệ chuyển đổi', value: conversion, unit: 'percent', changePercent: conversion - prevConversion, hint: 'Đơn hoàn thành / lead mới trong kỳ' },
    ]

    const funnel = PIPELINE_STAGES.map((stage) => ({
      name: stage.name,
      count: db.leads.filter((lead) => lead.stage === stage.id).length,
    }))

    const buckets = trendDays(range.start, range.end)
    const leadTrend = buckets.map((bucket, index) => {
      const next = buckets[index + 1]?.day ?? new Date(range.end.getTime() + 1)
      const from = startOfDay(bucket.day)
      const to = index === buckets.length - 1 ? range.end : new Date(next.getTime() - 1)
      return {
        label: bucket.label,
        newLeads: db.leads.filter((lead) => ids.has(lead.assignedSalesId) && inRange(lead.createdAt, from, to)).length,
        completed: db.orders.filter(
          (order) => ids.has(order.salesId) && order.status === 'completed' && order.completedAt && inRange(order.completedAt, from, to),
        ).length,
      }
    })

    const sales = db.users.filter((user) => user.role === 'sales')
    const callActivity = sales.map((user) => {
      const own = calls.filter((call) => call.salesId === user.id)
      return {
        name: user.name.split(' ').slice(-2).join(' '),
        calls: own.length,
        minutes: Math.round(own.reduce((sum, call) => sum + call.durationSeconds, 0) / 60),
      }
    })

    return {
      rangeLabel: rangeLabel(filters.preset, filters.from, filters.to),
      metrics,
      funnel,
      leadTrend,
      callActivity,
      performance: buildPerformance({ preset: filters.preset, from: filters.from, to: filters.to }, range.start, range.end)
        .filter((row) => db.users.find((user) => user.id === row.salesId)?.role === 'sales'),
    }
  },

  async getSummary(filters: ReportFilters): Promise<ReportData> {
    await delay()
    const db = getDb()
    const range = resolveRange(filters.preset, filters.from, filters.to)
    const ids = salesIds(filters)
    const leads = db.leads.filter((lead) => ids.has(lead.assignedSalesId) && inRange(lead.createdAt, range.start, range.end))
    const caring = db.leads.filter(
      (lead) => ids.has(lead.assignedSalesId) && lead.leadStatus === 'nurturing' && inRange(lead.lastContactAt, range.start, range.end),
    )
    const calls = db.calls.filter((call) => ids.has(call.salesId) && inRange(call.startedAt, range.start, range.end))
    const answered = calls.filter((call) => call.status === 'answered')
    const duration = calls.reduce((sum, call) => sum + call.durationSeconds, 0)
    const completed = db.orders.filter(
      (order) => ids.has(order.salesId) && order.status === 'completed' && order.completedAt && inRange(order.completedAt, range.start, range.end),
    )
    const bookings = db.orders.filter(
      (order) =>
        ids.has(order.salesId) &&
        order.status !== 'cancelled' &&
        stageIndex(order.stage) >= stageIndex('booking') &&
        inRange(order.createdAt, range.start, range.end),
    )
    const orderValue = db.orders
      .filter((order) => ids.has(order.salesId) && order.status !== 'cancelled' && inRange(order.createdAt, range.start, range.end))
      .reduce((sum, order) => sum + order.amount, 0)
    const responses = leads.map((lead) => lead.firstResponseMinutes).filter((value) => value > 0)
    const avgResponse = responses.length === 0 ? 0 : responses.reduce((sum, value) => sum + value, 0) / responses.length
    const rate = (predicate: (value: number) => boolean) =>
      responses.length === 0 ? 0 : (responses.filter(predicate).length / responses.length) * 100
    const unmet = db.unmetDemands.filter(
      (item) => ids.has(item.salesId) && inRange(item.createdAt, range.start, range.end),
    )
    const reasons = (Object.keys(UNMET_REASON_LABEL) as UnmetReason[]).map((reason) => ({
      reason,
      label: UNMET_REASON_LABEL[reason],
      count: unmet.filter((item) => item.reason === reason).length,
    }))
    const buckets = trendDays(range.start, range.end)
    const callTrend = buckets.map((bucket, index) => {
      const next = buckets[index + 1]?.day
      const from = startOfDay(bucket.day)
      const to = next ? new Date(next.getTime() - 1) : range.end
      const slice = calls.filter((call) => inRange(call.startedAt, from, to))
      return {
        label: bucket.label,
        calls: slice.length,
        minutes: Math.round(slice.reduce((sum, call) => sum + call.durationSeconds, 0) / 60),
      }
    })
    const conversionTrend = buckets.map((bucket, index) => {
      const next = buckets[index + 1]?.day
      const from = startOfDay(bucket.day)
      const to = next ? new Date(next.getTime() - 1) : range.end
      const created = leads.filter((lead) => inRange(lead.createdAt, from, to)).length
      const done = completed.filter((order) => order.completedAt && inRange(order.completedAt, from, to)).length
      return { label: bucket.label, conversion: created === 0 ? 0 : (done / created) * 100 }
    })

    return {
      rangeLabel: rangeLabel(filters.preset, filters.from, filters.to),
      callMetrics: [
        { id: 'call-count', label: 'Số lượng cuộc gọi', value: calls.length, hint: 'Trong kỳ đã chọn' },
        { id: 'call-duration', label: 'Tổng thời gian gọi', value: duration, unit: 'seconds' },
        { id: 'call-avg', label: 'Thời gian gọi trung bình', value: calls.length === 0 ? 0 : duration / calls.length, unit: 'seconds' },
        { id: 'call-success', label: 'Tỷ lệ cuộc gọi thành công', value: calls.length === 0 ? 0 : (answered.length / calls.length) * 100, unit: 'percent', hint: 'Cuộc gọi có trạng thái thành công' },
      ],
      customerMetrics: [
        { id: 'cust-total', label: 'Số khách hàng tiềm năng', value: leads.length },
        { id: 'cust-new', label: 'Lead mới', value: leads.length, hint: 'Lead tạo trong kỳ' },
        { id: 'cust-care', label: 'Lead được chăm sóc', value: caring.length, hint: 'Có liên hệ trong kỳ và đang nuôi dưỡng' },
        { id: 'cust-conv', label: 'Conversion rate', value: leads.length === 0 ? 0 : (completed.length / leads.length) * 100, unit: 'percent', hint: 'Đơn hoàn thành / lead mới' },
      ],
      orderMetrics: [
        { id: 'ord-done', label: 'Số đơn hoàn thành', value: completed.length },
        { id: 'ord-book', label: 'Số booking', value: bookings.length, hint: 'Đơn đã tới bước Booking trở đi' },
        { id: 'ord-value', label: 'Tổng giá trị đơn hàng', value: orderValue, unit: 'vnd' },
      ],
      responseMetrics: [
        { id: 'res-avg', label: 'Thời gian phản hồi trung bình', value: avgResponse, unit: 'minutes' },
        { id: 'res-5', label: 'Tỷ lệ phản hồi dưới 5 phút', value: rate((value) => value < 5), unit: 'percent' },
        { id: 'res-15', label: 'Tỷ lệ phản hồi dưới 15 phút', value: rate((value) => value < 15), unit: 'percent' },
        { id: 'res-30', label: 'Tỷ lệ phản hồi trên 30 phút', value: rate((value) => value > 30), unit: 'percent' },
      ],
      unmetTotal: unmet.length,
      unmetByReason: reasons,
      ranking: buildPerformance(filters, range.start, range.end).filter((row) => {
        const user = db.users.find((item) => item.id === row.salesId)
        return user?.role === 'sales'
      }),
      callTrend,
      conversionTrend,
    }
  },
}

export function listTeams() {
  return getDb().teams
}

export function listSalesUsers(): User[] {
  return getDb().users.filter((user) => user.role === 'sales' && user.status === 'active')
}

export function stageTitle(stageId: string) {
  return stageName(stageId as never)
}
