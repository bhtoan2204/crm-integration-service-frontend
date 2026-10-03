import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/features/auth/AuthProvider'
import { useStoreQuery } from '@/hooks/useStoreQuery'
import type { Integration, IntegrationDraft, IntegrationType } from '@/models'
import { integrationService } from '@/services/integrationService'

const EMPTY: IntegrationDraft = { name: '', baseUrl: '', apiKey: '', secret: '', webhookUrl: '', syncEnabled: false }

export function IntegrationsPage() {
  const { can } = useAuth()
  const integrations = useStoreQuery(() => integrationService.list(), [])
  const [current, setCurrent] = useState<Integration | null>(null)
  const [draft, setDraft] = useState<IntegrationDraft>(EMPTY)
  const [testing, setTesting] = useState(false)

  const open = (integration: Integration) => {
    if (!can('integrations.configure')) {
      toast.error('Bạn không có quyền cấu hình tích hợp.')
      return
    }
    setCurrent(integration)
    setDraft({ ...EMPTY, name: integration.name })
  }

  return (
    <div>
      <PageHeader
        title="Tích hợp"
        description="Nhà cung cấp CRM và tổng đài chưa được chốt. Màn hình này chỉ mô phỏng cấu hình, không lưu khóa bí mật."
      />
      {integrations.error ? <p className="text-sm text-rose-700">{integrations.error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {(integrations.data ?? []).map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{integration.name}</CardTitle>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Chưa kết nối</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="min-h-12 text-sm text-muted-foreground">{integration.description}</p>
              <Button className="mt-4" variant="outline" onClick={() => open(integration)}>Cấu hình</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={Boolean(current)} onOpenChange={(next) => { if (!next) setCurrent(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cấu hình {current?.name}</DialogTitle>
            <DialogDescription>Thông tin xác thực chỉ nằm trên form này và sẽ bị xóa khi đóng. Không ghi vào bộ nhớ ứng dụng.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Tên tích hợp</Label><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
            <div><Label>Base URL</Label><Input value={draft.baseUrl} onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })} placeholder="https://" /></div>
            <div><Label>API Key</Label><Input type="password" value={draft.apiKey} onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })} /></div>
            <div><Label>Secret</Label><Input type="password" value={draft.secret} onChange={(event) => setDraft({ ...draft, secret: event.target.value })} /></div>
            <div><Label>Webhook URL</Label><Input value={draft.webhookUrl} onChange={(event) => setDraft({ ...draft, webhookUrl: event.target.value })} /></div>
            <label className="flex items-center justify-between text-sm">
              Bật đồng bộ
              <Switch checked={draft.syncEnabled} onCheckedChange={(syncEnabled) => setDraft({ ...draft, syncEnabled })} />
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={testing || !current}
              onClick={() => {
                if (!current) return
                setTesting(true)
                void integrationService.test(current.type as IntegrationType, draft).then((result) => {
                  toast.message(result.message)
                }).finally(() => setTesting(false))
              }}
            >
              {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
            </Button>
            <Button
              onClick={() => {
                toast.success('Không lưu cấu hình. Khóa bí mật không được ghi lại vì nhà cung cấp chưa được chốt.')
                setDraft(EMPTY)
                setCurrent(null)
              }}
            >
              Đóng không lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
