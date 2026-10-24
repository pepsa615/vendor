import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/client.ts";
import { Badge } from "../ui/Badge.tsx";
import { Button } from "../ui/Button.tsx";
import { SearchInput } from "../ui/SearchInput.tsx";

type SearchItem = { label: string; detail: string; href: string };
type SearchResult = Record<string, SearchItem[]>;
type Notice = {
  id: string;
  title: string;
  body: string;
  href?: string;
  readAt?: string;
  createdAt: string;
};
type NoticePage = { items: Notice[]; unread: number };

export function HeaderTools() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const results = useQuery({
    queryKey: ["global-search", debounced],
    queryFn: () =>
      apiRequest<SearchResult>(`/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
  });
  const notices = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<NoticePage>("/notifications?pageSize=10"),
    refetchInterval: 30_000,
  });
  const mark = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () =>
      apiRequest("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const groups = Object.entries(results.data ?? {}).filter(
    ([, items]) => items.length,
  );
  return (
    <div className="flex items-center gap-3">
      <div className="relative hidden w-72 md:block">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search orders, dispatches, people…"
        />
        {debounced.length >= 2 && (
          <div className="absolute right-0 top-12 z-40 max-h-96 w-full overflow-auto rounded-xl border border-border bg-panel p-2 text-foreground shadow-overlay">
            {groups.length ? (
              groups.map(([group, items]) => (
                <div key={group} className="mb-2">
                  <p className="px-2 py-1 text-xs font-semibold uppercase text-muted">
                    {group}
                  </p>
                  {items.map((item) => (
                    <Button
                      variant="ghost"
                      key={`${group}-${item.href}`}
                      className="block h-auto w-full border-0 px-2 py-2 text-left font-normal shadow-none hover:bg-neutral-50"
                      onClick={() => {
                        setSearch("");
                        navigate(item.href);
                      }}
                    >
                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="block text-xs text-muted">
                        {item.detail}
                      </span>
                    </Button>
                  ))}
                </div>
              ))
            ) : (
              <p className="p-3 text-sm text-muted">No matching records.</p>
            )}
          </div>
        )}
      </div>
      {mobileSearchOpen && (
        <div className="fixed inset-x-3 top-20 z-50 rounded-xl border border-border bg-panel p-3 text-foreground shadow-overlay md:hidden">
          <SearchInput
            autoFocus
            value={search}
            onChange={setSearch}
            placeholder="Search orders, dispatches, people…"
          />
          {debounced.length >= 2 && (
            <div className="mt-2 max-h-[60vh] overflow-auto">
              {groups.length ? (
                groups.map(([group, items]) => (
                  <div key={group} className="mb-2">
                    <p className="px-2 py-1 text-xs font-semibold uppercase text-muted">
                      {group}
                    </p>
                    {items.map((item) => (
                      <Button
                        variant="ghost"
                        key={`${group}-${item.href}`}
                        className="block h-auto w-full border-0 px-2 py-2 text-left font-normal shadow-none"
                        onClick={() => {
                          setSearch("");
                          setMobileSearchOpen(false);
                          navigate(item.href);
                        }}
                      >
                        <span className="block text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="block text-xs text-muted">
                          {item.detail}
                        </span>
                      </Button>
                    ))}
                  </div>
                ))
              ) : (
                <p className="p-3 text-sm text-muted">No matching records.</p>
              )}
            </div>
          )}
        </div>
      )}
      <span
        className="grid size-9 place-items-center rounded-full bg-white text-brand"
        aria-label="Messages"
      >
        <Mail className="size-5" />
      </span>
      <div className="relative">
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          type="button"
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
          onClick={() => setNotificationsOpen((open) => !open)}
          className="relative grid size-9 place-items-center rounded-full border-white/30 text-white hover:bg-white/10"
        >
          <Bell className="size-5" />
          {Boolean(notices.data?.unread) && (
            <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-xs text-white">
              {notices.data!.unread}
            </span>
          )}
        </Button>
        {notificationsOpen && (
          <div className="absolute right-0 top-12 z-50 w-96 overflow-hidden rounded-xl border border-border bg-panel text-foreground shadow-overlay">
            <div className="flex items-center justify-between bg-brand-50 px-4 py-3">
              <h2 className="font-bold italic">
                Notifications ({notices.data?.unread ?? 0})
              </h2>
              {Boolean(notices.data?.unread) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markAll.mutate()}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-auto p-3">
              {notices.data?.items.length ? (
                notices.data.items.map((notice) => (
                  <Button
                    variant="ghost"
                    key={notice.id}
                    className="block h-auto w-full border-0 p-3 text-left font-normal shadow-none hover:bg-neutral-50"
                    onClick={() => {
                      if (!notice.readAt) mark.mutate(notice.id);
                      if (notice.href) navigate(notice.href);
                    }}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      {!notice.readAt && <Badge tone="danger">New</Badge>}
                      {notice.title}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {notice.body}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {new Date(notice.createdAt).toLocaleString()}
                    </span>
                  </Button>
                ))
              ) : (
                <p className="p-8 text-center text-sm text-muted">
                  You have no notifications.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        iconOnly
        size="sm"
        type="button"
        aria-label="Global search"
        aria-expanded={mobileSearchOpen}
        onClick={() => setMobileSearchOpen((open) => !open)}
        className="text-white hover:bg-white/10 md:hidden"
      >
        <Search className="size-5" />
      </Button>
    </div>
  );
}
