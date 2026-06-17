import { useEffect, useMemo, useState } from 'react';
import { FolderOpen, Plus, Download, Trash2, Lock, Eye, Pencil, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { OPERATORS, PLANT_GROUPS } from '@/data/mockData';

type Permission = { operatorIds: string[]; groupIds: string[]; everyone: boolean };
type Attachment = { name: string; size: number; dataUrl: string };
type Post = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: string;
  attachments: Attachment[];
  view: Permission;
  edit: Permission;
};

const STORAGE_KEY = 'k-rems-data-board-v1';
// 데모용 "현재 로그인 사용자"
const CURRENT_USER = OPERATORS[0]; // 윤지훈

const seed = (): Post[] => [
  {
    id: 'P-001',
    title: '[필독] 2026년 월간 점검 양식 v3',
    body: '신규 점검 양식을 첨부합니다. 5월 점검분부터 적용해 주세요.',
    authorId: 'OP-01',
    createdAt: '2026-05-12 09:14',
    attachments: [],
    view: { operatorIds: [], groupIds: [], everyone: true },
    edit: { operatorIds: ['OP-01'], groupIds: [], everyone: false },
  },
  {
    id: 'P-002',
    title: '영남권 RTU 펌웨어 업데이트 가이드',
    body: '영남권 담당자만 열람 가능합니다.',
    authorId: 'OP-02',
    createdAt: '2026-05-15 16:02',
    attachments: [],
    view: { operatorIds: ['OP-02'], groupIds: ['G-MGR-02'], everyone: false },
    edit: { operatorIds: ['OP-02'], groupIds: [], everyone: false },
  },
];

