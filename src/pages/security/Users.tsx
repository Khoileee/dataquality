import { useMemo, useState } from 'react'
import {
  PageHeader, KpiRow, FilterBar, DataTable, Panel, Note, Chip, StatusChip, ActionButton,
  IconBtn, RowActions, EntityLink, InfoGrid, InlineTabs, Modal, useToast, Drawer, SectionTitle,
} from '@/components/common'
import { users, groupAcls, MENU_RIGHT_MATRIX_MENUS, policies, STATS, fmt } from '@/data'
import { match } from '@/lib/demo'

const RIGHT_TONE: Record<string, any> = {
  'Xem': 'n', 'Xem·Sửa': 'b', 'Xem·Duyệt': 'p', 'Xem·Sửa·Duyệt': 'g', '—': 'n',
}

export function UserList() {
  const [tab, setTab] = useState('users')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [pick, setPick] = useState<any>(null)
  const toast = useToast()

  const rows = useMemo(() => users.filter(u => (!role || u.role === role) && match(`${u.account} ${u.name} ${u.unit} ${u.role}`, q)), [q, role])
  const leavers = users.filter(u => u.status === 'Đã nghỉ việc — chưa khoá')

  return (
    <>
      <PageHeader
        code="5.1"
        title="Người dùng & Nhóm"
        desc="Quản lý tài khoản, nhóm, vai trò và quyền truy cập MENU — khác với quyền trên DỮ LIỆU ở menu 5.2"
        crumbs={[{ label: 'Data Security' }, { label: 'Người dùng & Nhóm' }]}
        actions={
          <>
            <ActionButton variant="ghost" onClick={() => toast.info('Đồng bộ nhân sự', 'Đồng bộ trạng thái từ hệ thống HR — minh hoạ.')}>Đồng bộ từ HR</ActionButton>
            <ActionButton icon="plus">Thêm người dùng</ActionButton>
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Tài khoản', value: users.length, sub: `${users.filter(u => u.status === 'Hoạt động').length} đang hoạt động` },
          { label: 'Đã nghỉ việc chưa khoá', value: STATS.leaversNotLocked, sub: `còn quyền trên ${STATS.leaverTableGrants} bảng`, tone: 'bad' },
          { label: 'Nhóm quyền', value: groupAcls.length, sub: '5 vai trò theo yêu cầu GĐ1' },
          { label: 'Chính sách quyền dữ liệu', value: fmt(STATS.totalPolicies), sub: `${fmt(STATS.policiesByGroup)} theo nhóm · ${fmt(STATS.policiesByUser)} theo người` },
          { label: 'Quyền vô thời hạn', value: `${Math.round((STATS.policiesNoExpiry / STATS.totalPolicies) * 100)}%`, sub: `${fmt(STATS.policiesNoExpiry)} chính sách`, tone: 'bad' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'users', label: 'Người dùng', badge: users.length },
            { id: 'groups', label: 'Nhóm & Quyền menu', badge: groupAcls.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'users' ? (
        <>
          <FilterBar
            placeholder="Tìm theo tài khoản, họ tên, đơn vị…"
            value={q}
            onChange={setQ}
            filters={[{ label: 'Vai trò', options: ['Người sở hữu dữ liệu', 'Đầu mối nghiệp vụ', 'Đầu mối kỹ thuật', 'Đơn vị vận hành hệ thống', 'Người sử dụng dữ liệu'], value: role, onChange: setRole }]}
            right={<span className="text-[12px] text-slate-400">{rows.length} người dùng</span>}
          />

          <DataTable
            stt
            rows={rows}
            rowKey={u => u.id}
            highlightRow={u => (u.status === 'Đã nghỉ việc — chưa khoá' ? 'bad' : u.status === 'Đã khoá' ? 'warn' : undefined)}
            columns={[
              { key: 'account', label: 'Tài khoản', nowrap: true, render: u => <span className="mono text-[12px] font-semibold">{u.account}</span> },
              { key: 'name', label: 'Họ tên', nowrap: true, render: u => <span className={u.employed ? 'font-semibold text-slate-800' : 'font-semibold text-red-600'}>{u.name}</span> },
              { key: 'unit', label: 'Đơn vị', nowrap: true },
              { key: 'role', label: 'Vai trò', nowrap: true, render: u => <Chip tone="t">{u.role}</Chip> },
              { key: 'groups', label: 'Thuộc nhóm', render: u => <div className="flex flex-wrap gap-1">{u.groups.map(g => <Chip key={g} tone="n">{g}</Chip>)}</div> },
              { key: 'userTags', label: 'Nhãn người dùng', render: u => <div className="flex flex-wrap gap-1">{u.userTags.map(t => <Chip key={t} tone="b">{t}</Chip>)}</div> },
              { key: 'tableGrants', label: 'Số bảng có quyền', align: 'right', nowrap: true, render: u => fmt(u.tableGrants) },
              { key: 'lastLogin', label: 'Đăng nhập cuối', nowrap: true, render: u => <span className="mono text-[11.5px]">{u.lastLogin}</span> },
              { key: 'status', label: 'Trạng thái', nowrap: true, render: u => <Chip tone={u.status === 'Hoạt động' ? 'g' : u.status === 'Đã khoá' ? 'n' : 'r'}>{u.status}</Chip> },
              {
                key: 'act', label: '', align: 'right', nowrap: true,
                render: u => (
                  <RowActions>
                    <IconBtn icon="view" title="Xem quyền" onClick={() => setPick(u)} />
                    {!u.employed && u.status !== 'Đã khoá' && (
                      <ActionButton variant="danger" onClick={() => toast.success('Đã khoá tài khoản', `${u.account} — thu hồi quyền trên ${u.tableGrants} bảng.`)}>Khoá ngay</ActionButton>
                    )}
                  </RowActions>
                ),
              },
            ]}
          />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Note tone="bad" title={`${leavers.length} tài khoản đã nghỉ việc nhưng chưa bị khoá`}>
              <div className="mt-1.5 space-y-1">
                {leavers.map(l => (
                  <div key={l.id} className="flex items-center justify-between rounded border border-red-200 bg-white px-2.5 py-1.5">
                    <span><b>{l.name}</b> <span className="mono text-[11px] text-slate-400">({l.account})</span> — {l.unit}</span>
                    <span className="text-[11.5px] font-semibold text-red-600">{l.tableGrants} bảng · đăng nhập cuối {l.lastLogin.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                Người dùng <b>Lý Thanh Bình</b> còn đăng nhập ngày 07/08 từ <span className="mono">IP 203.113.88.4</span> — ngoài dải nội bộ.
                Đã sinh cảnh báo BT-0040 ở menu 5.2.
              </div>
            </Note>

            <Panel title="Phân biệt quyền MENU và quyền DỮ LIỆU">
              <DataTable
                dense
                rows={[
                  { k: 'Quyền MENU', where: 'menu 5.1 — tab Nhóm & Quyền menu', what: 'Được vào màn hình nào, bấm nút nào', ex: 'Đầu mối nghiệp vụ được sửa metadata bảng' },
                  { k: 'Quyền DỮ LIỆU', where: 'menu 5.2 — Chính sách truy cập', what: 'Đọc được bảng nào, cột nào, dòng nào', ex: 'Chỉ đọc bảng thuộc miền Kinh doanh, che cột CCCD' },
                ]}
                columns={[
                  { key: 'k', label: 'Loại quyền', nowrap: true, render: r => <span className="font-bold text-blue-700">{r.k}</span> },
                  { key: 'where', label: 'Khai ở đâu', nowrap: true },
                  { key: 'what', label: 'Quyết định gì' },
                  { key: 'ex', label: 'Ví dụ' },
                ]}
              />
              <Note tone="info" className="mt-3">
                Hai lớp này <b>độc lập</b>. Có quyền menu mà không có quyền dữ liệu thì vào được màn nhưng bảng trống.
                Có quyền dữ liệu mà không có quyền menu thì không vào được màn để xem.
              </Note>
            </Panel>
          </div>
        </>
      ) : (
        <>
          <DataTable
            rows={groupAcls}
            rowKey={g => g.id}
            columns={[
              { key: 'id', label: 'Mã nhóm', nowrap: true, render: g => <span className="mono text-[12px] font-semibold">{g.id}</span> },
              { key: 'name', label: 'Tên nhóm', nowrap: true, render: g => <span className="font-semibold text-slate-800">{g.name}</span> },
              { key: 'description', label: 'Trách nhiệm chính', width: '36%' },
              { key: 'memberCount', label: 'Số thành viên', align: 'right', nowrap: true, render: g => fmt(g.memberCount) },
              { key: 'act', label: '', align: 'right', nowrap: true, render: () => <RowActions><IconBtn icon="edit" title="Sửa quyền" /></RowActions> },
            ]}
          />

          <Panel title="Ma trận Menu × Vai trò" className="mt-4" desc="Ô là mức quyền menu: Xem / Xem·Sửa / Xem·Duyệt / Xem·Sửa·Duyệt / —">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold uppercase text-slate-500">Menu</th>
                    {groupAcls.map(g => (
                      <th key={g.id} className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-center text-[10.5px] font-bold uppercase text-slate-500">
                        {g.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MENU_RIGHT_MATRIX_MENUS.map(m => (
                    <tr key={m} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="sticky left-0 z-10 bg-white px-3 py-2 font-semibold text-slate-700">{m}</td>
                      {groupAcls.map(g => {
                        const r = g.menuRights[m] ?? '—'
                        return (
                          <td key={g.id} className="px-3 py-2 text-center">
                            <Chip tone={RIGHT_TONE[r] ?? 'n'}>{r}</Chip>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Note tone="info" title="Năm vai trò theo tài liệu BDA — GĐ1 mục 2.3" className="mt-4">
            <b>Người sở hữu dữ liệu</b> phê duyệt định nghĩa, phạm vi sử dụng và cấp quyền ·
            <b> Đầu mối nghiệp vụ</b> cập nhật mô tả, thuật ngữ, công thức ·
            <b> Đầu mối kỹ thuật</b> cập nhật cấu trúc, nguồn dữ liệu, job ·
            <b> Đơn vị vận hành hệ thống</b> quản lý người dùng, phân quyền, kết nối ·
            <b> Người sử dụng dữ liệu</b> tra cứu và phản hồi.
          </Note>
        </>
      )}

      <Drawer open={!!pick} onClose={() => setPick(null)} title={pick?.name} desc={pick && `${pick.account} · ${pick.role} · ${pick.unit}`} width={600}>
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Tài khoản', value: <span className="mono">{pick.account}</span> },
                { label: 'Trạng thái', value: <Chip tone={pick.status === 'Hoạt động' ? 'g' : 'r'}>{pick.status}</Chip> },
                { label: 'Vai trò', value: pick.role },
                { label: 'Đơn vị', value: pick.unit },
                { label: 'Thuộc nhóm', value: pick.groups.join(', ') },
                { label: 'Nhãn người dùng', value: pick.userTags.join(', ') },
                { label: 'Số bảng có quyền', value: fmt(pick.tableGrants) },
                { label: 'Đăng nhập cuối', value: pick.lastLogin },
              ]}
            />
            <SectionTitle>Chính sách dữ liệu áp cho người này</SectionTitle>
            <DataTable
              dense
              rows={policies.filter(p => p.subject.includes(pick.name) || pick.groups.some((g: string) => p.subject.includes(g)))}
              rowKey={p => p.id}
              empty="Không có chính sách riêng — chỉ kế thừa quyền nhóm"
              columns={[
                { key: 'id', label: 'Mã', nowrap: true, render: p => <span className="mono text-[11.5px]">{p.id}</span> },
                { key: 'kind', label: 'Loại', nowrap: true, render: p => <Chip tone="b">{p.kind}</Chip> },
                { key: 'scope', label: 'Phạm vi' },
                { key: 'expiry', label: 'Thời hạn', nowrap: true, render: p => <span className={p.expiry === 'Vô thời hạn' ? 'font-semibold text-red-600' : ''}>{p.expiry}</span> },
              ]}
            />
            <ActionButton to="/security/report">Xem báo cáo quyền đầy đủ</ActionButton>
          </div>
        )}
      </Drawer>
    </>
  )
}