function load(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    return JSON.parse(raw);
  } catch {
    return seed();
  }
}
function save(posts: Post[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }

function canView(p: Post, userId: string) {
  if (p.view.everyone) return true;
  if (p.view.operatorIds.includes(userId)) return true;
  return p.view.groupIds.some(gid => PLANT_GROUPS.find(g => g.id === gid && g.type === 'operator')); // 데모: 그룹 매칭 단순화
}
function canEdit(p: Post, userId: string) {
  if (p.authorId === userId) return true;
  if (p.edit.everyone) return true;
  return p.edit.operatorIds.includes(userId);
}

export default function DataBoard() {
  const [posts, setPosts] = useState<Post[]>(() => load());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);

  useEffect(() => { save(posts); }, [posts]);

  const visible = useMemo(() => posts.filter(p => canView(p, CURRENT_USER.id)), [posts]);

  const handleSave = (post: Post) => {
    setPosts(prev => {
      const exists = prev.find(p => p.id === post.id);
      return exists ? prev.map(p => p.id === post.id ? post : p) : [post, ...prev];
    });
    setOpen(false);
    setEditing(null);
    toast.success('저장되었습니다.');
  };

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success('삭제되었습니다.');
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-secondary" />
          <h1 className="text-xl font-bold">자료관리</h1>
          <span className="text-xs text-muted-foreground ml-2">담당자 자료 게시판 · 열람/수정 권한 관리</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">현재 사용자: <b>{CURRENT_USER.name}</b> ({CURRENT_USER.role})</span>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />글쓰기
          </Button>
        </div>
      </header>

      <div className="panel">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="w-16 px-3 py-2 text-left">번호</th>
                <th className="px-3 py-2 text-left">제목</th>
                <th className="w-24 px-3 py-2 text-left">첨부</th>
                <th className="w-28 px-3 py-2 text-left">작성자</th>
                <th className="w-36 px-3 py-2 text-left">작성일</th>
                <th className="w-40 px-3 py-2 text-left">권한</th>
                <th className="w-24 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted-foreground py-10">열람 가능한 게시글이 없습니다.</td></tr>
              )}
              {visible.map(p => {
                const author = OPERATORS.find(o => o.id === p.authorId);
                const editable = canEdit(p, CURRENT_USER.id);
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30 align-top">
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{p.title}</div>
                      {p.body && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.body}</div>}
                      {p.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.attachments.map(a => (
                            <a key={a.name} href={a.dataUrl} download={a.name}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border hover:bg-muted">
                              <Download className="h-3 w-3" />{a.name} <span className="text-muted-foreground">({Math.round(a.size/1024)}KB)</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">{p.attachments.length > 0 ? <Badge variant="secondary">{p.attachments.length}</Badge> : '-'}</td>
                    <td className="px-3 py-2 text-xs">{author?.name ?? p.authorId}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{p.createdAt}</td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{p.view.everyone ? '전체' : `${p.view.operatorIds.length + p.view.groupIds.length}건`}</span>
                        <span className="inline-flex items-center gap-1"><Pencil className="h-3 w-3" />{p.edit.everyone ? '전체' : `${p.edit.operatorIds.length + p.edit.groupIds.length}건`}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {editable ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <Lock className="h-3 w-3 text-muted-foreground inline" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PostDialog
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}
        post={editing}
        onSave={handleSave}
      />
    </div>
  );
}

function emptyPost(): Post {
  return {
    id: `P-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    title: '',
    body: '',
    authorId: CURRENT_USER.id,
    createdAt: new Date().toLocaleString('ko-KR', { hour12: false }).replace(/\. /g, '-').replace('.', ''),
    attachments: [],
    view: { operatorIds: [], groupIds: [], everyone: true },
    edit: { operatorIds: [CURRENT_USER.id], groupIds: [], everyone: false },
  };
}

function PostDialog({ open, onOpenChange, post, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; post: Post | null; onSave: (p: Post) => void }) {
  const [draft, setDraft] = useState<Post>(post ?? emptyPost());

  useEffect(() => { setDraft(post ?? emptyPost()); }, [post, open]);

  const operatorGroups = PLANT_GROUPS.filter(g => g.type === 'operator');

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name}: 5MB 초과`); continue; }
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      arr.push({ name: f.name, size: f.size, dataUrl });
    }
    setDraft(d => ({ ...d, attachments: [...d.attachments, ...arr] }));
  };

  const submit = () => {
    if (!draft.title.trim()) { toast.error('제목을 입력하세요.'); return; }
    onSave(draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? '게시글 수정' : '게시글 작성'}</DialogTitle>
          <DialogDescription>제목·내용·첨부파일 및 열람/수정 권한을 설정합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>제목</Label>
            <Input value={draft.title} onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="제목을 입력하세요" />
          </div>
          <div>
            <Label>내용</Label>
            <Textarea value={draft.body} onChange={(e) => setDraft(d => ({ ...d, body: e.target.value }))} rows={4} />
          </div>
          <div>
            <Label className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />첨부파일</Label>
            <Input type="file" multiple onChange={(e) => onFiles(e.target.files)} />
            {draft.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {draft.attachments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                    <span>{a.name} <span className="text-muted-foreground">({Math.round(a.size/1024)}KB)</span></span>
                    <button onClick={() => setDraft(d => ({ ...d, attachments: d.attachments.filter((_, idx) => idx !== i) }))}>
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <PermissionEditor
            label="열람권한"
            icon={<Eye className="h-3 w-3" />}
            value={draft.view}
            onChange={(v) => setDraft(d => ({ ...d, view: v }))}
            operatorGroups={operatorGroups}
          />
          <PermissionEditor
            label="수정권한"
            icon={<Pencil className="h-3 w-3" />}
            value={draft.edit}
            onChange={(v) => setDraft(d => ({ ...d, edit: v }))}
            operatorGroups={operatorGroups}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={submit}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionEditor({ label, icon, value, onChange, operatorGroups }: {
  label: string;
  icon: React.ReactNode;
  value: Permission;
  onChange: (v: Permission) => void;
  operatorGroups: typeof PLANT_GROUPS;
}) {
  const toggleOp = (id: string) => {
    onChange({ ...value, operatorIds: value.operatorIds.includes(id) ? value.operatorIds.filter(x => x !== id) : [...value.operatorIds, id] });
  };
  const toggleGrp = (id: string) => {
    onChange({ ...value, groupIds: value.groupIds.includes(id) ? value.groupIds.filter(x => x !== id) : [...value.groupIds, id] });
  };

  return (
    <div className="border rounded-md p-3 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <Label className="inline-flex items-center gap-1 font-semibold">{icon}{label}</Label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <Checkbox checked={value.everyone} onCheckedChange={(c) => onChange({ ...value, everyone: !!c })} />
          전체 허용
        </label>
      </div>
      {!value.everyone && (
        <>
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">담당자별</div>
            <div className="flex flex-wrap gap-1">
              {OPERATORS.map(o => {
                const on = value.operatorIds.includes(o.id);
                return (
                  <button key={o.id} type="button" onClick={() => toggleOp(o.id)}
                    className={`text-xs px-2 py-0.5 rounded border ${on ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}>
                    {o.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">그룹별 (담당자 그룹)</div>
            <div className="flex flex-wrap gap-1">
              {operatorGroups.map(g => {
                const on = value.groupIds.includes(g.id);
                return (
                  <button key={g.id} type="button" onClick={() => toggleGrp(g.id)}
                    className={`text-xs px-2 py-0.5 rounded border ${on ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}>
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
